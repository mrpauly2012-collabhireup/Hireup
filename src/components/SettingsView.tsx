/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Scale,
} from 'lucide-react';
import { CompanyProfile, UserType, WorkerProfile } from '../types';
import {
  fetchUserSettings,
  saveUserSettings,
  supabase,
  uploadFileToStorage,
} from '../lib/supabase';
import {
  disableHireUpPushNotifications,
  enableHireUpPushNotifications,
  getInstallState,
  getNotificationPermission,
  getPushSubscriptionState,
  promptHireUpInstall,
  subscribeToPwaChanges,
  type InstallState,
  type PushSubscriptionState,
} from '../lib/pwa';

interface SettingsViewProps {
  userType: UserType;
  currentUserEmail: string;
  workerProfile: WorkerProfile | null;
  companyProfile: CompanyProfile | null;
  onUpdateWorker: (profile: WorkerProfile) => Promise<void> | void;
  onUpdateCompany: (profile: CompanyProfile) => Promise<void> | void;
  onOpenInformationCentre: () => void;
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
  county: string;
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
  insuranceStatus: string;
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


const EAST_SUSSEX_TOWNS = [
  'Battle',
  'Bexhill-on-Sea',
  'Brighton',
  'Crowborough',
  'Eastbourne',
  'Hailsham',
  'Hastings',
  'Heathfield',
  'Hove',
  'Lewes',
  'Newhaven',
  'Peacehaven',
  'Polegate',
  'Ringmer',
  'Rye',
  'Saltdean',
  'Seaford',
  'St Leonards-on-Sea',
  'Uckfield',
];

const WEST_SUSSEX_TOWNS = [
  'Angmering',
  'Arundel',
  'Billingshurst',
  'Bognor Regis',
  'Burgess Hill',
  'Chichester',
  'Crawley',
  'East Grinstead',
  'Haywards Heath',
  'Horsham',
  'Lancing',
  'Littlehampton',
  'Midhurst',
  'Petworth',
  'Pulborough',
  'Rustington',
  'Selsey',
  'Shoreham-by-Sea',
  'Steyning',
  'Worthing',
];

const LOCATION_COUNTIES = ['East Sussex', 'West Sussex'] as const;

const getCountyFromTown = (town: string): string => {
  if (EAST_SUSSEX_TOWNS.includes(town)) return 'East Sussex';
  if (WEST_SUSSEX_TOWNS.includes(town)) return 'West Sussex';
  return '';
};

const PRIMARY_TRADES = [
  'Bricklayer',
  'Carpenter / Joiner',
  'Cleaner',
  'Decorator',
  'Demolition Operative',
  'Dryliner',
  'Electrician',
  'Floor Layer',
  'General Labourer',
  'Groundworker',
  'Handyman',
  'Heating Engineer',
  'Landscaper',
  'Machine Operator',
  'Painter',
  'Plasterer',
  'Plumber',
  'Roofer',
  'Scaffolder',
  'Site Manager',
  'Steel Fixer',
  'Tiler',
  'Welder / Fabricator',
  'Window Fitter',
];

const EXPERIENCE_OPTIONS = [
  'Less than 1 year',
  '1 year',
  '2 years',
  '3 years',
  '4 years',
  '5 years',
  '6 years',
  '7 years',
  '8 years',
  '9 years',
  '10 years',
  '11–15 years',
  '16–20 years',
  '21–25 years',
  '26–30 years',
  '30+ years',
];

const DAY_RATE_OPTIONS = [
  'Under £100/day',
  '£100/day',
  '£120/day',
  '£140/day',
  '£150/day',
  '£160/day',
  '£180/day',
  '£200/day',
  '£220/day',
  '£240/day',
  '£250/day',
  '£260/day',
  '£280/day',
  '£300/day',
  '£325/day',
  '£350/day',
  '£375/day',
  '£400/day',
  '£450/day',
  '£500+/day',
  'Negotiable',
];

const AVAILABILITY_OPTIONS = [
  'Available now',
  'Available tomorrow',
  'Available this week',
  'Available next week',
  'Available within 2 weeks',
  'Available within 1 month',
  'Weekends only',
  'Evenings only',
  'Currently unavailable',
];

const TRAVEL_DISTANCE_OPTIONS = [
  '5 miles',
  '10 miles',
  '15 miles',
  '20 miles',
  '25 miles',
  '30 miles',
  '40 miles',
  '50 miles',
  '75 miles',
  '100 miles',
  'Anywhere in the UK',
];

const DATE_MONTHS = [
  ['01', 'January'],
  ['02', 'February'],
  ['03', 'March'],
  ['04', 'April'],
  ['05', 'May'],
  ['06', 'June'],
  ['07', 'July'],
  ['08', 'August'],
  ['09', 'September'],
  ['10', 'October'],
  ['11', 'November'],
  ['12', 'December'],
] as const;

const DATE_YEARS = Array.from(
  { length: 83 },
  (_, index) => String(new Date().getFullYear() - 18 - index)
);

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
        className={`relative w-11 h-6 rounded-full transition-all duration-200 ease-out flex-shrink-0 ${
          checked ? 'bg-[#34D399]' : 'bg-zinc-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ease-out ${
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

      <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border bg-white border-zinc-200/80 focus-within:border-[#34D399] focus-within:ring-1 focus-within:ring-[#34D399]">
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

      <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border bg-white border-zinc-200/80 focus-within:border-[#34D399]">
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


function DateOfBirthField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [year = '', month = '', day = ''] = value
    ? value.split('-')
    : ['', '', ''];

  const daysInSelectedMonth =
    year && month
      ? new Date(Number(year), Number(month), 0).getDate()
      : 31;

  const days = Array.from(
    { length: daysInSelectedMonth },
    (_, index) => String(index + 1).padStart(2, '0')
  );

  const updateDate = (
    nextYear: string,
    nextMonth: string,
    nextDay: string
  ) => {
    if (!nextYear && !nextMonth && !nextDay) {
      onChange('');
      return;
    }

    onChange(`${nextYear}-${nextMonth}-${nextDay}`);
  };

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-800">
        Date of birth
      </span>

      <div className="grid grid-cols-[0.8fr_1.35fr_1fr] gap-2">
        <select
          value={day}
          onChange={event =>
            updateDate(year, month, event.target.value)
          }
          className="w-full px-3 py-3 rounded-xl border bg-white border-zinc-200/80 outline-none text-sm text-zinc-950 focus:border-[#34D399]"
          aria-label="Birth day"
        >
          <option value="">Day</option>
          {days.map(item => (
            <option key={item} value={item}>
              {Number(item)}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={event => {
            const nextMonth = event.target.value;
            const maximumDay =
              year && nextMonth
                ? new Date(Number(year), Number(nextMonth), 0).getDate()
                : 31;
            const nextDay =
              day && Number(day) > maximumDay
                ? String(maximumDay).padStart(2, '0')
                : day;

            updateDate(year, nextMonth, nextDay);
          }}
          className="w-full px-3 py-3 rounded-xl border bg-white border-zinc-200/80 outline-none text-sm text-zinc-950 focus:border-[#34D399]"
          aria-label="Birth month"
        >
          <option value="">Month</option>
          {DATE_MONTHS.map(([monthNumber, monthName]) => (
            <option key={monthNumber} value={monthNumber}>
              {monthName}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={event =>
            updateDate(event.target.value, month, day)
          }
          className="w-full px-3 py-3 rounded-xl border bg-white border-zinc-200/80 outline-none text-sm text-zinc-950 focus:border-[#34D399]"
          aria-label="Birth year"
        >
          <option value="">Year</option>
          {DATE_YEARS.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function FileUploadRow({
  title,
  description,
  file,
  existingUrl,
  onChange,
}: {
  title: string;
  description: string;
  file: File | null;
  existingUrl?: string;
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
          {file ? (
            <p className="text-[10px] font-mono font-bold text-[#10B981] mt-1">
              Ready to upload: {file.name}
            </p>
          ) : existingUrl ? (
            <a
              href={existingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-mono font-bold text-[#10B981] mt-1 inline-flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View uploaded document
            </a>
          ) : (
            <p className="text-[10px] font-mono text-zinc-500 mt-1">
              No document uploaded
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
          onChange={event => {
            const selectedFile = event.target.files?.[0] || null;

            if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
              window.alert('Please choose a file smaller than 10MB.');
              event.target.value = '';
              return;
            }

            onChange(selectedFile);
          }}
        />

        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="px-3 py-2 border border-zinc-200/80 rounded-xl text-[10px] font-mono font-black uppercase text-zinc-700"
          >
            Remove
          </button>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-3 py-2 bg-zinc-950 text-white rounded-xl text-[10px] font-mono font-black uppercase flex items-center gap-1.5"
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
  currentUserEmail,
  workerProfile,
  companyProfile,
  onUpdateWorker,
  onUpdateCompany,
  onOpenInformationCentre,
  onSignOut,
}: SettingsViewProps) {
  const isWorker = userType === 'worker';

  const [installState, setInstallState] = useState<InstallState>(() =>
    typeof window === 'undefined' ? 'loading' : getInstallState()
  );
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() =>
    typeof window === 'undefined'
      ? 'unsupported'
      : getNotificationPermission()
  );
  const [pwaBusy, setPwaBusy] = useState(false);
  const [pwaMessage, setPwaMessage] = useState('');
  const [pushSubscriptionState, setPushSubscriptionState] =
    useState<PushSubscriptionState>('disabled');

  const currentProfileId = workerProfile?.id || companyProfile?.id || '';

  useEffect(() => {
    const refreshPwaState = () => {
      setInstallState(getInstallState());
      setNotificationPermission(getNotificationPermission());
      void getPushSubscriptionState().then(setPushSubscriptionState);
    };

    refreshPwaState();
    return subscribeToPwaChanges(refreshPwaState);
  }, []);

  const handleInstallHireUp = async () => {
    setPwaBusy(true);
    setPwaMessage('');

    try {
      if (installState === 'ios') {
        setPwaMessage(
          'On iPhone: tap Share in Safari, then choose “Add to Home Screen”.'
        );
        return;
      }

      const result = await promptHireUpInstall();

      if (result.outcome === 'accepted') {
        setPwaMessage('HireUp is being installed on this device.');
      } else if (result.outcome === 'dismissed') {
        setPwaMessage('Installation was cancelled. You can try again anytime.');
      } else {
        setPwaMessage(
          'Open HireUp in Chrome, Edge or Safari to install it on this device.'
        );
      }
    } finally {
      setPwaBusy(false);
      setInstallState(getInstallState());
    }
  };

  const handleEnableNotifications = async () => {
    if (!currentProfileId) {
      setPwaMessage('Your signed-in profile could not be identified.');
      return;
    }

    setPwaBusy(true);
    setPwaMessage('');

    try {
      if (pushSubscriptionState === 'enabled') {
        const state = await disableHireUpPushNotifications(currentProfileId);
        setPushSubscriptionState(state);
        setPwaMessage('Push notifications have been disabled on this device.');
        return;
      }

      const state = await enableHireUpPushNotifications(currentProfileId);
      setPushSubscriptionState(state);
      setNotificationPermission(getNotificationPermission());

      if (state === 'enabled') {
        setPwaMessage(
          'Push notifications are enabled and this device is saved to your HireUp account.'
        );
      } else if (state === 'blocked') {
        setPwaMessage(
          'Notifications are blocked. Enable them in your browser or phone settings.'
        );
      } else if (state === 'unsupported') {
        setPwaMessage('This browser does not support web push notifications.');
      }
    } catch (error: any) {
      setPwaMessage(error.message || 'Push notifications could not be enabled.');
    } finally {
      setPwaBusy(false);
    }
  };

  const [accountForm, setAccountForm] = useState<AccountFormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    county: '',
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
    insuranceStatus: 'No insurance',
    about: '',
  });

  const availableTowns =
    accountForm.county === 'East Sussex'
      ? EAST_SUSSEX_TOWNS
      : accountForm.county === 'West Sussex'
      ? WEST_SUSSEX_TOWNS
      : [];

  const existingVerificationUrls = useMemo(() => {
    if (isWorker && workerProfile) {
      return {
        identity: workerProfile.certificateFiles?.[0] || '',
        qualifications: workerProfile.certificateFiles?.[1] || '',
        cscs: workerProfile.licenceImages?.[0] || '',
        insurance: workerProfile.certificateFiles?.[2] || '',
      };
    }

    const documents = companyProfile?.verificationDocuments || [];
    return {
      identity: documents[0] || '',
      qualifications: documents[1] || '',
      cscs: documents[2] || '',
      insurance: documents[3] || '',
    };
  }, [isWorker, workerProfile, companyProfile]);

  const sanitiseFileName = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const uploadSelectedVerificationFiles = async (
    profileId: string
  ): Promise<{
    identity: string;
    qualifications: string;
    cscs: string;
    insurance: string;
  }> => {
    const result = { ...existingVerificationUrls };
    const entries = Object.entries(verificationFiles) as Array<
      [keyof VerificationFiles, File | null]
    >;

    for (const [documentType, file] of entries) {
      if (!file) continue;

      const filePath = `${profileId}/${documentType}/${Date.now()}-${sanitiseFileName(
        file.name
      )}`;

      result[documentType] = await uploadFileToStorage(
        'verification-documents',
        filePath,
        file
      );
    }

    return result;
  };

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
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [deactivated, setDeactivated] = useState(false);

  useEffect(() => {
    const storageKey = `hireup-settings-${workerProfile?.id || companyProfile?.id || 'account'}`;

    let storedSettings: Partial<AccountFormState> = {};
    try {
      const storedValue = window.localStorage.getItem(storageKey);
      storedSettings = storedValue ? JSON.parse(storedValue) : {};
    } catch {
      storedSettings = {};
    }

    if (isWorker && workerProfile) {
      const nameParts = (workerProfile.name || '').trim().split(/\s+/);
      const firstName = nameParts.shift() || '';
      const lastName = nameParts.join(' ');

      setAccountForm(current => ({
        ...current,
        firstName,
        lastName,
        email: workerProfile.email || currentUserEmail || '',
        phone: workerProfile.phone || '',
        county:
          storedSettings.county ||
          getCountyFromTown(workerProfile.location || ''),
        location: workerProfile.location || '',
        dateOfBirth: storedSettings.dateOfBirth || '',
        primaryTrade: workerProfile.trade || '',
        experience: workerProfile.experience || '',
        dayRate: workerProfile.payRate || '',
        availability: workerProfile.availability || 'Available now',
        travelDistance:
          storedSettings.travelDistance ||
          workerProfile.positionLengths?.find(item =>
            item.toLowerCase().includes('mile')
          ) ||
          '25 miles',
        about: workerProfile.about || '',
      }));

      return;
    }

    if (!isWorker && companyProfile) {
      setAccountForm(current => ({
        ...current,
        firstName: companyProfile.contactName?.split(' ')[0] || '',
        lastName:
          companyProfile.contactName?.split(' ').slice(1).join(' ') || '',
        email: companyProfile.contactEmail || currentUserEmail || '',
        phone: companyProfile.contactPhone || companyProfile.phone || '',
        county:
          storedSettings.county ||
          getCountyFromTown(companyProfile.location || ''),
        location: companyProfile.location || '',
        dateOfBirth: storedSettings.dateOfBirth || '',
        companyName: companyProfile.name || '',
        companyNumber: companyProfile.companyHouseNumber || '',
        vatNumber: companyProfile.vatNumber || '',
        website: companyProfile.website || '',
        businessAddress: companyProfile.businessAddress || '',
        insuranceStatus: companyProfile.insuranceStatus || 'No insurance',
        about: companyProfile.description || '',
      }));
    }
  }, [
    isWorker,
    workerProfile,
    companyProfile,
    currentUserEmail,
  ]);

  useEffect(() => {
    const profileId = workerProfile?.id || companyProfile?.id;
    if (!profileId) return;

    let cancelled = false;

    const loadSavedSettings = async () => {
      setSettingsLoading(true);

      try {
        const remoteSettings = await fetchUserSettings(profileId);
        if (!remoteSettings || cancelled) return;

        setAccountForm(current => ({
          ...current,
          county: remoteSettings.county || current.county,
          dateOfBirth:
            remoteSettings.dateOfBirth || current.dateOfBirth,
          travelDistance:
            remoteSettings.travelDistance || current.travelDistance,
        }));

        setMatchNotifications(
          remoteSettings.notifications.matchNotifications
        );
        setMessageNotifications(
          remoteSettings.notifications.messageNotifications
        );
        setInterviewNotifications(
          remoteSettings.notifications.interviewNotifications
        );
        setJobNotifications(
          remoteSettings.notifications.jobNotifications
        );
        setPushNotifications(
          remoteSettings.notifications.pushNotifications
        );
        setSmsNotifications(
          remoteSettings.notifications.smsNotifications
        );
        setWeeklyReports(remoteSettings.notifications.weeklyReports);
        setMarketingEmails(
          remoteSettings.notifications.marketingEmails
        );

        setSecurityForm(current => ({
          ...current,
          twoFactorEnabled:
            remoteSettings.privacy.twoFactorEnabled,
          profileVisibility:
            remoteSettings.privacy.profileVisibility,
          showInSearch: remoteSettings.privacy.showInSearch,
          showOnlineStatus:
            remoteSettings.privacy.showOnlineStatus,
          allowDirectContact:
            remoteSettings.privacy.allowDirectContact,
        }));

        setPreferences(remoteSettings.preferences);
      } catch (error: any) {
        console.warn(
          'Could not load saved account settings:',
          error.message
        );
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    };

    loadSavedSettings();

    return () => {
      cancelled = true;
    };
  }, [workerProfile?.id, companyProfile?.id]);

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

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      if (!accountForm.county) {
        throw new Error('Please select East Sussex or West Sussex.');
      }

      if (!accountForm.location) {
        throw new Error('Please select your town or city.');
      }

      const fullName = `${accountForm.firstName} ${accountForm.lastName}`.trim();
      const profileId = workerProfile?.id || companyProfile?.id;

      if (!profileId) {
        throw new Error('Your account profile could not be loaded.');
      }

      const uploadedDocuments =
        Object.values(verificationFiles).some(Boolean)
          ? await uploadSelectedVerificationFiles(profileId)
          : existingVerificationUrls;

      const storageKey = `hireup-settings-${profileId}`;

      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          county: accountForm.county,
          dateOfBirth: accountForm.dateOfBirth,
          travelDistance: accountForm.travelDistance,
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
          security: {
            profileVisibility: securityForm.profileVisibility,
            showInSearch: securityForm.showInSearch,
            showOnlineStatus: securityForm.showOnlineStatus,
            allowDirectContact: securityForm.allowDirectContact,
            twoFactorEnabled: securityForm.twoFactorEnabled,
          },
          preferences,
        })
      );

      await saveUserSettings({
        userId: profileId,
        accountType: userType,
        county: accountForm.county,
        dateOfBirth: accountForm.dateOfBirth,
        travelDistance: accountForm.travelDistance,
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
        privacy: {
          twoFactorEnabled: securityForm.twoFactorEnabled,
          profileVisibility: securityForm.profileVisibility,
          showInSearch: securityForm.showInSearch,
          showOnlineStatus: securityForm.showOnlineStatus,
          allowDirectContact: securityForm.allowDirectContact,
        },
        preferences,
      });

      if (isWorker) {
        if (!workerProfile) {
          throw new Error('Your worker profile could not be loaded.');
        }

        const existingPreferences = workerProfile.positionLengths || [];
        const withoutDistance = existingPreferences.filter(
          item => !item.toLowerCase().includes('mile')
        );

        await onUpdateWorker({
          ...workerProfile,
          name: fullName || workerProfile.name,
          email: accountForm.email || currentUserEmail,
          phone: accountForm.phone,
          location: accountForm.location,
          trade: accountForm.primaryTrade,
          experience: accountForm.experience,
          payRate: accountForm.dayRate,
          availability: accountForm.availability,
          about: accountForm.about,
          positionLengths: accountForm.travelDistance
            ? [...withoutDistance, accountForm.travelDistance]
            : withoutDistance,
          certificateFiles: [
            uploadedDocuments.identity,
            uploadedDocuments.qualifications,
            uploadedDocuments.insurance,
          ].filter(Boolean),
          licenceImages: uploadedDocuments.cscs
            ? [uploadedDocuments.cscs]
            : workerProfile.licenceImages || [],
        });
      } else {
        if (!companyProfile) {
          throw new Error('Your contractor profile could not be loaded.');
        }

        await onUpdateCompany({
          ...companyProfile,
          name: accountForm.companyName || companyProfile.name,
          description: accountForm.about,
          location: accountForm.location,
          website: accountForm.website,
          companyHouseNumber: accountForm.companyNumber,
          vatNumber: accountForm.vatNumber,
          phone: accountForm.phone,
          businessAddress: accountForm.businessAddress,
          insuranceStatus: accountForm.insuranceStatus,
          contactName: fullName,
          contactPhone: accountForm.phone,
          contactEmail: accountForm.email || currentUserEmail,
          verificationDocuments: [
            uploadedDocuments.identity,
            uploadedDocuments.qualifications,
            uploadedDocuments.cscs,
            uploadedDocuments.insurance,
          ].filter(Boolean),
        });
      }

      setVerificationFiles({
        identity: null,
        qualifications: null,
        cscs: null,
        insurance: null,
      });
      setSavedSuccess(true);
      setSaveMessage(
        Object.values(verificationFiles).some(Boolean)
          ? 'Your account, preferences and verification documents have been saved to Supabase.'
          : 'Your account and preferences have been saved to Supabase.'
      );
      window.setTimeout(() => setSavedSuccess(false), 2200);
    } catch (error: any) {
      setSaveMessage(error.message || 'Settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordMessage('');

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

    if (!currentUserEmail) {
      setPasswordMessage('Your account email could not be resolved.');
      return;
    }

    setPasswordSaving(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUserEmail,
        password: securityForm.currentPassword,
      });

      if (signInError) {
        throw new Error('Your current password is incorrect.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: securityForm.newPassword,
      });

      if (updateError) throw updateError;

      setPasswordMessage('Password updated successfully.');
      setSecurityForm(current => ({
        ...current,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      setPasswordMessage(error.message || 'Password could not be updated.');
    } finally {
      setPasswordSaving(false);
    }
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
          disabled={saving || settingsLoading}
          className="px-5 py-3 bg-[#34D399] hover:bg-[#10B981] disabled:opacity-60 disabled:cursor-not-allowed text-black rounded-xl text-xs font-mono font-black uppercase transition-all duration-200 ease-out shadow-md flex items-center justify-center gap-2"
        >
          {saving ? (
            'Saving...'
          ) : settingsLoading ? (
            'Loading settings...'
          ) : savedSuccess ? (
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

      {saveMessage && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${
          savedSuccess
            ? 'bg-emerald-50 border-emerald-200 text-black'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {saveMessage}
        </div>
      )}

      <section className="bg-white text-zinc-950 border border-zinc-200/80 rounded-2xl overflow-hidden shadow-md">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="p-6 xl:p-7 border-b xl:border-b-0 xl:border-r border-zinc-200/80">
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
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4">
                <p className="text-[9px] font-mono uppercase text-zinc-700">
                  HireUp ID
                </p>
                <p className="text-sm font-black text-zinc-950 mt-1">{accountId}</p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4">
                <p className="text-[9px] font-mono uppercase text-zinc-700">
                  Member since
                </p>
                <p className="text-sm font-black text-zinc-950 mt-1">
                  August 2026
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4">
                <p className="text-[9px] font-mono uppercase text-zinc-700">
                  Profile visibility
                </p>
                <p className="text-sm font-black text-[#10B981] mt-1 capitalize">
                  {securityForm.profileVisibility}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
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
                  className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4"
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
          <section className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-md">
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
                <SelectField
                  label="County"
                  value={accountForm.county}
                  onChange={value => {
                    updateAccountField('county', value);
                    updateAccountField('location', '');
                  }}
                  icon={<MapPin className="w-4 h-4" />}
                >
                  <option value="">Select county</option>
                  {LOCATION_COUNTIES.map(county => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  label="Town or city"
                  value={accountForm.location}
                  onChange={value => updateAccountField('location', value)}
                  icon={<MapPin className="w-4 h-4" />}
                >
                  <option value="">
                    {accountForm.county
                      ? 'Select town or city'
                      : 'Select county first'}
                  </option>
                  {availableTowns.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </SelectField>

                <DateOfBirthField
                  value={accountForm.dateOfBirth}
                  onChange={value =>
                    updateAccountField('dateOfBirth', value)
                  }
                />
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100">
                <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
                  {isWorker ? 'Work details' : 'Business details'}
                </p>

                {isWorker ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <SelectField
                      label="Primary trade"
                      value={accountForm.primaryTrade}
                      onChange={value =>
                        updateAccountField('primaryTrade', value)
                      }
                      icon={<Wrench className="w-4 h-4" />}
                    >
                      <option value="">Select primary trade</option>
                      {PRIMARY_TRADES.map(trade => (
                        <option key={trade} value={trade}>
                          {trade}
                        </option>
                      ))}
                    </SelectField>

                    <SelectField
                      label="Experience"
                      value={accountForm.experience}
                      onChange={value =>
                        updateAccountField('experience', value)
                      }
                      icon={<CalendarDays className="w-4 h-4" />}
                    >
                      <option value="">Select experience</option>
                      {EXPERIENCE_OPTIONS.map(experience => (
                        <option key={experience} value={experience}>
                          {experience}
                        </option>
                      ))}
                    </SelectField>

                    <SelectField
                      label="Day rate"
                      value={accountForm.dayRate}
                      onChange={value =>
                        updateAccountField('dayRate', value)
                      }
                      icon={<Briefcase className="w-4 h-4" />}
                    >
                      <option value="">Select expected day rate</option>
                      {DAY_RATE_OPTIONS.map(rate => (
                        <option key={rate} value={rate}>
                          {rate}
                        </option>
                      ))}
                    </SelectField>

                    <SelectField
                      label="Availability"
                      value={accountForm.availability}
                      onChange={value =>
                        updateAccountField('availability', value)
                      }
                      icon={<CalendarCheck className="w-4 h-4" />}
                    >
                      {AVAILABILITY_OPTIONS.map(availability => (
                        <option key={availability} value={availability}>
                          {availability}
                        </option>
                      ))}
                    </SelectField>

                    <SelectField
                      label="Travel distance"
                      value={accountForm.travelDistance}
                      onChange={value =>
                        updateAccountField('travelDistance', value)
                      }
                      icon={<MapPin className="w-4 h-4" />}
                    >
                      {TRAVEL_DISTANCE_OPTIONS.map(distance => (
                        <option key={distance} value={distance}>
                          {distance}
                        </option>
                      ))}
                    </SelectField>
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
                    <SelectField
                      label="Public liability insurance"
                      value={accountForm.insuranceStatus}
                      onChange={value =>
                        updateAccountField('insuranceStatus', value)
                      }
                      icon={<Scale className="w-4 h-4" />}
                    >
                      <option value="No insurance">No insurance</option>
                      {Array.from({ length: 10 }, (_, index) => index + 1).map(
                        amount => (
                          <option
                            key={amount}
                            value={`£${amount}M Public Liability`}
                          >
                            £{amount}M Public Liability
                          </option>
                        )
                      )}
                    </SelectField>
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
                    className="w-full px-3.5 py-3 rounded-xl border border-zinc-200/80 outline-none text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-md">
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

          <section className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-md">
            <div className="p-5 border-b border-zinc-100">
              <p className="text-xs font-mono font-black uppercase tracking-wider text-zinc-800">
                Verification documents
              </p>
              <h3 className="text-lg font-black text-zinc-950 mt-1">
                Upload verification files
              </h3>
              <p className="text-xs text-zinc-700 mt-1">
                Select your documents, then press Save Changes. Files are securely
                uploaded to Supabase Storage and remain available after refresh.
              </p>
            </div>

            <div className="px-5 divide-y divide-zinc-100">
              <FileUploadRow
                title="Identity document"
                description="Passport, driving licence or accepted photo ID."
                file={verificationFiles.identity}
                existingUrl={existingVerificationUrls.identity}
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
                existingUrl={existingVerificationUrls.qualifications}
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
                existingUrl={existingVerificationUrls.cscs}
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
                existingUrl={existingVerificationUrls.insurance}
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
          <section className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-md">
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
                <p className="text-xs text-zinc-800 bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                  {passwordMessage}
                </p>
              )}

              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={passwordSaving}
                className="w-full py-3 bg-zinc-950 disabled:opacity-60 text-white rounded-xl text-xs font-mono font-black uppercase"
              >
                {passwordSaving ? 'Updating password...' : 'Update password'}
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

          <section className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-md">
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

          <section className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-md">
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

          <section className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-md">
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

          <section className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-md">
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


      <section className="bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-md">
        <div className="p-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#10B981]" />
            <p className="text-xs font-mono font-black uppercase tracking-wider text-[#10B981]">
              HireUp mobile app
            </p>
          </div>

          <h3 className="text-lg font-black text-zinc-950 mt-2">
            Install HireUp on this phone
          </h3>

          <p className="text-xs text-zinc-700 mt-1 max-w-3xl">
            Add HireUp to your home screen and open it like a normal mobile
            app. Installation is free for workers and contractors.
          </p>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-white border border-zinc-200/80 text-[#10B981] flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-zinc-950">
                  {installState === 'installed'
                    ? 'HireUp is installed'
                    : installState === 'ready'
                    ? 'Ready to install'
                    : installState === 'ios'
                    ? 'Install on iPhone or iPad'
                    : 'Install HireUp'}
                </p>

                <p className="text-xs text-zinc-700 mt-1">
                  {installState === 'installed'
                    ? 'You are already using the installed HireUp app.'
                    : installState === 'ios'
                    ? 'Use Safari, tap Share, then select Add to Home Screen.'
                    : 'Get a full-screen HireUp icon on your phone or computer.'}
                </p>

                <button
                  type="button"
                  onClick={handleInstallHireUp}
                  disabled={pwaBusy || installState === 'installed'}
                  className="mt-3 px-4 py-2.5 rounded-xl bg-zinc-950 text-white text-[10px] font-mono font-black uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {installState === 'installed'
                    ? 'Already installed'
                    : installState === 'ios'
                    ? 'Show iPhone steps'
                    : 'Install HireUp app'}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-white border border-zinc-200/80 text-[#10B981] flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-zinc-950">
                  {pushSubscriptionState === 'enabled'
                    ? 'Push notifications enabled'
                    : pushSubscriptionState === 'blocked'
                    ? 'Notifications blocked'
                    : pushSubscriptionState === 'unsupported'
                    ? 'Notifications unsupported'
                    : 'Enable push notifications'}
                </p>

                <p className="text-xs text-zinc-700 mt-1">
                  Receive HireUp alerts for new messages, matches,
                  applications and interview updates.
                </p>

                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={
                    pwaBusy ||
                    pushSubscriptionState === 'unsupported'
                  }
                  className="mt-3 px-4 py-2.5 rounded-xl bg-[#34D399] text-zinc-950 text-[10px] font-mono font-black uppercase disabled:opacity-50 flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {pushSubscriptionState === 'enabled'
                    ? 'Disable on this device'
                    : pushSubscriptionState === 'blocked'
                    ? 'Open device settings'
                    : 'Enable notifications'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {pwaMessage && (
          <div className="mx-5 mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
            {pwaMessage}
          </div>
        )}
      </section>

      <section className="bg-white border border-red-200 rounded-2xl overflow-hidden shadow-md">
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

      <section className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-md">
        <div className="p-5 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#10B981]" />
            <p className="text-xs font-mono font-black uppercase tracking-wider text-[#10B981]">
              Information Centre
            </p>
          </div>

          <h3 className="text-lg font-black text-zinc-950 mt-2">
            Legal, company and support information
          </h3>

          <p className="text-xs text-zinc-700 mt-1 max-w-3xl">
            Access HireUp policies, terms, community standards, frequently
            asked questions, contact information and help guidance.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenInformationCentre}
          className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-zinc-50 transition-all duration-200 ease-out"
        >
          <span className="flex items-center gap-4 min-w-0">
            <span className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-[#10B981] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </span>

            <span className="min-w-0">
              <span className="block text-sm font-black text-zinc-950">
                Open the HireUp Information Centre
              </span>
              <span className="block text-xs text-zinc-700 mt-1">
                Privacy Policy, Terms & Conditions, Cookie Policy, Acceptable
                Use, Community Guidelines, About, FAQ, Contact and Help.
              </span>
            </span>
          </span>

          <ChevronRight className="w-5 h-5 text-zinc-500 flex-shrink-0" />
        </button>
      </section>
    </div>
  );
}