#!/usr/bin/env python3
"""
Backend API Testing for Customer Health Intelligence Dashboard
Tests all API endpoints and validates responses
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class CustomerHealthAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.sample_customer_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int = 200, 
                 data: Dict = None, params: Dict = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=30)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            details = f"(Status: {response.status_code})"
            if not success:
                details += f" Expected: {expected_status}, Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            return success, response_data

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "Connection error - is the server running?")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test("Health Check", "GET", "api/health")
        if success and "status" in response:
            return response.get("status") == "healthy"
        return success

    def test_generate_sample_data(self):
        """Test sample data generation"""
        success, response = self.run_test(
            "Generate Sample Data", 
            "POST", 
            "api/generate-sample-data",
            200,
            params={"num_customers": 10}
        )
        return success

    def test_dashboard_metrics(self):
        """Test dashboard metrics endpoint"""
        success, response = self.run_test("Dashboard Metrics", "GET", "api/dashboard/metrics")
        
        if success:
            required_fields = [
                "total_customers", "high_risk_customers", "medium_risk_customers", 
                "low_risk_customers", "total_revenue", "avg_lifetime_value", "churn_rate"
            ]
            
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                self.log_test("Dashboard Metrics Validation", False, f"Missing fields: {missing_fields}")
                return False
            else:
                self.log_test("Dashboard Metrics Validation", True, "All required fields present")
                
        return success

    def test_get_customers(self):
        """Test get customers endpoint with various filters"""
        # Test basic customer list
        success, response = self.run_test("Get Customers - Basic", "GET", "api/customers")
        
        if success and isinstance(response, list) and len(response) > 0:
            # Store a sample customer ID for later tests
            self.sample_customer_id = response[0].get("customer_id")
            self.log_test("Customer List Validation", True, f"Found {len(response)} customers")
            
            # Test with filters
            filters = [
                {"churn_risk": "High"},
                {"customer_tier": "Gold"},
                {"region": "North"},
                {"limit": "5"}
            ]
            
            for filter_params in filters:
                filter_name = f"Get Customers - Filter {list(filter_params.keys())[0]}"
                filter_success, _ = self.run_test(filter_name, "GET", "api/customers", params=filter_params)
                if not filter_success:
                    success = False
                    
        elif success:
            self.log_test("Customer List Validation", False, "Empty customer list returned")
            success = False
            
        return success

    def test_customer_details(self):
        """Test customer details endpoint"""
        if not self.sample_customer_id:
            self.log_test("Customer Details", False, "No sample customer ID available")
            return False
            
        success, response = self.run_test(
            "Customer Details", 
            "GET", 
            f"api/customers/{self.sample_customer_id}"
        )
        
        if success:
            required_sections = ["customer", "orders", "support_tickets", "feedback"]
            missing_sections = [section for section in required_sections if section not in response]
            
            if missing_sections:
                self.log_test("Customer Details Validation", False, f"Missing sections: {missing_sections}")
                return False
            else:
                self.log_test("Customer Details Validation", True, "All required sections present")
                
        return success

    def test_churn_predictions(self):
        """Test churn predictions endpoint"""
        success, response = self.run_test("Churn Predictions", "GET", "api/analytics/churn-predictions")
        
        if success and isinstance(response, list):
            if len(response) > 0:
                # Validate structure of first prediction
                first_prediction = response[0]
                required_fields = ["customer_id", "name", "churn_probability", "key_factors", "recommended_actions"]
                missing_fields = [field for field in required_fields if field not in first_prediction]
                
                if missing_fields:
                    self.log_test("Churn Predictions Validation", False, f"Missing fields: {missing_fields}")
                    return False
                else:
                    self.log_test("Churn Predictions Validation", True, f"Found {len(response)} predictions")
            else:
                self.log_test("Churn Predictions Validation", True, "No high-risk customers found")
                
        return success

    def test_revenue_trends(self):
        """Test revenue trends endpoint"""
        success, response = self.run_test("Revenue Trends", "GET", "api/analytics/revenue-trends")
        
        if success and "trends" in response:
            trends = response["trends"]
            if isinstance(trends, list):
                self.log_test("Revenue Trends Validation", True, f"Found {len(trends)} trend data points")
            else:
                self.log_test("Revenue Trends Validation", False, "Trends data is not a list")
                return False
        elif success:
            self.log_test("Revenue Trends Validation", False, "Missing 'trends' field in response")
            return False
            
        return success

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        # Test invalid customer ID
        success, _ = self.run_test(
            "Error Handling - Invalid Customer ID", 
            "GET", 
            "api/customers/invalid-id",
            404
        )
        
        # Test invalid endpoint
        invalid_success, _ = self.run_test(
            "Error Handling - Invalid Endpoint", 
            "GET", 
            "api/invalid-endpoint",
            404
        )
        
        return success and invalid_success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Customer Health Intelligence Dashboard API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Generate Sample Data", self.test_generate_sample_data),
            ("Dashboard Metrics", self.test_dashboard_metrics),
            ("Get Customers", self.test_get_customers),
            ("Customer Details", self.test_customer_details),
            ("Churn Predictions", self.test_churn_predictions),
            ("Revenue Trends", self.test_revenue_trends),
            ("Error Handling", self.test_error_handling),
        ]
        
        for test_name, test_func in tests:
            print(f"\n📋 Running {test_name} tests...")
            try:
                test_func()
            except Exception as e:
                self.log_test(f"{test_name} - Exception", False, str(e))
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the logs above.")
            return 1

def main():
    """Main test runner"""
    # Use the public endpoint from environment
    import os
    backend_url = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    
    tester = CustomerHealthAPITester(backend_url)
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())