import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// API functions
export const customerAPI = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Generate sample data
  generateSampleData: async (numCustomers = 100) => {
    try {
      const response = await apiClient.post('/api/generate-sample-data', null, {
        params: { num_customers: numCustomers }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate sample data:', error);
      throw error;
    }
  },

  // Get dashboard metrics
  getDashboardMetrics: async () => {
    try {
      const response = await apiClient.get('/api/dashboard/metrics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      throw error;
    }
  },

  // Get customers with filters
  getCustomers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.skip !== undefined) params.append('skip', filters.skip);
      if (filters.limit !== undefined) params.append('limit', filters.limit);
      if (filters.churn_risk) params.append('churn_risk', filters.churn_risk);
      if (filters.customer_tier) params.append('customer_tier', filters.customer_tier);
      if (filters.region) params.append('region', filters.region);

      const response = await apiClient.get(`/api/customers?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      throw error;
    }
  },

  // Get customer details
  getCustomerDetails: async (customerId) => {
    try {
      const response = await apiClient.get(`/api/customers/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
      throw error;
    }
  },

  // Get churn predictions
  getChurnPredictions: async (limit = 10) => {
    try {
      const response = await apiClient.get('/api/analytics/churn-predictions', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch churn predictions:', error);
      throw error;
    }
  },

  // Get revenue trends
  getRevenueTrends: async () => {
    try {
      const response = await apiClient.get('/api/analytics/revenue-trends');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch revenue trends:', error);
      throw error;
    }
  },

  // Search customers
  searchCustomers: async (query) => {
    try {
      const response = await apiClient.get('/api/customers/search', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search customers:', error);
      throw error;
    }
  },

  // Export customers
  exportCustomers: async () => {
    try {
      const response = await apiClient.get('/api/customers/export', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Customer data exported successfully' };
    } catch (error) {
      console.error('Failed to export customers:', error);
      throw error;
    }
  },

  // Send churn alerts (placeholder)
  sendChurnAlerts: async () => {
    // This is a placeholder - in real implementation, this would send emails/notifications
    return { success: true, message: 'Churn alerts sent to account managers' };
  },

  // Generate report (placeholder)
  generateReport: async () => {
    // This is a placeholder - in real implementation, this would generate PDF/Excel reports
    return { success: true, message: 'Executive report generated successfully' };
  },
};

// Utility functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRiskColor = (churnRisk) => {
  switch (churnRisk?.toLowerCase()) {
    case 'low':
      return 'text-success-600 bg-success-50';
    case 'medium':
      return 'text-warning-600 bg-warning-50';
    case 'high':
      return 'text-danger-600 bg-danger-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getTierColor = (tier) => {
  switch (tier?.toLowerCase()) {
    case 'platinum':
      return 'text-purple-600 bg-purple-50';
    case 'gold':
      return 'text-yellow-600 bg-yellow-50';
    case 'silver':
      return 'text-gray-600 bg-gray-50';
    case 'bronze':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getHealthScoreColor = (score) => {
  if (score >= 70) return 'text-success-600';
  if (score >= 40) return 'text-warning-600';
  return 'text-danger-600';
};

export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export default apiClient;