/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState } from 'react';
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
  Upload,
  Globe2,
  Clock3,
  Languages,
  SlidersHorizontal,
  Search,
  EyeOff,
  Power,
  Archive,
  Image as ImageIcon,
} from 'lucide-react';
import { UserType } from '../types';

interface SettingsViewProps {
  userType: UserType;
  onChangeUserType: (type: UserType) => void;
  onSignOut?: () => void;
}

type ProfileVisibility = 'public' | 'verified' | 'private';
type ThemePreference = 'light' | 'dark' | 'system';
type DistanceUnit = 'miles' | 'kilometres';

interface AccountFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  dateOfBirth: string;
  primaryTrade: string;
  experience: string;
  dayRate: string;
  availability: string;
  travelDistance: string;
  companyName: string;
  companyNumber: string;
  vatNumber: string;
  website: string;
  businessAddress: string;
  about: string;
}

interface SecurityFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  profileVisibility: ProfileVisibility;
  showInSearch: boolean;
  showOnlineStatus: boolean;
  allowDirectContact: boolean;
}

interface PreferenceState {
  theme: ThemePreference;
  language: string;
  distanceUnit: DistanceUnit;
  dateFormat: string;
  timeFormat: string;
  searchRadius: string;
  matchSensitivity: string;
}

interface VerificationFiles {
  identity: File | null;
  qualifications: File | null;
  cscs: File | null;
  insurance: File | null;
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
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 flex-shrink-0">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-950">{title}</p>
          <p className="text-xs text-zinc-700 mt-0.5 leading-relaxed">
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

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-800">
        {label}
      </span>

