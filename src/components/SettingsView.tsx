/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Settings,
  Bell,
  ShieldCheck,
  Lock,
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
  MapPin,
  UserCircle2,
  Eye,
  ClipboardCheck,
  Building2,
  Users,
  BarChart3,
  Pencil,
  X,
  Save,
  Phone,
  CalendarDays,
  Hash,
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

interface SettingsLinkProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

interface AccountFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  primaryTrade: string;
  experience: string;
  dayRate: string;
  availability: string;
  companyName: string;
  companyNumber: string;
  website: string;
  businessAddress: string;
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
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
    </div>
  );
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

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">
        {label}
      </span>

      <div
        className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border ${
          disabled
            ? 'bg-zinc-100 border-zinc-200'
            : 'bg-white border-zinc-200 focus-within:border-[#34D399] focus-within:ring-1 focus-within:ring-[#34D399]'
        }`}
      >
        <span className="text-zinc-400 flex-shrink-0">{icon}</span>
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm text-zinc-900 placeholder:text-zinc-400 disabled:text-zinc-500"
        />
      </div>
    </label>
  );
}

export default function SettingsView({
  userType,
  onChangeUserType: _onChangeUserType,
  onSignOut,
}: SettingsViewProps) {
  const isWorker = userType === 'worker';

  const [accountForm, setAccountForm] = useState<AccountFormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    primaryTrade: '',
    experience: '',
    dayRate: '',
    availability: 'Available now',
    companyName: '',
    companyNumber: '',
    website: '',
    businessAddress: '',
  });

  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [interviewNotifications, setInterviewNotifications] = useState(true);
  const [jobNotifications, setJobNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const accountId = useMemo(() => {
    const prefix = isWorker ? 'HU-W' : 'HU-C';
    return `${prefix}-483920`;
  }, [isWorker]);

  const stats = isWorker
    ? [
        { label: 'Applications', value: '0', icon: <Briefcase className="w-4 h-4" /> },
        { label: 'Active matches', value: '0', icon: <Sparkles className="w-4 h-4" /> },
        { label: 'Interviews', value: '0', icon: <CalendarCheck className="w-4 h-4" /> },
        { label: 'Profile views', value: '0', icon: <Eye className="w-4 h-4" /> },
      ]
    : [
        { label: 'Vacancies', value: '0', icon: <Briefcase className="w-4 h-4" /> },
        { label: 'Saved workers', value: '0', icon: <Users className="w-4 h-4" /> },
        { label: 'Interviews', value: '0', icon: <CalendarCheck className="w-4 h-4" /> },
        { label: 'Profile views', value: '0', icon: <Eye className="w-4 h-4" /> },
      ];

  const updateField = (field: keyof AccountFormState, value: string) => {
    setAccountForm(current => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = () => {
    setIsEditingAccount(false);
    setSavedSuccess(true);
    window.setTimeout(() => setSavedSuccess(false), 2200);
  };

  return (
    <div
      id="settings_view"
      className="max-w-6xl mx-auto pb-16 space-y-6 font-sans animate-fade-in"
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
            Manage your account information, verification, notifications,
            privacy and access settings.
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
              Changes saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save changes
            </>
          )}
        </button>
      </div>

      <section className="bg-zinc-950 text-white rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="p-6 xl:p-7 border-b xl:border-b-0 xl:border-r border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono font-black uppercase tracking-wider text-[#34D399]">
                  Account overview
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <h3 className="text-2xl font-black">
                    {isWorker ? 'Worker Account' : 'Contractor Account'}
                  </h3>

                  <span className="px-2.5 py-1 bg-[#34D399]/10 border border-[#34D399]/25 text-[#34D399] rounded-full text-[9px] font-mono font-black uppercase">
                    Permanent role
                  </span>
                </div>

                <p className="text-sm text-zinc-400 mt-2 max-w-xl">
                  Your HireUp account type was selected during registration and
                  cannot be changed from Settings.
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#34D399] flex-shrink-0">
                {isWorker ? (
                  <Wrench className="w-6 h-6" />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[9px] font-mono uppercase text-zinc-500">
                  HireUp ID
                </p>
                <p className="text-sm font-black mt-1">{accountId}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[9px] font-mono uppercase text-zinc-500">
                  Member since
                </p>
                <p className="text-sm font-black mt-1">August 2026</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[9px] font-mono uppercase text-zinc-500">
                  Profile visibility
                </p>
                <p className="text-sm font-black mt-1 text-[#34D399]">Public</p>
              </div>
            </div>

            <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">Verification progress</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Complete the remaining checks to strengthen your profile.
                  </p>
                </div>

                <span className="text-2xl font-black text-[#34D399]">60%</span>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-4">
                <div className="h-full w-3/5 bg-[#34D399] rounded-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
                <span className="flex items-center gap-2 text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                  Email verified
                </span>
                <span className="flex items-center gap-2 text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                  Phone verified
                </span>
                <span className="flex items-center gap-2 text-amber-300">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Identity pending
                </span>
                <span className="flex items-center gap-2 text-zinc-400">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {isWorker ? 'Qualifications pending' : 'Business checks pending'}
                </span>
              </div>

              <button
                type="button"
                className="mt-5 px-4 py-2.5 bg-white text-zinc-950 rounded-xl text-[10px] font-mono font-black uppercase hover:bg-zinc-100 transition-all"
              >
                Continue verification
              </button>
            </div>
          </div>

          <div className="p-6 xl:p-7">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#34D399]" />
              <p className="text-[10px] font-mono font-black uppercase tracking-wider text-[#34D399]">
                Account statistics
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="text-zinc-400">{stat.icon}</div>
                  <p className="text-2xl font-black mt-3">{stat.value}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20">
              <p className="text-xs font-bold text-[#6EE7B7]">
                Complete your profile
              </p>
              <p className="text-[10px] text-zinc-300 mt-1 leading-relaxed">
                Profiles with complete information and verified documents are
                more likely to appear in strong AI matches.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] gap-6">
        <div className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500">
                  Account information
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Personal details
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Keep your core account and contact information up to date.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingAccount(current => !current)}
                className="px-3.5 py-2 border border-zinc-200 rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-1.5 hover:border-zinc-300"
              >
                {isEditingAccount ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    Cancel edit
                  </>
                ) : (
                  <>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit details
                  </>
                )}
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="First name"
                  value={accountForm.firstName}
                  onChange={value => updateField('firstName', value)}
                  placeholder="Enter first name"
                  icon={<UserCircle2 className="w-4 h-4" />}
                  disabled={!isEditingAccount}
                />

                <FormField
                  label="Last name"
                  value={accountForm.lastName}
                  onChange={value => updateField('lastName', value)}
                  placeholder="Enter last name"
                  icon={<UserCircle2 className="w-4 h-4" />}
                  disabled={!isEditingAccount}
                />

                <FormField
                  label="Email address"
                  value={accountForm.email}
                  onChange={value => updateField('email', value)}
                  placeholder="name@example.com"
                  type="email"
                  icon={<Mail className="w-4 h-4" />}
                  disabled={!isEditingAccount}
                />

                <FormField
                  label="Phone number"
                  value={accountForm.phone}
                  onChange={value => updateField('phone', value)}
                  placeholder="07..."
                  type="tel"
                  icon={<Phone className="w-4 h-4" />}
                  disabled={!isEditingAccount}
                />

                <div className="md:col-span-2">
                  <FormField
                    label="Location"
                    value={accountForm.location}
                    onChange={value => updateField('location', value)}
                    placeholder="Town or city"
                    icon={<MapPin className="w-4 h-4" />}
                    disabled={!isEditingAccount}
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100">
                <div className="mb-4">
                  <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500">
                    {isWorker ? 'Work details' : 'Business details'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {isWorker
                      ? 'Information contractors use when reviewing your profile.'
                      : 'Information workers use when reviewing your company.'}
                  </p>
                </div>

                {isWorker ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Primary trade"
                      value={accountForm.primaryTrade}
                      onChange={value => updateField('primaryTrade', value)}
                      placeholder="e.g. Electrician"
                      icon={<Wrench className="w-4 h-4" />}
                      disabled={!isEditingAccount}
                    />

                    <FormField
                      label="Experience"
                      value={accountForm.experience}
                      onChange={value => updateField('experience', value)}
                      placeholder="e.g. 8 years"
                      icon={<CalendarDays className="w-4 h-4" />}
                      disabled={!isEditingAccount}
                    />

                    <FormField
                      label="Day rate"
                      value={accountForm.dayRate}
                      onChange={value => updateField('dayRate', value)}
                      placeholder="e.g. £220/day"
                      icon={<Briefcase className="w-4 h-4" />}
                      disabled={!isEditingAccount}
                    />

                    <FormField
                      label="Availability"
                      value={accountForm.availability}
                      onChange={value => updateField('availability', value)}
                      placeholder="e.g. Available now"
                      icon={<CalendarCheck className="w-4 h-4" />}
                      disabled={!isEditingAccount}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Company name"
                      value={accountForm.companyName}
                      onChange={value => updateField('companyName', value)}
                      placeholder="Registered business name"
                      icon={<Building2 className="w-4 h-4" />}
                      disabled={!isEditingAccount}
                    />

                    <FormField
                      label="Company number"
                      value={accountForm.companyNumber}
                      onChange={value => updateField('companyNumber', value)}
                      placeholder="Companies House number"
                      icon={<Hash className="w-4 h-4" />}
                      disabled={!isEditingAccount}
                    />

                    <FormField
                      label="Website"
                      value={accountForm.website}
                      onChange={value => updateField('website', value)}
                      placeholder="https://..."
                      icon={<Database className="w-4 h-4" />}
                      disabled={!isEditingAccount}
                    />

                    <FormField
                      label="Business address"
                      value={accountForm.businessAddress}
                      onChange={value => updateField('businessAddress', value)}
                      placeholder="Registered address"
                      icon={<MapPin className="w-4 h-4" />}
                      disabled={!isEditingAccount}
                    />
                  </div>
                )}
              </div>

              {isEditingAccount && (
                <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-col sm:flex-row justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingAccount(false)}
                    className="px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2.5 bg-[#34D399] hover:bg-[#10B981] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save account details
                  </button>
                </div>
              )}
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
          <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono font-black uppercase tracking-wider text-[#10B981]">
                  HireUp plan
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Current plan: Free
                </h3>
              </div>

              <Sparkles className="w-5 h-5 text-[#10B981]" />
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed mt-3">
              Your account remains free. Paid upgrade options will only appear
              once HireUp Pro is available.
            </p>

            <div className="mt-4 space-y-2">
              {[
                'AI matching',
                isWorker ? 'Job applications' : 'Worker shortlisting',
                'Messaging',
                'Interview scheduling',
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
              HireUp Pro coming soon
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
                title="Change password"
                description="Reset or update the password used to access HireUp."
                icon={<KeyRound className="w-4 h-4" />}
                disabled
              />
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