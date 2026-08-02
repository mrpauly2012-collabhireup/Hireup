/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Bell,
  ShieldCheck,
  Lock,
  UserCircle2,
  BriefcaseBusiness,
  Wrench,
  Check,
  LogOut,
  Download,
  HelpCircle,
  FileText,
  LifeBuoy,
  BadgeCheck,
  Sparkles,
  ChevronRight,
  Trash2,
  Mail,
  MessageSquare,
  CalendarCheck,
  Briefcase,
  KeyRound,
  Smartphone,
  Database,
  ShieldAlert,
} from 'lucide-react';
import { UserType } from '../types';

interface SettingsViewProps {
  userType: UserType;
  onChangeUserType: (type: UserType) => void;
  onSignOut?: () => void;
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ReactNode;
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon,
}: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-4 py-4 cursor-pointer select-none">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 flex-shrink-0">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-900">{title}</p>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${
          checked ? 'bg-[#34D399]' : 'bg-zinc-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

interface SettingsLinkProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

function SettingsLink({
  title,
  description,
  icon,
  disabled = false,
  danger = false,
  onClick,
}: SettingsLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between gap-4 p-4 text-left transition-all ${
        disabled
          ? 'cursor-not-allowed opacity-55'
          : danger
          ? 'hover:bg-red-50'
          : 'hover:bg-zinc-50'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            danger
              ? 'bg-red-50 text-red-500'
              : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p
            className={`text-sm font-bold ${
              danger ? 'text-red-600' : 'text-zinc-900'
            }`}
          >
            {title}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <ChevronRight
        className={`w-4 h-4 flex-shrink-0 ${
          danger ? 'text-red-300' : 'text-zinc-300'
        }`}
      />
    </button>
  );
}

