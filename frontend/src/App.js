import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// API service
import { customerAPI } from './services/api';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerDetails from './components/CustomerDetails';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkDataAndInitialize();
  }, []);

  const checkDataAndInitialize = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we have data
      const metrics = await customerAPI.getDashboardMetrics();
      
      if (metrics.total_customers === 0) {
        // No data exists, generate sample data
        console.log('No data found, generating sample data...');
        await customerAPI.generateSampleData(100);
      }
    } catch (err) {
      console.error('Error initializing app:', err);
      setError('Failed to initialize the dashboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    checkDataAndInitialize();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Initializing Customer Health Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header onMenuClick={toggleSidebar} />
          
          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/:customerId" element={<CustomerDetails />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;