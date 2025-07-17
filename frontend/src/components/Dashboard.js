import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  ArrowUp,
  ArrowDown,
  Target,
  Activity
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { customerAPI, formatCurrency } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [churnPredictions, setChurnPredictions] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, churnData, revenueData] = await Promise.all([
        customerAPI.getDashboardMetrics(),
        customerAPI.getChurnPredictions(5),
        customerAPI.getRevenueTrends()
      ]);

      setMetrics(metricsData);
      setChurnPredictions(churnData);
      setRevenueTrends(revenueData.trends || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const { message } = await customerAPI.exportCustomers();
      alert(message);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleSendChurnAlerts = async () => {
    try {
      const { message } = await customerAPI.sendChurnAlerts();
      alert(message);
    } catch (err) {
      console.error('Error sending churn alerts:', err);
      alert('Failed to send churn alerts. Please try again.');
    }
  };

  const handleGenerateReport = async () => {
    try {
      const { message } = await customerAPI.generateReport();
      alert(message);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report. Please try again.');
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, trend, color = 'primary' }) => {
    const colorClasses = {
      primary: 'bg-primary-50 text-primary-600',
      success: 'bg-success-50 text-success-600',
      warning: 'bg-warning-50 text-warning-600',
      danger: 'bg-danger-50 text-danger-600',
    };

    return (
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {change && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <ArrowUp size={16} className="text-success-600 mr-1" />
                ) : (
                  <ArrowDown size={16} className="text-danger-600 mr-1" />
                )}
                <span className={`text-sm ${trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    );
  };

  const ChurnRiskChart = () => {
    if (!metrics) return null;

    const data = [
      { name: 'Low Risk', value: metrics.low_risk_customers, color: '#22c55e' },
      { name: 'Medium Risk', value: metrics.medium_risk_customers, color: '#f59e0b' },
      { name: 'High Risk', value: metrics.high_risk_customers, color: '#ef4444' },
    ];

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Churn Risk Distribution</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Customers']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const RevenueChart = () => {
    if (!revenueTrends || revenueTrends.length === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No revenue data available</p>
          </div>
        </div>
      );
    }

    const chartData = revenueTrends.map(trend => ({
      month: `${trend._id.month}/${trend._id.year}`,
      revenue: trend.revenue,
      orders: trend.orders
    }));

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name === 'revenue' ? 'Revenue' : 'Orders'
              ]} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const ChurnPredictionsList = () => {
    if (!churnPredictions || churnPredictions.length === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Churn Predictions</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-500">No high-risk customers identified</p>
          </div>
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">High Risk Customers</h3>
          <p className="text-sm text-gray-500">Customers likely to churn</p>
        </div>
        <div className="space-y-3">
          {churnPredictions.map((prediction) => (
            <div key={prediction.customer_id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{prediction.name}</h4>
                  <p className="text-sm text-gray-500">ID: {prediction.customer_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-danger-600">
                    {(prediction.churn_probability * 100).toFixed(0)}% Risk
                  </p>
                </div>
              </div>
              
              {prediction.key_factors.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Key Factors:</p>
                  <div className="flex flex-wrap gap-1">
                    {prediction.key_factors.map((factor, index) => (
                      <span key={index} className="badge badge-danger text-xs">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {prediction.recommended_actions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Recommended Actions:</p>
                  <ul className="text-sm text-gray-600">
                    {prediction.recommended_actions.slice(0, 2).map((action, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
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
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Health Dashboard</h1>
          <p className="text-gray-600">Monitor customer engagement and identify churn risks</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Activity size={16} />
          Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={metrics.total_customers.toLocaleString()}
          change="12% this month"
          trend="up"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(metrics.total_revenue)}
          change="8.2% this month"
          trend="up"
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Avg Lifetime Value"
          value={formatCurrency(metrics.avg_lifetime_value)}
          change="5.1% this month"
          trend="up"
          icon={Target}
          color="primary"
        />
        <StatCard
          title="Churn Rate"
          value={`${metrics.churn_rate.toFixed(1)}%`}
          change="2.3% this month"
          trend="down"
          icon={AlertTriangle}
          color="danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChurnRiskChart />
        <RevenueChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChurnPredictionsList />
        
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button 
              onClick={handleExportData}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Export Customer Data</p>
                  <p className="text-sm text-gray-500">Download CSV for BI tools</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleSendChurnAlerts}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={16} className="text-warning-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Send Churn Alerts</p>
                  <p className="text-sm text-gray-500">Notify account managers</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleGenerateReport}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-success-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Generate Report</p>
                  <p className="text-sm text-gray-500">Executive summary</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;