import React from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CH</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Customer Health Dashboard</h1>
              <p className="text-sm text-gray-500">Monitor customer engagement and churn risk</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              className="bg-transparent border-none outline-none text-sm"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={16} className="text-gray-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">admin@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;