export default function SettingsView({
  userType,
  onChangeUserType,
  onSignOut,
}: SettingsViewProps) {
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [interviewNotifications, setInterviewNotifications] = useState(true);
  const [jobNotifications, setJobNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    window.setTimeout(() => setSavedSuccess(false), 2200);
  };

  const isWorker = userType === 'worker';

  return (
    <div
      id="settings_view"
      className="max-w-5xl mx-auto pb-16 space-y-6 font-sans animate-fade-in"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#10B981]" />
            <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-[#10B981]">
              HireUp account controls
            </p>
          </div>

          <h2 className="text-2xl font-black text-zinc-950 mt-2">
            Platform Settings
          </h2>

          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
            Manage your account type, verification, notifications, privacy and
            access settings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-3 bg-[#34D399] hover:bg-[#10B981] text-white rounded-xl text-xs font-mono font-black uppercase transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              Preferences saved
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] gap-6">
        <div className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500">
                  Account
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Current account type
                </h3>
              </div>

              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[9px] font-mono font-black uppercase">
                Active
              </span>
            </div>

            <div className="p-5">
              <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                Choose how you use HireUp. Your navigation and dashboard will
                update to match the selected account type.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onChangeUserType('worker')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isWorker
                      ? 'bg-emerald-50 border-[#34D399] ring-1 ring-[#34D399]'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        isWorker
                          ? 'bg-[#34D399] text-white'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      <Wrench className="w-5 h-5" />
                    </div>

                    {isWorker && (
                      <Check className="w-5 h-5 text-[#10B981]" />
                    )}
                  </div>

                  <p className="text-sm font-black text-zinc-950 mt-4">
                    Worker
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Find work, apply for vacancies and connect with verified
                    contractors.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeUserType('employer')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    !isWorker
                      ? 'bg-emerald-50 border-[#34D399] ring-1 ring-[#34D399]'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        !isWorker
                          ? 'bg-[#34D399] text-white'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      <BriefcaseBusiness className="w-5 h-5" />
                    </div>

                    {!isWorker && (
                      <Check className="w-5 h-5 text-[#10B981]" />
                    )}
                  </div>

                  <p className="text-sm font-black text-zinc-950 mt-4">
                    Contractor
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Recruit verified workers, manage vacancies and schedule
                    interviews.
                  </p>
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100">
              <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500">
                Profile
              </p>
              <h3 className="text-lg font-black text-zinc-950 mt-1">
                Account information
              </h3>
            </div>

            <div className="divide-y divide-zinc-100">
              <SettingsLink
                title="Email address"
                description="Manage the email address used to access your HireUp account."
                icon={<Mail className="w-4 h-4" />}
                disabled
              />
              <SettingsLink
                title="Phone number"
                description="Update the number used for interview and account notifications."
                icon={<Smartphone className="w-4 h-4" />}
                disabled
              />
              <SettingsLink
                title="Change password"
                description="Reset or update the password used to sign in."
                icon={<KeyRound className="w-4 h-4" />}
                disabled
              />
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#10B981]" />
              <div>
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500">
                  Notifications
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  What should HireUp tell you about?
                </h3>
              </div>
            </div>

            <div className="px-5 divide-y divide-zinc-100">
              <ToggleRow
                title="Match notifications"
                description="Get notified when a new worker or vacancy matches your profile."
                checked={matchNotifications}
                onChange={setMatchNotifications}
                icon={<Sparkles className="w-4 h-4" />}
              />

              <ToggleRow
                title="New messages"
                description="Receive alerts when someone sends you a new HireUp message."
                checked={messageNotifications}
                onChange={setMessageNotifications}
                icon={<MessageSquare className="w-4 h-4" />}
              />

              <ToggleRow
                title="Interview reminders"
                description="Receive reminders for upcoming interviews and site meetings."
                checked={interviewNotifications}
                onChange={setInterviewNotifications}
                icon={<CalendarCheck className="w-4 h-4" />}
              />

              <ToggleRow
                title={isWorker ? 'Job alerts' : 'Worker availability alerts'}
                description={
                  isWorker
                    ? 'Be notified when suitable vacancies are posted near you.'
                    : 'Be notified when suitable verified workers become available.'
                }
                checked={jobNotifications}
                onChange={setJobNotifications}
                icon={<Briefcase className="w-4 h-4" />}
              />

              <ToggleRow
                title="Marketing emails"
                description="Receive occasional HireUp product news and platform updates."
                checked={marketingEmails}
                onChange={setMarketingEmails}
                icon={<Mail className="w-4 h-4" />}
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-zinc-950 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono font-black uppercase tracking-wider text-[#34D399]">
                  Verification
                </p>
                <h3 className="text-lg font-black mt-1">Account status</h3>
              </div>

              <BadgeCheck className="w-6 h-6 text-[#34D399]" />
            </div>

            <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">Verification pending</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Complete your profile and submit the required documents.
                  </p>
                </div>

                <span className="px-2.5 py-1 bg-amber-400/10 border border-amber-300/20 text-amber-300 rounded-full text-[9px] font-mono font-black uppercase">
                  Pending
                </span>
              </div>
            </div>

            <button
              type="button"
              className="w-full mt-4 py-3 bg-white text-zinc-950 rounded-xl text-xs font-mono font-black uppercase hover:bg-zinc-100 transition-all"
            >
              View verification
            </button>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono font-black uppercase tracking-wider text-[#10B981]">
                  HireUp Pro
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Current plan: Free
                </h3>
              </div>

              <Sparkles className="w-5 h-5 text-[#10B981]" />
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed mt-3">
              Upgrade options will be added later. Your account will remain on
              the free plan until then.
            </p>

            <div className="mt-4 space-y-2">
              {[
                'Unlimited AI matching',
                'Priority applications',
                'Verified profile boost',
                'Advanced analytics',
              ].map(item => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs text-zinc-700"
                >
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  {item}
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled
              className="w-full mt-5 py-3 bg-zinc-100 text-zinc-400 rounded-xl text-xs font-mono font-black uppercase cursor-not-allowed"
            >
              Coming soon
            </button>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#10B981]" />
              <div>
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500">
                  Privacy & security
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Control your account data
                </h3>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              <SettingsLink
                title="Two-factor authentication"
                description="Add another layer of protection to your account."
                icon={<ShieldCheck className="w-4 h-4" />}
                disabled
              />
              <SettingsLink
                title="Download my data"
                description="Request a copy of your HireUp account information."
                icon={<Download className="w-4 h-4" />}
                disabled
              />
              <SettingsLink
                title="Privacy settings"
                description="Review how your profile and activity are displayed."
                icon={<Database className="w-4 h-4" />}
                disabled
              />
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
              <LifeBuoy className="w-5 h-5 text-[#10B981]" />
              <div>
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500">
                  Support
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Help and legal
                </h3>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              <SettingsLink
                title="Contact support"
                description="Get help with your account or report a platform issue."
                icon={<HelpCircle className="w-4 h-4" />}
                disabled
              />
              <SettingsLink
                title="Terms of service"
                description="Read the rules that apply when using HireUp."
                icon={<FileText className="w-4 h-4" />}
                disabled
              />
              <SettingsLink
                title="Privacy policy"
                description="Learn how HireUp stores and handles your information."
                icon={<ShieldAlert className="w-4 h-4" />}
                disabled
              />
            </div>
          </section>
        </div>
      </div>

      <section className="bg-white border border-red-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-red-100">
          <p className="text-xs font-mono font-black uppercase tracking-wider text-red-500">
            Danger zone
          </p>
          <h3 className="text-lg font-black text-zinc-950 mt-1">
            Sign out or remove your account
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-red-100">
          <SettingsLink
            title="Log out"
            description="Sign out of HireUp on this device."
            icon={<LogOut className="w-4 h-4" />}
            danger
            onClick={onSignOut}
          />
          <SettingsLink
            title="Delete account"
            description="Permanently delete your profile and account data."
            icon={<Trash2 className="w-4 h-4" />}
            danger
            disabled
          />
        </div>
      </section>
    </div>
  );
}