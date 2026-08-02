/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, Bell, Shield, Smartphone, CreditCard, Check, 
  ChevronRight, LogOut, HardHat, Info, Wrench, ShieldAlert 
} from 'lucide-react';
import { UserType } from '../types';

interface SettingsViewProps {
  userType: UserType;
  onChangeUserType: (type: UserType) => void;
  onSignOut?: () => void;
}

export default function SettingsView({
  userType,
  onChangeUserType,
  onSignOut
}: SettingsViewProps) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div id="settings_view" className="space-y-6 pb-12 font-sans animate-fade-in max-w-xl mx-auto">
      
      {/* Title */}
      <div>
          <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#10B981]" /> Platform Settings
          </h2>
        <p className="text-xs text-zinc-500">
          Manage your recruitment credentials, site notification alerts, and active subscription billing plan.
        </p>
      </div>

      {/* Role Toggle box */}
      <div className="bg-white text-zinc-900 rounded-xl p-5 border border-zinc-200 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider">Active Workspace Role</h3>
          </div>
          <span className="text-[10px] font-mono text-[#10B981] font-black uppercase tracking-wider">PRO SWITCHER</span>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs text-zinc-500 leading-relaxed font-sans">
            You can seamlessly toggle between being a <b>Contractor (Employer)</b> hiring local lads, or a <b>Tradesman (Worker)</b> swiping through active subcontracts.
          </p>
          
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onChangeUserType('worker')}
              className={`py-3 rounded-lg text-xs font-mono font-black border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${userType === 'worker' ? 'bg-[#34D399] border-[#34D399] text-white shadow-sm' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'}`}
            >
              <Wrench className="w-4 h-4" /> I AM A TRADESMAN
            </button>
            <button
              onClick={() => onChangeUserType('employer')}
              className={`py-3 rounded-lg text-xs font-mono font-black border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${userType === 'employer' ? 'bg-[#34D399] border-[#34D399] text-white shadow-sm' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'}`}
            >
              <HardHat className="w-4 h-4" /> I AM AN EMPLOYER
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-zinc-900 font-sans">HireUp Pro Tier</h3>
            <p className="text-xs text-zinc-500 font-sans">Active billing cycle plan copy</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-[#10B981] rounded text-[10px] font-mono font-black">
            ACTIVE SUBSCRIBER
          </span>
        </div>

        <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl flex gap-3 items-center">
          <CreditCard className="w-6 h-6 text-[#10B981] flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="text-xs font-mono font-bold text-zinc-800">£19.99/Month (CIS Invoiced)</p>
            <p className="text-[10px] text-zinc-400 font-sans">Next automatic renewal: 12th July 2026. Paid via visa end: *4811</p>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
          <Bell className="w-4 h-4 text-[#10B981]" />
          <h3 className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider">Site Dispatches & Notification preferences</h3>
        </div>

        <div className="space-y-3.5">
          <label className="flex justify-between items-center cursor-pointer select-none">
            <div className="space-y-0.5 pr-2">
              <p className="text-xs font-sans font-bold text-zinc-800">Push Notifications</p>
              <p className="text-[10px] text-zinc-400 font-sans">Instant match notifications, foreman chat alerts, and interview scheduling proposals.</p>
            </div>
            <input 
              type="checkbox" 
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
              className="w-4 h-4 text-[#34D399] border-zinc-300 rounded focus:ring-[#34D399] accent-[#34D399]"
            />
          </label>

          <label className="flex justify-between items-center cursor-pointer select-none border-t border-zinc-100 pt-3.5">
            <div className="space-y-0.5 pr-2">
              <p className="text-xs font-sans font-bold text-zinc-800">SMS / Mobile Dispatches</p>
              <p className="text-[10px] text-zinc-400 font-sans">Receive automated text briefs if a contractor schedules an induction walkthrough inside 24 hours.</p>
            </div>
            <input 
              type="checkbox" 
              checked={smsEnabled}
              onChange={(e) => setSmsEnabled(e.target.checked)}
              className="w-4 h-4 text-[#34D399] border-zinc-300 rounded focus:ring-[#34D399] accent-[#34D399]"
            />
          </label>

          <label className="flex justify-between items-center cursor-pointer select-none border-t border-zinc-100 pt-3.5">
            <div className="space-y-0.5 pr-2">
              <p className="text-xs font-sans font-bold text-zinc-800">Weekly Market Digests</p>
              <p className="text-[10px] text-zinc-400 font-sans">Receive our market report regarding UK trade wage premiums and regional subcontractor demand spikes.</p>
            </div>
            <input 
              type="checkbox" 
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="w-4 h-4 text-[#34D399] border-zinc-300 rounded focus:ring-[#34D399] accent-[#34D399]"
            />
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 flex justify-between items-center">
        <button 
          onClick={handleSave}
          className="px-6 py-2.5 bg-[#34D399] hover:bg-[#10B981] text-white font-mono font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" /> SETTINGS PERSISTED
            </>
          ) : (
            "SAVE PLATFORM PREFERENCES"
          )}
        </button>
         <button 
          onClick={onSignOut}
          className="text-xs font-mono font-black text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> PACK UP & LOG OUT
        </button>
      </div>

    </div>
  );
}
