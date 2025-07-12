from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
import pandas as pd
import numpy as np
from faker import Faker
import os
from dotenv import load_dotenv
import json
from bson import ObjectId
import uuid
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Customer Health Intelligence Dashboard", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/customer_health_db")
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_default_database()

# Security
security = HTTPBearer()

# Pydantic models
class CustomerProfile(BaseModel):
    customer_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: str
    registration_date: datetime
    customer_tier: str  # Bronze, Silver, Gold, Platinum
    region: str
    total_orders: int = 0
    total_spent: float = 0.0
    last_order_date: Optional[datetime] = None
    support_tickets: int = 0
    avg_rating: float = 0.0
    health_score: float = 0.0
    churn_risk: str = "Low"  # Low, Medium, High
    lifetime_value: float = 0.0
    
class OrderHistory(BaseModel):
    order_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    order_date: datetime
    total_amount: float
    items_count: int
    status: str  # Completed, Cancelled, Refunded
    
class SupportTicket(BaseModel):
    ticket_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    created_date: datetime
    issue_type: str  # Technical, Billing, General
    priority: str  # Low, Medium, High
    status: str  # Open, In Progress, Resolved
    resolution_time: Optional[int] = None  # hours
    
class FeedbackRating(BaseModel):
    feedback_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    rating: int  # 1-5 scale
    comment: str
    date: datetime
    product_id: str
    
class CustomerHealthResponse(BaseModel):
    customer_id: str
    name: str
    email: str
    health_score: float
    churn_risk: str
    lifetime_value: float
    total_orders: int
    total_spent: float
    last_activity: Optional[datetime]
    customer_tier: str
    region: str
    
class DashboardMetrics(BaseModel):
    total_customers: int
    high_risk_customers: int
    medium_risk_customers: int
    low_risk_customers: int
    total_revenue: float
    avg_lifetime_value: float
    churn_rate: float
    
class ChurnPrediction(BaseModel):
    customer_id: str
    name: str
    churn_probability: float
    key_factors: List[str]
    recommended_actions: List[str]

# Customer Health Scoring Engine
class CustomerHealthScorer:
    def __init__(self):
        self.scaler = StandardScaler()
        
    def calculate_health_score(self, customer_data: Dict) -> Dict:
        """Calculate customer health score based on multiple factors"""
        try:
            # Recency Score (0-30 points)
            last_order_days = self._days_since_last_order(customer_data.get('last_order_date'))
            recency_score = max(0, 30 - (last_order_days / 30) * 30)
            
            # Frequency Score (0-25 points)
            frequency_score = min(25, customer_data.get('total_orders', 0) * 2)
            
            # Monetary Score (0-25 points)
            monetary_score = min(25, customer_data.get('total_spent', 0) / 100)
            
            # Support Score (0-10 points, inverted - fewer tickets = better)
            support_tickets = customer_data.get('support_tickets', 0)
            support_score = max(0, 10 - support_tickets)
            
            # Rating Score (0-10 points)
            rating_score = customer_data.get('avg_rating', 0) * 2
            
            # Calculate total health score
            total_score = recency_score + frequency_score + monetary_score + support_score + rating_score
            
            # Determine churn risk
            if total_score >= 70:
                churn_risk = "Low"
            elif total_score >= 40:
                churn_risk = "Medium"
            else:
                churn_risk = "High"
                
            # Calculate lifetime value
            lifetime_value = customer_data.get('total_spent', 0) * (1 + (total_score / 100))
            
            return {
                'health_score': round(total_score, 2),
                'churn_risk': churn_risk,
                'lifetime_value': round(lifetime_value, 2),
                'score_breakdown': {
                    'recency': round(recency_score, 2),
                    'frequency': round(frequency_score, 2),
                    'monetary': round(monetary_score, 2),
                    'support': round(support_score, 2),
                    'rating': round(rating_score, 2)
                }
            }
        except Exception as e:
            logger.error(f"Error calculating health score: {e}")
            return {
                'health_score': 0,
                'churn_risk': 'High',
                'lifetime_value': 0,
                'score_breakdown': {}
            }
    
    def _days_since_last_order(self, last_order_date):
        if not last_order_date:
            return 365  # Default to 1 year if no orders
        if isinstance(last_order_date, str):
            last_order_date = datetime.fromisoformat(last_order_date)
        elif isinstance(last_order_date, date):
            last_order_date = datetime.combine(last_order_date, datetime.min.time())
        return (datetime.now() - last_order_date).days

