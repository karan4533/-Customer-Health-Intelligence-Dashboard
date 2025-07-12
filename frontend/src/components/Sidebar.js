import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  BarChart3, 
  Settings, 
  X,
  TrendingUp,
  AlertTriangle,
  Target
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Overview and key metrics'
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      description: 'Customer health scores'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Advanced insights'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'System configuration'
    },
  ];

  const quickStats = [
    { label: 'High Risk', value: '12', color: 'text-danger-600', icon: AlertTriangle },
    { label: 'Growth', value: '+5.2%', color: 'text-success-600', icon: TrendingUp },
    { label: 'Target', value: '85%', color: 'text-primary-600', icon: Target },
  ];

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CH</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Health Hub</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} className={`${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              {quickStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon size={16} className={stat.color} />
                      <span className="text-sm text-gray-600">{stat.label}</span>
                    </div>
                    <span className={`text-sm font-medium ${stat.color}`}>{stat.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-primary-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">System Status</span>
              </div>
              <p className="text-xs text-gray-600">All systems operational</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;