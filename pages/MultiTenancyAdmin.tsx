import React, { useState } from 'react';
import Card from '../components/Card';
import { CommunityIcon, AdminIcon, SearchIcon, CheckIcon } from '../components/icons';

const MultiTenancyAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'settings'>('tenants');

  const tenants = [
    { id: '1', name: 'Global Ministries', users: 12500, status: 'Active', region: 'North America' },
    { id: '2', name: 'African Outreach', users: 8400, status: 'Active', region: 'Africa' },
    { id: '3', name: 'European Fellowship', users: 3200, status: 'Pending', region: 'Europe' },
    { id: '4', name: 'Asian Missions', users: 5100, status: 'Active', region: 'Asia' },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-brand-text-primary flex items-center gap-4">
          <AdminIcon className="w-10 h-10 text-brand-accent"/>
          Community Multi-Tenancy
        </h1>
        <p className="text-brand-text-secondary mt-2">Sub-portal logic for organizational management and global scale.</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-brand-border pb-4">
        <button 
          onClick={() => setActiveTab('tenants')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'tenants' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-brand-secondary'}`}
        >
          Tenant Organizations
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'settings' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-brand-secondary'}`}
        >
          Global Settings
        </button>
      </div>

      {activeTab === 'tenants' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-brand-text-primary">Managed Organizations</h2>
            <button className="px-4 py-2 bg-brand-accent text-white rounded-lg font-bold hover:bg-opacity-90 transition-all flex items-center gap-2">
              <CommunityIcon className="w-4 h-4" />
              Add New Tenant
            </button>
          </div>

          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Search organizations..." 
              className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 pl-12 pr-4 text-brand-text-primary focus:outline-none focus:border-brand-accent"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-brand-text-secondary text-sm uppercase tracking-wider">
                  <th className="pb-3 px-4 font-semibold">Organization Name</th>
                  <th className="pb-3 px-4 font-semibold">Region</th>
                  <th className="pb-3 px-4 font-semibold">Active Users</th>
                  <th className="pb-3 px-4 font-semibold">Status</th>
                  <th className="pb-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(tenant => (
                  <tr key={tenant.id} className="border-b border-brand-border/50 hover:bg-brand-secondary/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-brand-text-primary">{tenant.name}</td>
                    <td className="py-4 px-4 text-brand-text-secondary">{tenant.region}</td>
                    <td className="py-4 px-4 text-brand-text-secondary">{tenant.users.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${tenant.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-brand-accent hover:underline text-sm font-bold">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <h2 className="text-xl font-bold text-brand-text-primary mb-6">Global Replication Settings</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-brand-secondary rounded-xl border border-brand-border">
              <div>
                <h3 className="font-bold text-brand-text-primary">Data Residency Enforcement</h3>
                <p className="text-sm text-brand-text-secondary">Ensure tenant data remains within specified geographic regions.</p>
              </div>
              <div className="w-12 h-6 bg-brand-accent rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-brand-secondary rounded-xl border border-brand-border">
              <div>
                <h3 className="font-bold text-brand-text-primary">Cross-Tenant Analytics</h3>
                <p className="text-sm text-brand-text-secondary">Aggregate anonymized usage data across all organizations.</p>
              </div>
              <div className="w-12 h-6 bg-brand-accent rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-brand-secondary rounded-xl border border-brand-border">
              <div>
                <h3 className="font-bold text-brand-text-primary">Automated Scaling</h3>
                <p className="text-sm text-brand-text-secondary">Dynamically allocate resources based on tenant load.</p>
              </div>
              <div className="w-12 h-6 bg-brand-accent rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MultiTenancyAdmin;