# Initialize scorer
health_scorer = CustomerHealthScorer()

# Data Generator for Demo
class DataGenerator:
    def __init__(self):
        self.fake = Faker()
        
    async def generate_sample_data(self, num_customers: int = 100):
        """Generate sample customer data for demonstration"""
        customers = []
        orders = []
        tickets = []
        feedback = []
        
        for _ in range(num_customers):
            # Generate customer
            customer_id = str(uuid.uuid4())
            reg_date = self.fake.date_between(start_date='-2y', end_date='today')
            
            customer = {
                'customer_id': customer_id,
                'name': self.fake.name(),
                'email': self.fake.email(),
                'phone': self.fake.phone_number(),
                'registration_date': reg_date,
                'customer_tier': np.random.choice(['Bronze', 'Silver', 'Gold', 'Platinum'], 
                                                p=[0.4, 0.3, 0.2, 0.1]),
                'region': np.random.choice(['North', 'South', 'East', 'West']),
                'total_orders': 0,
                'total_spent': 0.0,
                'last_order_date': None,
                'support_tickets': 0,
                'avg_rating': 0.0
            }
            
            # Generate orders for this customer
            num_orders = np.random.poisson(5)  # Average 5 orders per customer
            customer_orders = []
            total_spent = 0
            
            for _ in range(num_orders):
                order_date = self.fake.date_between(start_date=reg_date, end_date='today')
                # Convert date to datetime for MongoDB compatibility
                order_date = datetime.combine(order_date, datetime.min.time())
                order_amount = np.random.lognormal(4, 1)  # Log-normal distribution
                
                order = {
                    'order_id': str(uuid.uuid4()),
                    'customer_id': customer_id,
                    'order_date': order_date,
                    'total_amount': round(order_amount, 2),
                    'items_count': np.random.randint(1, 10),
                    'status': np.random.choice(['Completed', 'Cancelled', 'Refunded'], 
                                            p=[0.85, 0.10, 0.05])
                }
                
                if order['status'] == 'Completed':
                    total_spent += order['total_amount']
                    
                customer_orders.append(order)
                orders.append(order)
            
            # Update customer totals
            customer['total_orders'] = len([o for o in customer_orders if o['status'] == 'Completed'])
            customer['total_spent'] = round(total_spent, 2)
            if customer_orders:
                customer['last_order_date'] = max([o['order_date'] for o in customer_orders])
            
            # Generate support tickets
            num_tickets = np.random.poisson(1)  # Average 1 ticket per customer
            for _ in range(num_tickets):
                ticket_date = self.fake.date_between(start_date=reg_date, end_date='today')
                # Convert date to datetime for MongoDB compatibility
                ticket_date = datetime.combine(ticket_date, datetime.min.time())
                ticket = {
                    'ticket_id': str(uuid.uuid4()),
                    'customer_id': customer_id,
                    'created_date': ticket_date,
                    'issue_type': np.random.choice(['Technical', 'Billing', 'General']),
                    'priority': np.random.choice(['Low', 'Medium', 'High'], p=[0.5, 0.3, 0.2]),
                    'status': np.random.choice(['Open', 'In Progress', 'Resolved'], p=[0.1, 0.2, 0.7]),
                    'resolution_time': np.random.randint(1, 72) if np.random.random() > 0.3 else None
                }
                tickets.append(ticket)
            
            customer['support_tickets'] = num_tickets
            
            # Generate feedback
            num_feedback = np.random.poisson(2)  # Average 2 feedback per customer
            ratings = []
            for _ in range(num_feedback):
                rating = np.random.randint(1, 6)
                ratings.append(rating)
                
                feedback_date = self.fake.date_between(start_date=reg_date, end_date='today')
                # Convert date to datetime for MongoDB compatibility
                feedback_date = datetime.combine(feedback_date, datetime.min.time())
                feedback_item = {
                    'feedback_id': str(uuid.uuid4()),
                    'customer_id': customer_id,
                    'rating': rating,
                    'comment': self.fake.text(max_nb_chars=200),
                    'date': feedback_date,
                    'product_id': str(uuid.uuid4())
                }
                feedback.append(feedback_item)
            
            customer['avg_rating'] = round(np.mean(ratings), 2) if ratings else 0
            
            # Calculate health score
            health_data = health_scorer.calculate_health_score(customer)
            customer.update(health_data)
            
            customers.append(customer)
        
        # Insert data into MongoDB
        try:
            if customers:
                await db.customers.insert_many(customers)
            if orders:
                await db.orders.insert_many(orders)
            if tickets:
                await db.support_tickets.insert_many(tickets)
            if feedback:
                await db.feedback.insert_many(feedback)
                
            logger.info(f"Generated {len(customers)} customers with related data")
            return True
        except Exception as e:
            logger.error(f"Error inserting sample data: {e}")
            return False