      <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border bg-white border-zinc-200 focus-within:border-[#34D399] focus-within:ring-1 focus-within:ring-[#34D399]">
        <span className="text-zinc-600 flex-shrink-0">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm text-zinc-950 placeholder:text-zinc-500"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  icon,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-800">
        {label}
      </span>

      <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border bg-white border-zinc-200 focus-within:border-[#34D399]">
        <span className="text-zinc-600 flex-shrink-0">{icon}</span>
        <select
          value={value}
          onChange={event => onChange(event.target.value)}
          className="w-full bg-transparent outline-none text-sm text-zinc-950"
        >
          {children}
        </select>
      </div>
    </label>
  );
}

function FileUploadRow({
  title,
  description,
  file,
  onChange,
}: {
  title: string;
  description: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 flex-shrink-0">
          <FileText className="w-4 h-4" />
        </div>

        <div>
          <p className="text-sm font-bold text-zinc-950">{title}</p>
          <p className="text-xs text-zinc-700 mt-0.5">{description}</p>
          {file && (
            <p className="text-[10px] font-mono font-bold text-[#10B981] mt-1">
              Selected: {file.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={event => onChange(event.target.files?.[0] || null)}
        />

        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-[10px] font-mono font-black uppercase text-zinc-700"
          >
            Remove
          </button>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-3 py-2 bg-zinc-950 text-white rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          {file ? 'Replace' : 'Upload'}
        </button>
      </div>
    </div>
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
    dateOfBirth: '',
    primaryTrade: '',
    experience: '',
    dayRate: '',
    availability: 'Available now',
    travelDistance: '25 miles',
    companyName: '',
    companyNumber: '',
    vatNumber: '',
    website: '',
    businessAddress: '',
    about: '',
  });

  const [securityForm, setSecurityForm] = useState<SecurityFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    profileVisibility: 'public',
    showInSearch: true,
    showOnlineStatus: true,
    allowDirectContact: true,
  });

  const [preferences, setPreferences] = useState<PreferenceState>({
    theme: 'light',
    language: 'English',
    distanceUnit: 'miles',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24 hour',
    searchRadius: '25',
    matchSensitivity: 'balanced',
  });

  const [verificationFiles, setVerificationFiles] =
    useState<VerificationFiles>({
      identity: null,
      qualifications: null,
      cscs: null,
      insurance: null,
    });

  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [interviewNotifications, setInterviewNotifications] = useState(true);
  const [jobNotifications, setJobNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [deactivated, setDeactivated] = useState(false);

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

  const updateAccountField = (
    field: keyof AccountFormState,
    value: string
  ) => {
    setAccountForm(current => ({ ...current, [field]: value }));
  };

  const updateSecurityField = <K extends keyof SecurityFormState>(
    field: K,
    value: SecurityFormState[K]
  ) => {
    setSecurityForm(current => ({ ...current, [field]: value }));
  };

  const updatePreference = <K extends keyof PreferenceState>(
    field: K,
    value: PreferenceState[K]
  ) => {
    setPreferences(current => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    setSavedSuccess(true);
    window.setTimeout(() => setSavedSuccess(false), 2200);
  };

  const handlePasswordUpdate = () => {
    if (!securityForm.currentPassword) {
      setPasswordMessage('Enter your current password.');
      return;
    }

    if (securityForm.newPassword.length < 8) {
      setPasswordMessage('New password must contain at least 8 characters.');
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setPasswordMessage('New passwords do not match.');
      return;
    }

    setPasswordMessage('Password change is ready to connect to Supabase Auth.');
    setSecurityForm(current => ({
      ...current,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  const handleDownloadData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      accountType: isWorker ? 'worker' : 'contractor',
      accountId,
      account: accountForm,
      security: {
        twoFactorEnabled: securityForm.twoFactorEnabled,
        profileVisibility: securityForm.profileVisibility,
        showInSearch: securityForm.showInSearch,
        showOnlineStatus: securityForm.showOnlineStatus,
        allowDirectContact: securityForm.allowDirectContact,
      },
      notifications: {
        matchNotifications,
        messageNotifications,
        interviewNotifications,
        jobNotifications,
        pushNotifications,
        smsNotifications,
        weeklyReports,
        marketingEmails,
      },
      preferences,
      verificationFiles: Object.fromEntries(
        Object.entries(verificationFiles).map(([key, file]) => [
          key,
          file ? file.name : null,
        ])
      ),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `hireup-account-${accountId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
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

          <p className="text-sm text-zinc-800 mt-1 max-w-2xl">
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

      <section className="bg-white text-zinc-950 border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="p-6 xl:p-7 border-b xl:border-b-0 xl:border-r border-zinc-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono font-black uppercase tracking-wider text-[#10B981]">
                  Account overview
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <h3 className="text-2xl font-black text-zinc-950">
                    {isWorker ? 'Worker Account' : 'Contractor Account'}
                  </h3>

                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[9px] font-mono font-black uppercase">
                    Permanent role
                  </span>
                </div>

                <p className="text-sm text-zinc-800 mt-2 max-w-xl">
                  Your HireUp account type was selected during registration and
                  cannot be changed from Settings.
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#10B981] flex-shrink-0">
                {isWorker ? (
                  <Wrench className="w-6 h-6" />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <p className="text-[9px] font-mono uppercase text-zinc-700">
                  HireUp ID
                </p>
                <p className="text-sm font-black text-zinc-950 mt-1">{accountId}</p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <p className="text-[9px] font-mono uppercase text-zinc-700">
                  Member since
                </p>
                <p className="text-sm font-black text-zinc-950 mt-1">
                  August 2026
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <p className="text-[9px] font-mono uppercase text-zinc-700">
                  Profile visibility
                </p>
                <p className="text-sm font-black text-[#10B981] mt-1 capitalize">
                  {securityForm.profileVisibility}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-zinc-950">
                    Verification progress
                  </p>
                  <p className="text-xs text-zinc-700 mt-1">
                    Complete the remaining checks to strengthen your profile.
                  </p>
                </div>

                <span className="text-2xl font-black text-[#10B981]">60%</span>
              </div>

              <div className="h-2 bg-zinc-200 rounded-full overflow-hidden mt-4">
                <div className="h-full w-3/5 bg-[#34D399] rounded-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
                <span className="flex items-center gap-2 text-zinc-950">
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  Email verified
                </span>
                <span className="flex items-center gap-2 text-zinc-950">
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  Phone verified
                </span>
                <span className="flex items-center gap-2 text-zinc-950">
                  <ClipboardCheck className="w-3.5 h-3.5 text-amber-500" />
                  Identity pending
                </span>
                <span className="flex items-center gap-2 text-zinc-950">
                  <BadgeCheck className="w-3.5 h-3.5 text-zinc-600" />
                  {isWorker
                    ? 'Qualifications pending'
                    : 'Business checks pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 xl:p-7">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#10B981]" />
              <p className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-950">
                Account statistics
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl p-4"
                >
                  <div className="text-zinc-700">{stat.icon}</div>
                  <p className="text-2xl font-black text-zinc-950 mt-3">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-zinc-800 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-bold text-zinc-950">
                Complete your profile
              </p>
              <p className="text-[10px] text-zinc-800 mt-1 leading-relaxed">
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
            <div className="p-5 border-b border-zinc-100">
              <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
                Account information
              </p>
              <h3 className="text-lg font-black text-zinc-950 mt-1">
                Personal details
              </h3>
              <p className="text-xs text-zinc-700 mt-1">
                Update the information shown on your account and public profile.
              </p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="First name"
                  value={accountForm.firstName}
                  onChange={value => updateAccountField('firstName', value)}
                  placeholder="Enter first name"
                  icon={<UserCircle2 className="w-4 h-4" />}
                />
                <FormField
                  label="Last name"
                  value={accountForm.lastName}
                  onChange={value => updateAccountField('lastName', value)}
                  placeholder="Enter last name"
                  icon={<UserCircle2 className="w-4 h-4" />}
                />
                <FormField
                  label="Email address"
                  value={accountForm.email}
                  onChange={value => updateAccountField('email', value)}
                  placeholder="name@example.com"
                  type="email"
                  icon={<Mail className="w-4 h-4" />}
                />
                <FormField
                  label="Phone number"
                  value={accountForm.phone}
                  onChange={value => updateAccountField('phone', value)}
                  placeholder="07..."
                  type="tel"
                  icon={<Phone className="w-4 h-4" />}
                />
                <FormField
                  label="Location"
                  value={accountForm.location}
                  onChange={value => updateAccountField('location', value)}
                  placeholder="Town or city"
                  icon={<MapPin className="w-4 h-4" />}
                />
                <FormField
                  label="Date of birth"
                  value={accountForm.dateOfBirth}
                  onChange={value => updateAccountField('dateOfBirth', value)}
                  type="date"
                  icon={<CalendarDays className="w-4 h-4" />}
                />
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100">
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
                  {isWorker ? 'Work details' : 'Business details'}
                </p>

                {isWorker ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label="Primary trade"
                      value={accountForm.primaryTrade}
                      onChange={value =>
                        updateAccountField('primaryTrade', value)
                      }
                      placeholder="e.g. Electrician"
                      icon={<Wrench className="w-4 h-4" />}
                    />
                    <FormField
                      label="Experience"
                      value={accountForm.experience}
                      onChange={value =>
                        updateAccountField('experience', value)
                      }
                      placeholder="e.g. 8 years"
                      icon={<CalendarDays className="w-4 h-4" />}
                    />
                    <FormField
                      label="Day rate"
                      value={accountForm.dayRate}
                      onChange={value => updateAccountField('dayRate', value)}
                      placeholder="e.g. £220/day"
                      icon={<Briefcase className="w-4 h-4" />}
                    />
                    <FormField
                      label="Availability"
                      value={accountForm.availability}
                      onChange={value =>
                        updateAccountField('availability', value)
                      }
                      placeholder="e.g. Available now"
                      icon={<CalendarCheck className="w-4 h-4" />}
                    />
                    <FormField
                      label="Travel distance"
                      value={accountForm.travelDistance}
                      onChange={value =>
                        updateAccountField('travelDistance', value)
                      }
                      placeholder="e.g. 25 miles"
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label="Company name"
                      value={accountForm.companyName}
                      onChange={value =>
                        updateAccountField('companyName', value)
                      }
                      placeholder="Registered business name"
                      icon={<Building2 className="w-4 h-4" />}
                    />
                    <FormField
                      label="Company number"
                      value={accountForm.companyNumber}
                      onChange={value =>
                        updateAccountField('companyNumber', value)
                      }
                      placeholder="Companies House number"
                      icon={<Hash className="w-4 h-4" />}
                    />
                    <FormField
                      label="VAT number"
                      value={accountForm.vatNumber}
                      onChange={value =>
                        updateAccountField('vatNumber', value)
                      }
                      placeholder="VAT registration number"
                      icon={<Hash className="w-4 h-4" />}
                    />
                    <FormField
                      label="Website"
                      value={accountForm.website}
                      onChange={value => updateAccountField('website', value)}
                      placeholder="https://..."
                      icon={<Globe2 className="w-4 h-4" />}
                    />
                    <div className="md:col-span-2">
                      <FormField
                        label="Business address"
                        value={accountForm.businessAddress}
                        onChange={value =>
                          updateAccountField('businessAddress', value)
                        }
                        placeholder="Registered business address"
                        icon={<MapPin className="w-4 h-4" />}
                      />
                    </div>
                  </div>
                )}

                <label className="block space-y-2 mt-4">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-800">
                    {isWorker ? 'About me' : 'About the business'}
                  </span>
                  <textarea
                    value={accountForm.about}
                    onChange={event =>
                      updateAccountField('about', event.target.value)
                    }
                    rows={4}
                    placeholder="Write a short profile description..."
                    className="w-full px-3.5 py-3 rounded-xl border border-zinc-200 outline-none text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#10B981]" />
              <div>
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
                  Notifications
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Notification preferences
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
                    : 'Be notified when suitable workers become available.'
                }
                checked={jobNotifications}
                onChange={setJobNotifications}
                icon={<Briefcase className="w-4 h-4" />}
              />
              <ToggleRow
                title="Push notifications"
                description="Allow browser and device notifications from HireUp."
                checked={pushNotifications}
                onChange={setPushNotifications}
                icon={<Bell className="w-4 h-4" />}
              />
              <ToggleRow
                title="SMS alerts"
                description="Receive important interview and account alerts by text."
                checked={smsNotifications}
                onChange={setSmsNotifications}
                icon={<Smartphone className="w-4 h-4" />}
              />
              <ToggleRow
                title="Weekly reports"
                description="Receive a weekly summary of matches, activity and opportunities."
                checked={weeklyReports}
                onChange={setWeeklyReports}
                icon={<BarChart3 className="w-4 h-4" />}
              />
              <ToggleRow
                title="Marketing emails"
                description="Receive occasional product news and HireUp updates."
                checked={marketingEmails}
                onChange={setMarketingEmails}
                icon={<Mail className="w-4 h-4" />}
              />
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100">
              <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
                Verification documents
              </p>
              <h3 className="text-lg font-black text-zinc-950 mt-1">
                Upload verification files
              </h3>
              <p className="text-xs text-zinc-700 mt-1">
                Files are selected locally for now and can later be connected to
                Supabase Storage.
              </p>
            </div>

            <div className="px-5 divide-y divide-zinc-100">
              <FileUploadRow
                title="Identity document"
                description="Passport, driving licence or accepted photo ID."
                file={verificationFiles.identity}
                onChange={file =>
                  setVerificationFiles(current => ({
                    ...current,
                    identity: file,
                  }))
                }
              />
              <FileUploadRow
                title={isWorker ? 'Trade qualifications' : 'Business registration'}
                description={
                  isWorker
                    ? 'Upload certificates, NVQs and recognised qualifications.'
                    : 'Upload Companies House or registration documentation.'
                }
                file={verificationFiles.qualifications}
                onChange={file =>
                  setVerificationFiles(current => ({
                    ...current,
                    qualifications: file,
                  }))
                }
              />
              <FileUploadRow
                title={isWorker ? 'CSCS or trade card' : 'Insurance documents'}
                description={
                  isWorker
                    ? 'Upload the front or digital copy of your trade card.'
                    : 'Upload public or employers liability documentation.'
                }
                file={verificationFiles.cscs}
                onChange={file =>
                  setVerificationFiles(current => ({
                    ...current,
                    cscs: file,
                  }))
                }
              />
              <FileUploadRow
                title="Additional verification"
                description="Upload any supporting verification document."
                file={verificationFiles.insurance}
                onChange={file =>
                  setVerificationFiles(current => ({
                    ...current,
                    insurance: file,
                  }))
                }
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#10B981]" />
              <div>
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
                  Security
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Password and sign-in
                </h3>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <FormField
                label="Current password"
                value={securityForm.currentPassword}
                onChange={value =>
                  updateSecurityField('currentPassword', value)
                }
                placeholder="Enter current password"
                type="password"
                icon={<KeyRound className="w-4 h-4" />}
              />
              <FormField
                label="New password"
                value={securityForm.newPassword}
                onChange={value => updateSecurityField('newPassword', value)}
                placeholder="At least 8 characters"
                type="password"
                icon={<Lock className="w-4 h-4" />}
              />
              <FormField
                label="Confirm new password"
                value={securityForm.confirmPassword}
                onChange={value =>
                  updateSecurityField('confirmPassword', value)
                }
                placeholder="Repeat new password"
                type="password"
                icon={<ShieldCheck className="w-4 h-4" />}
              />

              {passwordMessage && (
                <p className="text-xs text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                  {passwordMessage}
                </p>
              )}

              <button
                type="button"
                onClick={handlePasswordUpdate}
                className="w-full py-3 bg-zinc-950 text-white rounded-xl text-xs font-mono font-black uppercase"
              >
                Update password
              </button>

              <div className="border-t border-zinc-100 pt-1">
                <ToggleRow
                  title="Two-factor authentication"
                  description="Require a second verification step when signing in."
                  checked={securityForm.twoFactorEnabled}
                  onChange={value =>
                    updateSecurityField('twoFactorEnabled', value)
                  }
                  icon={<ShieldCheck className="w-4 h-4" />}
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
              <Eye className="w-5 h-5 text-[#10B981]" />
              <div>
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
                  Privacy
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Profile visibility
                </h3>
              </div>
            </div>

            <div className="p-5">
              <SelectField
                label="Who can view my profile?"
                value={securityForm.profileVisibility}
                onChange={value =>
                  updateSecurityField(
                    'profileVisibility',
                    value as ProfileVisibility
                  )
                }
                icon={<Eye className="w-4 h-4" />}
              >
                <option value="public">Public</option>
                <option value="verified">Verified members only</option>
                <option value="private">Private</option>
              </SelectField>

              <div className="divide-y divide-zinc-100 mt-3">
                <ToggleRow
                  title="Show profile in search"
                  description="Allow your profile to appear in HireUp searches."
                  checked={securityForm.showInSearch}
                  onChange={value =>
                    updateSecurityField('showInSearch', value)
                  }
                  icon={<Search className="w-4 h-4" />}
                />
                <ToggleRow
                  title="Show online status"
                  description="Let other members know when you are active."
                  checked={securityForm.showOnlineStatus}
                  onChange={value =>
                    updateSecurityField('showOnlineStatus', value)
                  }
                  icon={<Eye className="w-4 h-4" />}
                />
                <ToggleRow
                  title="Allow direct contact"
                  description="Allow verified members to contact you directly."
                  checked={securityForm.allowDirectContact}
                  onChange={value =>
                    updateSecurityField('allowDirectContact', value)
                  }
                  icon={<Phone className="w-4 h-4" />}
                />
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
              <SlidersHorizontal className="w-5 h-5 text-[#10B981]" />
              <div>
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
                  Preferences
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Platform experience
                </h3>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 gap-4">
              <SelectField
                label="Theme"
                value={preferences.theme}
                onChange={value =>
                  updatePreference('theme', value as ThemePreference)
                }
                icon={<ImageIcon className="w-4 h-4" />}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">Use device setting</option>
              </SelectField>

              <SelectField
                label="Language"
                value={preferences.language}
                onChange={value => updatePreference('language', value)}
                icon={<Languages className="w-4 h-4" />}
              >
                <option value="English">English</option>
                <option value="Welsh">Welsh</option>
              </SelectField>

              <SelectField
                label="Distance unit"
                value={preferences.distanceUnit}
                onChange={value =>
                  updatePreference('distanceUnit', value as DistanceUnit)
                }
                icon={<MapPin className="w-4 h-4" />}
              >
                <option value="miles">Miles</option>
                <option value="kilometres">Kilometres</option>
              </SelectField>

              <SelectField
                label="Date format"
                value={preferences.dateFormat}
                onChange={value => updatePreference('dateFormat', value)}
                icon={<CalendarDays className="w-4 h-4" />}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </SelectField>

              <SelectField
                label="Time format"
                value={preferences.timeFormat}
                onChange={value => updatePreference('timeFormat', value)}
                icon={<Clock3 className="w-4 h-4" />}
              >
                <option value="24 hour">24 hour</option>
                <option value="12 hour">12 hour</option>
              </SelectField>

              <FormField
                label="Default search radius"
                value={preferences.searchRadius}
                onChange={value => updatePreference('searchRadius', value)}
                placeholder="25"
                type="number"
                icon={<MapPin className="w-4 h-4" />}
              />

              <SelectField
                label="AI match sensitivity"
                value={preferences.matchSensitivity}
                onChange={value =>
                  updatePreference('matchSensitivity', value)
                }
                icon={<Sparkles className="w-4 h-4" />}
              >
                <option value="strict">Strict</option>
                <option value="balanced">Balanced</option>
                <option value="broad">Broad</option>
              </SelectField>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
              Account data
            </p>
            <h3 className="text-lg font-black text-zinc-950 mt-1">
              Export your information
            </h3>
            <p className="text-xs text-zinc-700 mt-2 leading-relaxed">
              Download a JSON copy of the information currently entered on this
              Settings page.
            </p>

            <button
              type="button"
              onClick={handleDownloadData}
              className="w-full mt-4 py-3 border border-zinc-300 text-zinc-950 rounded-xl text-xs font-mono font-black uppercase flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download my data
            </button>
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
              <LifeBuoy className="w-5 h-5 text-[#10B981]" />
              <div>
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
                  Support
                </p>
                <h3 className="text-lg font-black text-zinc-950 mt-1">
                  Help and legal
                </h3>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {[
                {
                  title: 'Contact support',
                  description: 'Get help with your account or report an issue.',
                  icon: <HelpCircle className="w-4 h-4" />,
                },
                {
                  title: 'Terms of service',
                  description: 'Read the rules that apply when using HireUp.',
                  icon: <FileText className="w-4 h-4" />,
                },
                {
                  title: 'Privacy policy',
                  description: 'Learn how HireUp handles your information.',
                  icon: <ShieldAlert className="w-4 h-4" />,
                },
              ].map(item => (
                <button
                  key={item.title}
                  type="button"
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-zinc-50"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-zinc-950">
                        {item.title}
                      </span>
                      <span className="block text-xs text-zinc-700 mt-0.5">
                        {item.description}
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="bg-white border border-red-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-red-100">
          <p className="text-xs font-mono font-black uppercase tracking-wider text-red-600">
            Danger zone
          </p>
          <h3 className="text-lg font-black text-zinc-950 mt-1">
            Sign out or manage your account
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-red-100">
          <button
            type="button"
            onClick={onSignOut}
            className="p-4 flex items-center justify-between gap-3 text-left hover:bg-red-50"
          >
            <span className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-bold text-red-600">
                  Log out
                </span>
                <span className="block text-xs text-zinc-700 mt-0.5">
                  Sign out on this device.
                </span>
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </button>

          <button
            type="button"
            onClick={() => setDeactivated(current => !current)}
            className="p-4 flex items-center justify-between gap-3 text-left hover:bg-red-50"
          >
            <span className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Power className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-bold text-red-600">
                  {deactivated ? 'Reactivate account' : 'Deactivate account'}
                </span>
                <span className="block text-xs text-zinc-700 mt-0.5">
                  {deactivated
                    ? 'Restore account visibility.'
                    : 'Temporarily hide your account.'}
                </span>
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </button>

          <button
            type="button"
            className="p-4 flex items-center justify-between gap-3 text-left hover:bg-red-50"
          >
            <span className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-bold text-red-600">
                  Delete account
                </span>
                <span className="block text-xs text-zinc-700 mt-0.5">
                  Permanently remove your account.
                </span>
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </button>
        </div>
      </section>
    </div>
  );
}