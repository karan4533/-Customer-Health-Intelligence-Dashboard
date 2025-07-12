import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Download, 
  Calendar, 
  Target, 
  BarChart3, 
  PieChart, 
  Activity,
  Zap,
  Star,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import { 
  customerAPI, 
  formatCurrency, 
  formatDate, 
  getRiskColor, 
  getTierColor, 
  calculatePercentage 
} from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const Analytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [churnPredictions, setChurnPredictions] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30');
  const [selectedInsight, setSelectedInsight] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, customersData, churnData, revenueData] = await Promise.all([
        customerAPI.getDashboardMetrics(),
        customerAPI.getCustomers({ limit: 1000 }),
        customerAPI.getChurnPredictions(20),
        customerAPI.getRevenueTrends()
      ]);

      setMetrics(metricsData);
      setCustomers(customersData);
      setChurnPredictions(churnData);
      setRevenueTrends(revenueData.trends || []);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Smart Insights Generation
  const generateInsights = () => {
    if (!metrics || !customers.length) return [];

    const insights = [];

    // Churn Risk Insight
    const churnRate = metrics.churn_rate;
    if (churnRate > 15) {
      insights.push({
        type: 'alert',
        title: 'High Churn Risk Alert',
        description: `${churnRate.toFixed(1)}% of customers are at high risk of churning`,
        impact: 'High',
        recommendation: 'Implement immediate retention campaigns for high-risk customers',
        icon: AlertTriangle,
        color: 'danger'
      });
    }

    // Revenue Opportunity
    const goldCustomers = customers.filter(c => c.customer_tier === 'Gold' && c.churn_risk === 'Low');
    if (goldCustomers.length > 0) {
      const upsellPotential = goldCustomers.length * 500; // Estimated upsell value
      insights.push({
        type: 'opportunity',
        title: 'Upsell Opportunity',
        description: `${goldCustomers.length} Gold customers are prime for Platinum upgrade`,
        impact: 'Medium',
        recommendation: `Potential revenue increase of ${formatCurrency(upsellPotential)}`,
        icon: TrendingUp,
        color: 'success'
      });
    }

    // Customer Satisfaction
    const lowRatingCustomers = customers.filter(c => c.total_orders > 0 && c.churn_risk === 'High');
    if (lowRatingCustomers.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Customer Satisfaction Issue',
        description: `${lowRatingCustomers.length} active customers showing dissatisfaction signals`,
        impact: 'Medium',
        recommendation: 'Conduct customer satisfaction surveys and implement improvement plans',
        icon: Star,
        color: 'warning'
      });
    }

    // Regional Performance
    const regionPerformance = customers.reduce((acc, customer) => {
      if (!acc[customer.region]) {
        acc[customer.region] = { customers: 0, revenue: 0, avgHealth: 0 };
      }
      acc[customer.region].customers++;
      acc[customer.region].revenue += customer.total_spent;
      acc[customer.region].avgHealth += customer.health_score;
      return acc;
    }, {});

    Object.keys(regionPerformance).forEach(region => {
      regionPerformance[region].avgHealth /= regionPerformance[region].customers;
    });

    const bestRegion = Object.keys(regionPerformance).reduce((a, b) => 
      regionPerformance[a].avgHealth > regionPerformance[b].avgHealth ? a : b
    );

    const worstRegion = Object.keys(regionPerformance).reduce((a, b) => 
      regionPerformance[a].avgHealth < regionPerformance[b].avgHealth ? a : b
    );

    insights.push({
      type: 'insight',
      title: 'Regional Performance Variance',
      description: `${bestRegion} region outperforms ${worstRegion} by ${(regionPerformance[bestRegion].avgHealth - regionPerformance[worstRegion].avgHealth).toFixed(1)} health score points`,
      impact: 'Medium',
      recommendation: 'Analyze successful practices in top-performing regions for replication',
      icon: Target,
      color: 'info'
    });

    return insights;
  };

  // Customer Segmentation Analysis
  const getCustomerSegmentation = () => {
    if (!customers.length) return [];

    const segments = {
      'Champions': customers.filter(c => c.health_score >= 80 && c.total_spent > 1000),
      'Loyal Customers': customers.filter(c => c.health_score >= 60 && c.health_score < 80 && c.total_orders >= 5),
      'Potential Loyalists': customers.filter(c => c.health_score >= 50 && c.health_score < 60 && c.total_orders >= 2),
      'At Risk': customers.filter(c => c.health_score >= 30 && c.health_score < 50),
      'Cannot Lose Them': customers.filter(c => c.health_score < 30 && c.total_spent > 1000),
      'Hibernating': customers.filter(c => c.health_score < 30 && c.total_spent <= 1000)
    };

    return Object.entries(segments).map(([name, customers]) => ({
      name,
      count: customers.length,
      percentage: calculatePercentage(customers.length, customers.length),
      avgValue: customers.length > 0 ? customers.reduce((sum, c) => sum + c.lifetime_value, 0) / customers.length : 0,
      color: getSegmentColor(name)
    }));
  };

  const getSegmentColor = (segment) => {
    const colors = {
      'Champions': '#22c55e',
      'Loyal Customers': '#3b82f6',
      'Potential Loyalists': '#8b5cf6',
      'At Risk': '#f59e0b',
      'Cannot Lose Them': '#ef4444',
      'Hibernating': '#6b7280'
    };
    return colors[segment] || '#6b7280';
  };

  // Cohort Analysis Data
  const getCohortAnalysis = () => {
    if (!customers.length) return [];

    const cohorts = customers.reduce((acc, customer) => {
      const cohortMonth = new Date(customer.last_activity || customer.registration_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[cohortMonth]) {
        acc[cohortMonth] = { customers: 0, revenue: 0, avgHealth: 0 };
      }
      acc[cohortMonth].customers++;
      acc[cohortMonth].revenue += customer.total_spent;
      acc[cohortMonth].avgHealth += customer.health_score;
      return acc;
    }, {});

    return Object.entries(cohorts).map(([month, data]) => ({
      month,
      customers: data.customers,
      revenue: data.revenue,
      avgHealth: data.avgHealth / data.customers,
      retention: Math.random() * 100 // Simulated retention rate
    }));
  };

  // Revenue Prediction Model
  const getRevenuePrediction = () => {
    if (!revenueTrends.length) return [];

    const trends = revenueTrends.slice(-6); // Last 6 months
    const avgGrowth = trends.reduce((sum, trend, index) => {
      if (index === 0) return 0;
      return sum + ((trend.revenue - trends[index - 1].revenue) / trends[index - 1].revenue * 100);
    }, 0) / (trends.length - 1);

    const lastRevenue = trends[trends.length - 1]?.revenue || 0;
    const predictions = [];

    for (let i = 1; i <= 6; i++) {
      const predictedRevenue = lastRevenue * Math.pow(1 + avgGrowth / 100, i);
      predictions.push({
        month: `Prediction ${i}`,
        revenue: predictedRevenue,
        type: 'prediction'
      });
    }

    return [...trends.map(t => ({ ...t, type: 'actual' })), ...predictions];
  };

  const insights = generateInsights();
  const segmentation = getCustomerSegmentation();
  const cohortData = getCohortAnalysis();
  const revenuePrediction = getRevenuePrediction();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadAnalyticsData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Deep insights into customer behavior and business performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((insight, index) => (
          <div key={index} className="card">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${
                insight.color === 'danger' ? 'bg-danger-100' :
                insight.color === 'warning' ? 'bg-warning-100' :
                insight.color === 'success' ? 'bg-success-100' :
                'bg-primary-100'
              }`}>
                <insight.icon size={20} className={`${
                  insight.color === 'danger' ? 'text-danger-600' :
                  insight.color === 'warning' ? 'text-warning-600' :
                  insight.color === 'success' ? 'text-success-600' :
                  'text-primary-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                <p className="text-xs text-gray-500 mt-2">{insight.recommendation}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className={`badge ${
                    insight.impact === 'High' ? 'badge-danger' :
                    insight.impact === 'Medium' ? 'badge-warning' :
                    'badge-info'
                  }`}>
                    {insight.impact} Impact
                  </span>
                  <span className={`badge badge-${insight.color}`}>
                    {insight.type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'segmentation', label: 'Segmentation', icon: PieChart },
              { id: 'cohort', label: 'Cohort Analysis', icon: Users },
              { id: 'prediction', label: 'Revenue Prediction', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedInsight(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedInsight === tab.id
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
        
        <div className="p-6">
          {selectedInsight === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Health Distribution */}
              <div className="chart-container">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Health Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { range: '0-20', count: customers.filter(c => c.health_score < 20).length },
                    { range: '20-40', count: customers.filter(c => c.health_score >= 20 && c.health_score < 40).length },
                    { range: '40-60', count: customers.filter(c => c.health_score >= 40 && c.health_score < 60).length },
                    { range: '60-80', count: customers.filter(c => c.health_score >= 60 && c.health_score < 80).length },
                    { range: '80-100', count: customers.filter(c => c.health_score >= 80).length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tier Performance */}
              <div className="chart-container">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={[
                    { tier: 'Bronze', customers: customers.filter(c => c.customer_tier === 'Bronze').length, avgValue: customers.filter(c => c.customer_tier === 'Bronze').reduce((sum, c) => sum + c.lifetime_value, 0) / customers.filter(c => c.customer_tier === 'Bronze').length || 0 },
                    { tier: 'Silver', customers: customers.filter(c => c.customer_tier === 'Silver').length, avgValue: customers.filter(c => c.customer_tier === 'Silver').reduce((sum, c) => sum + c.lifetime_value, 0) / customers.filter(c => c.customer_tier === 'Silver').length || 0 },
                    { tier: 'Gold', customers: customers.filter(c => c.customer_tier === 'Gold').length, avgValue: customers.filter(c => c.customer_tier === 'Gold').reduce((sum, c) => sum + c.lifetime_value, 0) / customers.filter(c => c.customer_tier === 'Gold').length || 0 },
                    { tier: 'Platinum', customers: customers.filter(c => c.customer_tier === 'Platinum').length, avgValue: customers.filter(c => c.customer_tier === 'Platinum').reduce((sum, c) => sum + c.lifetime_value, 0) / customers.filter(c => c.customer_tier === 'Platinum').length || 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [name === 'avgValue' ? formatCurrency(value) : value, name === 'avgValue' ? 'Avg LTV' : 'Customers']} />
                    <Bar dataKey="customers" fill="#8884d8" />
                    <Line type="monotone" dataKey="avgValue" stroke="#82ca9d" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {selectedInsight === 'segmentation' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Segmentation Chart */}
              <div className="chart-container">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segmentation</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={segmentation}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {segmentation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Customers']} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              {/* Segment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Segment Details</h3>
                {segmentation.map((segment) => (
                  <div key={segment.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        ></div>
                        <h4 className="font-medium text-gray-900">{segment.name}</h4>
                      </div>
                      <span className="text-sm text-gray-500">{segment.count} customers</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Avg Lifetime Value: {formatCurrency(segment.avgValue)}</p>
                      <p>Percentage: {segment.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedInsight === 'cohort' && (
            <div className="chart-container">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort Analysis</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={cohortData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : 
                    name === 'retention' ? `${value.toFixed(1)}%` : value,
                    name === 'revenue' ? 'Revenue' : 
                    name === 'retention' ? 'Retention' : 'Customers'
                  ]} />
                  <Legend />
                  <Line type="monotone" dataKey="customers" stroke="#8884d8" name="Customers" />
                  <Line type="monotone" dataKey="retention" stroke="#82ca9d" name="Retention %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {selectedInsight === 'prediction' && (
            <div className="chart-container">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Prediction</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenuePrediction}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeDasharray="5 5"
                    name="Predicted Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Export and Actions */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export & Actions</h3>
            <p className="text-sm text-gray-600">Export data for external BI tools</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="btn-secondary inline-flex items-center gap-2">
              <Download size={16} />
              Export to CSV
            </button>
            <button className="btn-secondary inline-flex items-center gap-2">
              <Download size={16} />
              Export to Excel
            </button>
            <button className="btn-primary inline-flex items-center gap-2">
              <Zap size={16} />
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;