# API Routes
@app.get("/")
async def root():
    return {"message": "Customer Health Intelligence Dashboard API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/api/generate-sample-data")
async def generate_sample_data(num_customers: int = 100):
    """Generate sample data for demonstration"""
    try:
        # Clear existing data
        await db.customers.delete_many({})
        await db.orders.delete_many({})
        await db.support_tickets.delete_many({})
        await db.feedback.delete_many({})
        
        # Generate new data
        generator = DataGenerator()
        success = await generator.generate_sample_data(num_customers)
        
        if success:
            return {"message": f"Successfully generated {num_customers} customers with sample data"}
        else:
            raise HTTPException(status_code=500, detail="Failed to generate sample data")
    except Exception as e:
        logger.error(f"Error generating sample data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/customers", response_model=List[CustomerHealthResponse])
async def get_customers(
    skip: int = 0,
    limit: int = 100,
    churn_risk: Optional[str] = None,
    customer_tier: Optional[str] = None,
    region: Optional[str] = None
):
    """Get customers with health scores and filters"""
    try:
        # Build query filter
        query = {}
        if churn_risk:
            query['churn_risk'] = churn_risk
        if customer_tier:
            query['customer_tier'] = customer_tier
        if region:
            query['region'] = region
            
        # Get customers from database
        cursor = db.customers.find(query).skip(skip).limit(limit)
        customers = await cursor.to_list(length=limit)
        
        # Convert to response format
        result = []
        for customer in customers:
            result.append(CustomerHealthResponse(
                customer_id=customer['customer_id'],
                name=customer['name'],
                email=customer['email'],
                health_score=customer.get('health_score', 0),
                churn_risk=customer.get('churn_risk', 'Low'),
                lifetime_value=customer.get('lifetime_value', 0),
                total_orders=customer.get('total_orders', 0),
                total_spent=customer.get('total_spent', 0),
                last_activity=customer.get('last_order_date'),
                customer_tier=customer['customer_tier'],
                region=customer['region']
            ))
        
        return result
    except Exception as e:
        logger.error(f"Error fetching customers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    """Get key dashboard metrics"""
    try:
        # Get total customers
        total_customers = await db.customers.count_documents({})
        
        # Get customers by risk level
        high_risk = await db.customers.count_documents({"churn_risk": "High"})
        medium_risk = await db.customers.count_documents({"churn_risk": "Medium"})
        low_risk = await db.customers.count_documents({"churn_risk": "Low"})
        
        # Get revenue metrics
        pipeline = [
            {"$group": {
                "_id": None,
                "total_revenue": {"$sum": "$total_spent"},
                "avg_lifetime_value": {"$avg": "$lifetime_value"}
            }}
        ]
        
        result = await db.customers.aggregate(pipeline).to_list(length=1)
        
        total_revenue = result[0]['total_revenue'] if result else 0
        avg_lifetime_value = result[0]['avg_lifetime_value'] if result else 0
        
        # Calculate churn rate (high risk / total)
        churn_rate = (high_risk / total_customers * 100) if total_customers > 0 else 0
        
        return DashboardMetrics(
            total_customers=total_customers,
            high_risk_customers=high_risk,
            medium_risk_customers=medium_risk,
            low_risk_customers=low_risk,
            total_revenue=round(total_revenue, 2),
            avg_lifetime_value=round(avg_lifetime_value, 2),
            churn_rate=round(churn_rate, 2)
        )
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/customers/{customer_id}")
async def get_customer_details(customer_id: str):
    """Get detailed customer information"""
    try:
        # Get customer
        customer = await db.customers.find_one({"customer_id": customer_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get orders
        orders = await db.orders.find({"customer_id": customer_id}).to_list(length=None)
        
        # Get support tickets
        tickets = await db.support_tickets.find({"customer_id": customer_id}).to_list(length=None)
        
        # Get feedback
        feedback = await db.feedback.find({"customer_id": customer_id}).to_list(length=None)
        
        # Remove MongoDB ObjectId from all documents
        for doc in [customer] + orders + tickets + feedback:
            if '_id' in doc:
                del doc['_id']
        
        return {
            "customer": customer,
            "orders": orders,
            "support_tickets": tickets,
            "feedback": feedback
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching customer details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/churn-predictions", response_model=List[ChurnPrediction])
async def get_churn_predictions(limit: int = 10):
    """Get customers with highest churn risk and recommended actions"""
    try:
        # Get high-risk customers
        cursor = db.customers.find({"churn_risk": "High"}).sort("health_score", 1).limit(limit)
        customers = await cursor.to_list(length=limit)
        
        predictions = []
        for customer in customers:
            # Generate key factors based on customer data
            key_factors = []
            if customer.get('total_orders', 0) < 2:
                key_factors.append("Low purchase frequency")
            if customer.get('support_tickets', 0) > 3:
                key_factors.append("High support ticket volume")
            if customer.get('avg_rating', 0) < 3:
                key_factors.append("Low product satisfaction")
            if customer.get('last_order_date'):
                days_since = (datetime.now() - customer['last_order_date']).days
                if days_since > 90:
                    key_factors.append("No recent purchases")
            
            # Generate recommendations
            recommendations = []
            if "Low purchase frequency" in key_factors:
                recommendations.append("Send personalized product recommendations")
            if "High support ticket volume" in key_factors:
                recommendations.append("Assign dedicated account manager")
            if "Low product satisfaction" in key_factors:
                recommendations.append("Offer product training or alternatives")
            if "No recent purchases" in key_factors:
                recommendations.append("Send re-engagement campaign with discount")
            
            predictions.append(ChurnPrediction(
                customer_id=customer['customer_id'],
                name=customer['name'],
                churn_probability=round((100 - customer.get('health_score', 0)) / 100, 2),
                key_factors=key_factors,
                recommended_actions=recommendations
            ))
        
        return predictions
    except Exception as e:
        logger.error(f"Error fetching churn predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/revenue-trends")
async def get_revenue_trends():
    """Get monthly revenue trends"""
    try:
        pipeline = [
            {"$unwind": "$orders"},
            {"$match": {"orders.status": "Completed"}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$orders.order_date"},
                    "month": {"$month": "$orders.order_date"}
                },
                "revenue": {"$sum": "$orders.total_amount"},
                "orders": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        
        # Since we don't have embedded orders, let's query the orders collection directly
        pipeline = [
            {"$match": {"status": "Completed"}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$order_date"},
                    "month": {"$month": "$order_date"}
                },
                "revenue": {"$sum": "$total_amount"},
                "orders": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        
        trends = await db.orders.aggregate(pipeline).to_list(length=None)
        
        return {"trends": trends}
    except Exception as e:
        logger.error(f"Error fetching revenue trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)