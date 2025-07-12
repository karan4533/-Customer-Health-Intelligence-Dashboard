import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ArrowUpDown,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingCart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  customerAPI, 
  formatCurrency, 
  formatDate, 
  getRiskColor, 
  getTierColor, 
  getHealthScoreColor 
} from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    churn_risk: '',
    customer_tier: '',
    region: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('health_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, [filters, sortBy, sortOrder]);

  const loadCustomers = async (reset = true) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        skip: reset ? 0 : page * 50,
        limit: 50,
        ...filters
      };

      const data = await customerAPI.getCustomers(params);
      
      if (reset) {
        setCustomers(data);
        setPage(0);
      } else {
        setCustomers(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === 50);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getRiskIcon = (churnRisk) => {
    switch (churnRisk?.toLowerCase()) {
      case 'low':
        return <CheckCircle size={16} className="text-success-600" />;
      case 'medium':
        return <Clock size={16} className="text-warning-600" />;
      case 'high':
        return <AlertTriangle size={16} className="text-danger-600" />;
      default:
        return <Activity size={16} className="text-gray-400" />;
    }
  };

  const CustomerRow = ({ customer }) => (
    <tr className="table-row">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
            <div className="text-sm text-gray-500">{customer.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {getRiskIcon(customer.churn_risk)}
          <span className={`ml-2 text-sm font-medium ${getHealthScoreColor(customer.health_score)}`}>
            {customer.health_score.toFixed(1)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`badge ${getRiskColor(customer.churn_risk)}`}>
          {customer.churn_risk}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`badge ${getTierColor(customer.customer_tier)}`}>
          {customer.customer_tier}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatCurrency(customer.lifetime_value)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {customer.total_orders}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatCurrency(customer.total_spent)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(customer.last_activity)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {customer.region}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link
          to={`/customers/${customer.customer_id}`}
          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
        >
          <Eye size={16} className="mr-1" />
          View
        </Link>
      </td>
    </tr>
  );

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => loadCustomers()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Health Scores</h1>
          <p className="text-gray-600">Monitor customer engagement and churn risk</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => loadCustomers()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Activity size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {sortedCustomers.length} customers
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Churn Risk
                  </label>
                  <select
                    value={filters.churn_risk}
                    onChange={(e) => handleFilterChange('churn_risk', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Risks</option>
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Tier
                  </label>
                  <select
                    value={filters.customer_tier}
                    onChange={(e) => handleFilterChange('customer_tier', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Tiers</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region
                  </label>
                  <select
                    value={filters.region}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Regions</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('health_score')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Health Score</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('churn_risk')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Churn Risk</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lifetime_value')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Lifetime Value</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total_orders')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Orders</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total_spent')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Total Spent</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.map((customer) => (
                <CustomerRow key={customer.customer_id} customer={customer} />
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
            </div>
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && customers.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => loadCustomers(false)}
            disabled={loading}
            className="btn-secondary inline-flex items-center gap-2"
          >
            {loading ? <LoadingSpinner size="small" /> : null}
            Load More Customers
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerList;