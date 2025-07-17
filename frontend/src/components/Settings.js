import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Mail, 
  Bell, 
  Shield, 
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    // Database Settings
    mongoUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001',
    
    // Email Settings
    emailEnabled: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'admin@company.com',
    
    // Notification Settings
    churnAlerts: true,
    dailyReports: true,
    highRiskThreshold: 30,
    
    // Security Settings
    sessionTimeout: 30,
    enableTwoFactor: false,
    
    // System Settings
    maxCustomersPerPage: 50,
    dataRetentionDays: 365,
    backupFrequency: 'daily'
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // In a real implementation, this would save to backend
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const SettingSection = ({ title, icon: Icon, children }) => (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-2">
          <Icon size={20} className="text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  );

  const CheckboxField = ({ label, checked, onChange, description }) => (
    <div className="flex items-start space-x-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
      />
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  const SelectField = ({ label, value, onChange, options }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure system preferences and integrations</p>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary inline-flex items-center gap-2"
        >
          {saved ? (
            <>
              <CheckCircle size={16} />
              Saved
            </>
          ) : (
            <>
              <Save size={16} />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Database Settings */}
      <SettingSection title="Database Configuration" icon={Database}>
        <InputField
          label="Backend URL"
          value={settings.mongoUrl}
          onChange={(value) => handleChange('mongoUrl', value)}
          placeholder="http://localhost:8001"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Data Retention (Days)"
            value={settings.dataRetentionDays}
            onChange={(value) => handleChange('dataRetentionDays', parseInt(value))}
            type="number"
          />
          <SelectField
            label="Backup Frequency"
            value={settings.backupFrequency}
            onChange={(value) => handleChange('backupFrequency', value)}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' }
            ]}
          />
        </div>
      </SettingSection>

      {/* Email Settings */}
      <SettingSection title="Email Configuration" icon={Mail}>
        <CheckboxField
          label="Enable Email Notifications"
          checked={settings.emailEnabled}
          onChange={(value) => handleChange('emailEnabled', value)}
          description="Allow the system to send email alerts and reports"
        />
        
        {settings.emailEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="SMTP Host"
              value={settings.smtpHost}
              onChange={(value) => handleChange('smtpHost', value)}
              placeholder="smtp.gmail.com"
            />
            <InputField
              label="SMTP Port"
              value={settings.smtpPort}
              onChange={(value) => handleChange('smtpPort', value)}
              placeholder="587"
            />
            <InputField
              label="SMTP Username"
              value={settings.smtpUser}
              onChange={(value) => handleChange('smtpUser', value)}
              placeholder="admin@company.com"
            />
          </div>
        )}
      </SettingSection>

      {/* Notification Settings */}
      <SettingSection title="Notification Preferences" icon={Bell}>
        <CheckboxField
          label="Churn Risk Alerts"
          checked={settings.churnAlerts}
          onChange={(value) => handleChange('churnAlerts', value)}
          description="Receive notifications when customers are at high risk of churning"
        />
        
        <CheckboxField
          label="Daily Reports"
          checked={settings.dailyReports}
          onChange={(value) => handleChange('dailyReports', value)}
          description="Get daily summary reports of customer health metrics"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="High Risk Threshold (%)"
            value={settings.highRiskThreshold}
            onChange={(value) => handleChange('highRiskThreshold', parseInt(value))}
            type="number"
          />
          <InputField
            label="Max Customers Per Page"
            value={settings.maxCustomersPerPage}
            onChange={(value) => handleChange('maxCustomersPerPage', parseInt(value))}
            type="number"
          />
        </div>
      </SettingSection>

      {/* Security Settings */}
      <SettingSection title="Security & Authentication" icon={Shield}>
        <CheckboxField
          label="Enable Two-Factor Authentication"
          checked={settings.enableTwoFactor}
          onChange={(value) => handleChange('enableTwoFactor', value)}
          description="Require additional verification for login"
        />
        
        <InputField
          label="Session Timeout (minutes)"
          value={settings.sessionTimeout}
          onChange={(value) => handleChange('sessionTimeout', parseInt(value))}
          type="number"
        />
      </SettingSection>

      {/* System Information */}
      <SettingSection title="System Information" icon={SettingsIcon}>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Application Version</p>
              <p className="text-sm text-gray-500">v1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Database Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <p className="text-sm text-gray-500">Connected</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Last Backup</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Uptime</p>
              <p className="text-sm text-gray-500">3 days, 14 hours</p>
            </div>
          </div>
        </div>
      </SettingSection>

      {/* Warning Notice */}
      <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="text-warning-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-warning-800">Configuration Notice</h4>
            <p className="text-sm text-warning-700 mt-1">
              Changes to these settings may require system restart to take effect. 
              Please test configurations in a development environment first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
