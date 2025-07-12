import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ShoppingCart, 
  Headphones, 
  Star, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Package,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  customerAPI, 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  getRiskColor, 
  getTierColor, 
  getHealthScoreColor 
} from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const CustomerDetails = () => {
  const { customerId } = useParams();
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCustomerDetails();
  }, [customerId]);

  const loadCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await customerAPI.getCustomerDetails(customerId);
      setCustomerData(data);
    } catch (err) {
      console.error('Error loading customer details:', err);
      setError('Failed to load customer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={16} className="text-success-600" />;
      case 'cancelled':
        return <AlertTriangle size={16} className="text-danger-600" />;
      case 'refunded':
        return <Clock size={16} className="text-warning-600" />;
      case 'resolved':
        return <CheckCircle size={16} className="text-success-600" />;
      case 'open':
        return <Clock size={16} className="text-warning-600" />;
      case 'in progress':
        return <Activity size={16} className="text-primary-600" />;
      default:
        return <Activity size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'resolved':
        return 'bg-success-50 text-success-800';
      case 'cancelled':
        return 'bg-danger-50 text-danger-800';
      case 'refunded':
      case 'open':
        return 'bg-warning-50 text-warning-800';
      case 'in progress':
        return 'bg-primary-50 text-primary-800';
      default:
        return 'bg-gray-50 text-gray-800';
    }
  };

  const getRatingStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={16} 
        className={`${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const OverviewTab = () => {
    if (!customerData) return null;

    const { customer } = customerData;
    
    // Prepare order trend data
    const orderTrends = customerData.orders
      .filter(order => order.status === 'Completed')
      .reduce((acc, order) => {
        const month = new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + order.total_amount;
        return acc;
      }, {});
    
    const trendData = Object.entries(orderTrends).map(([month, amount]) => ({
      month,
      amount: amount
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Region</p>
                  <p className="font-medium">{customer.region}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-medium">{formatDate(customer.registration_date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Spending Trends */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Spending Trends</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Spent']} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Health Score & Metrics */}
        <div className="space-y-6">
          {/* Health Score */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Health Score</h3>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getHealthScoreColor(customer.health_score)}`}>
                {customer.health_score.toFixed(1)}
              </div>
              <div className="mt-2">
                <span className={`badge ${getRiskColor(customer.churn_risk)}`}>
                  {customer.churn_risk} Risk
                </span>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Health Score</span>
                  <span>{customer.health_score.toFixed(1)}/100</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-bar-fill ${customer.health_score >= 70 ? 'bg-success-500' : customer.health_score >= 40 ? 'bg-warning-500' : 'bg-danger-500'}`}
                    style={{ width: `${customer.health_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Key Metrics</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Lifetime Value</span>
                </div>
                <span className="font-medium">{formatCurrency(customer.lifetime_value)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Total Orders</span>
                </div>
                <span className="font-medium">{customer.total_orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Total Spent</span>
                </div>
                <span className="font-medium">{formatCurrency(customer.total_spent)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Headphones size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Support Tickets</span>
                </div>
                <span className="font-medium">{customer.support_tickets}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Avg Rating</span>
                </div>
                <span className="font-medium">{customer.avg_rating.toFixed(1)}/5</span>
              </div>
            </div>
          </div>

          {/* Customer Tier */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Customer Tier</h3>
            </div>
            <div className="text-center">
              <span className={`badge text-lg px-4 py-2 ${getTierColor(customer.customer_tier)}`}>
                {customer.customer_tier}
              </span>
              <p className="text-sm text-gray-600 mt-2">
                Based on spending and engagement
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const OrdersTab = () => {
    if (!customerData) return null;

    const { orders } = customerData;
    const completedOrders = orders.filter(order => order.status === 'Completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);

    return (
      <div className="space-y-6">
        {/* Orders Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <Package size={24} className="text-primary-600" />
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-success-600">{completedOrders.length}</p>
              </div>
              <CheckCircle size={24} className="text-success-600" />
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign size={24} className="text-success-600" />
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0)}
                </p>
              </div>
              <BarChart3 size={24} className="text-primary-600" />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.order_id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.order_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`badge ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No orders found for this customer
            </div>
          )}
        </div>
      </div>
    );
  };

  const SupportTab = () => {
    if (!customerData) return null;

    const { support_tickets } = customerData;
    const openTickets = support_tickets.filter(ticket => ticket.status === 'Open');
    const resolvedTickets = support_tickets.filter(ticket => ticket.status === 'Resolved');

    return (
      <div className="space-y-6">
        {/* Support Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{support_tickets.length}</p>
              </div>
              <Headphones size={24} className="text-primary-600" />
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-warning-600">{openTickets.length}</p>
              </div>
              <Clock size={24} className="text-warning-600" />
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-success-600">{resolvedTickets.length}</p>
              </div>
              <CheckCircle size={24} className="text-success-600" />
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Resolution</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resolvedTickets.length > 0 
                    ? Math.round(resolvedTickets.reduce((sum, ticket) => sum + (ticket.resolution_time || 0), 0) / resolvedTickets.length)
                    : 0}h
                </p>
              </div>
              <Activity size={24} className="text-primary-600" />
            </div>
          </div>
        </div>

        {/* Support Tickets Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolution Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {support_tickets.map((ticket) => (
                  <tr key={ticket.ticket_id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ticket.ticket_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.created_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.issue_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        ticket.priority === 'High' ? 'badge-danger' : 
                        ticket.priority === 'Medium' ? 'badge-warning' : 
                        'badge-info'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`badge ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.resolution_time ? `${ticket.resolution_time}h` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {support_tickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No support tickets found for this customer
            </div>
          )}
        </div>
      </div>
    );
  };

  const FeedbackTab = () => {
    if (!customerData) return null;

    const { feedback } = customerData;
    const avgRating = feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0;

    return (
      <div className="space-y-6">
        {/* Feedback Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{feedback.length}</p>
              </div>
              <MessageSquare size={24} className="text-primary-600" />
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
              </div>
              <Star size={24} className="text-yellow-400" />
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">5-Star Reviews</p>
                <p className="text-2xl font-bold text-success-600">
                  {feedback.filter(f => f.rating === 5).length}
                </p>
              </div>
              <Star size={24} className="text-success-600" />
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Customer Feedback</h3>
          </div>
          <div className="space-y-4">
            {feedback.map((feedbackItem) => (
              <div key={feedbackItem.feedback_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getRatingStars(feedbackItem.rating)}
                    <span className="text-sm text-gray-600">
                      {feedbackItem.rating}/5
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(feedbackItem.date)}
                  </span>
                </div>
                <p className="text-gray-700">{feedbackItem.comment}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Product ID: {feedbackItem.product_id.slice(0, 8)}...
                </p>
              </div>
            ))}
          </div>
          {feedback.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No feedback found for this customer
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadCustomerDetails} />;
  }

  if (!customerData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
      </div>
    );
  }

  const { customer } = customerData;
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'support', label: 'Support', icon: Headphones },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/customers"
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Customers
          </Link>
          <div className="border-l border-gray-300 h-6"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`badge ${getRiskColor(customer.churn_risk)}`}>
            {customer.churn_risk} Risk
          </span>
          <span className={`badge ${getTierColor(customer.customer_tier)}`}>
            {customer.customer_tier}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="fade-in">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'support' && <SupportTab />}
        {activeTab === 'feedback' && <FeedbackTab />}
      </div>
    </div>
  );
};

export default CustomerDetails;