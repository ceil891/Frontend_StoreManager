import { useState } from 'react';
import { Store, Users, Shield, Save, Building2, MapPin, Phone, Mail, Globe, DollarSign, RefreshCcw } from 'lucide-react';
import { UsersPage } from '@/features/hr/pages/UsersPage';
import { RolesPage } from '@/features/hr/pages/RolesPage';

interface EnterpriseBranchConfig {
  branchName: string;
  branchCode: string;
  registrationNumber: string;
  vatTaxNumber: string;
  primaryContactPhone: string;
  supportEmail: string;
  headquartersAddress: string;
  operatingCurrency: string;
  timezone: string;
  fiscalYearStartMonth: string;
  maxDailyCashDropLimitUsd: number;
  autoBatchSettlementHour: string;
}

const INITIAL_CONFIG: EnterpriseBranchConfig = {
  branchName: 'RetailHub Central Flagship Plaza',
  branchCode: 'RH-FLAGSHIP-001',
  registrationNumber: 'REG-US-99120485',
  vatTaxNumber: 'VAT-US-987654321',
  primaryContactPhone: '+1 (555) 890-1234',
  supportEmail: 'ops.flagship@retailhub.io',
  headquartersAddress: '742 Evergreen Terrace, Retail District, New York, NY 10001',
  operatingCurrency: 'USD ($)',
  timezone: 'America/New_York (EST/EDT)',
  fiscalYearStartMonth: 'October (Q4 Start)',
  maxDailyCashDropLimitUsd: 25000.00,
  autoBatchSettlementHour: '23:30 (11:30 PM)',
};

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'branch' | 'users' | 'roles'>('branch');
  const [config, setConfig] = useState<EnterpriseBranchConfig>(INITIAL_CONFIG);

  const handleChange = (field: keyof EnterpriseBranchConfig, val: string | number) => {
    setConfig(prev => ({ ...prev, [field]: val }));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enterprise Administration & Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure root branch profile specifications, audit staff roster credentials and enforce Role-Based Access Control (RBAC) security matrices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfig(INITIAL_CONFIG)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
          >
            <RefreshCcw className="w-4 h-4" /> Reset Defaults
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 pt-4 rounded-t-xl border-t border-x shadow-2xs">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('branch')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'branch'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Store className="w-4 h-4" />
            Branch Configuration
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Users className="w-4 h-4" />
            User Management Roster
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Shield className="w-4 h-4" />
            RBAC Roles & Policies
          </button>
        </nav>
      </div>

      {/* Tab Content Container */}
      <div className="bg-white dark:bg-gray-800 rounded-b-xl border-x border-b border-gray-200 dark:border-gray-700 shadow-sm p-6">
        
        {/* Branch Config Tab */}
        {activeTab === 'branch' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" /> Core Entity Profile
                </h3>
                <p className="text-xs text-gray-500 mt-1">Official corporate registration identifiers and primary operational contacts.</p>
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 font-mono font-bold text-xs rounded">
                ROOT REPOSITORY CODE: {config.branchCode}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">Registered Branch Name</label>
                <input
                  type="text"
                  value={config.branchName}
                  onChange={(e) => handleChange('branchName', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm font-semibold transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">Branch System Code</label>
                <input
                  type="text"
                  value={config.branchCode}
                  disabled
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900/60 text-gray-500 sm:text-sm font-mono font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">Corporate Registration ID</label>
                <input
                  type="text"
                  value={config.registrationNumber}
                  onChange={(e) => handleChange('registrationNumber', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">VAT / Tax Identification No.</label>
                <input
                  type="text"
                  value={config.vatTaxNumber}
                  onChange={(e) => handleChange('vatTaxNumber', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Headquarters Physical Street Address
                </label>
                <input
                  type="text"
                  value={config.headquartersAddress}
                  onChange={(e) => handleChange('headquartersAddress', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Primary Contact Hotline
                </label>
                <input
                  type="text"
                  value={config.primaryContactPhone}
                  onChange={(e) => handleChange('primaryContactPhone', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> Operations Support Email
                </label>
                <input
                  type="text"
                  value={config.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-emerald-600" /> Operational Parameters & Fiscal Defaults
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">Operating Sovereign Currency</label>
                  <select
                    value={config.operatingCurrency}
                    onChange={(e) => handleChange('operatingCurrency', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-primary focus:border-transparent font-bold"
                  >
                    <option value="USD ($)">USD ($) - United States Dollar</option>
                    <option value="EUR (€)">EUR (€) - Euro Zone</option>
                    <option value="GBP (£)">GBP (£) - British Pound</option>
                    <option value="VND (₫)">VND (₫) - Vietnam Dong</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">Timezone Offset Base</label>
                  <input
                    type="text"
                    value={config.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Max Daily Cash Float Drop Limit ($)
                  </label>
                  <input
                    type="number"
                    value={config.maxDailyCashDropLimitUsd}
                    onChange={(e) => handleChange('maxDailyCashDropLimitUsd', parseFloat(e.target.value) || 0)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono font-bold sm:text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">Auto-Batch Settlement Hour</label>
                  <input
                    type="text"
                    value={config.autoBatchSettlementHour}
                    onChange={(e) => handleChange('autoBatchSettlementHour', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => alert('Branch Configuration saved successfully.')}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg text-sm font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                <Save className="w-4 h-4" />
                Commit Branch Profile Changes
              </button>
            </div>
          </div>
        )}

        {/* User Management Tab Component */}
        {activeTab === 'users' && (
          <div className="-m-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Integrated Staff Directory Roster
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Below is the complete employee user directory. Click any record to inspect RBAC assignments and MFA telemetry.</p>
            </div>
            <div className="p-6">
              <UsersPage />
            </div>
          </div>
        )}

        {/* Roles Tab Component */}
        {activeTab === 'roles' && (
          <div className="-m-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" /> Integrated RBAC Role Management
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Below is the role security policy matrix. Click any role to review granular permission statements.</p>
            </div>
            <div className="p-6">
              <RolesPage />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
