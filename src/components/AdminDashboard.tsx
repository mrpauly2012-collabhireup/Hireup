import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  FileWarning,
  Filter,
  Heart,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  Users,
  UserX,
  Wrench,
  XCircle,
  X,
  Mail,
  MapPin,
  CalendarDays,
  BadgeInfo,
  ExternalLink,
} from 'lucide-react';
import {
  AdminAccountStatus,
  AdminAnalyticsPoint,
  AdminAuditLog,
  AdminDashboardStats,
  AdminJob,
  AdminJobStatus,
  AdminManagedUser,
  AdminManagedUserType,
  AdminReport,
  AdminReportStatus,
  AdminReview,
  AdminUser,
  AdminVerificationStatus,
  deleteAdminJob,
  fetchAdminAnalytics,
  fetchAdminAuditLogs,
  fetchAdminJobs,
  fetchAdminReports,
  fetchAdminReviews,
  updateAdminJob,
  updateAdminReport,
  updateAdminReview,
} from '../lib/supabase';

interface AdminDashboardProps {
  admin: AdminUser;
  stats: AdminDashboardStats | null;
  users: AdminManagedUser[];
  loading: boolean;
  actionLoadingId: string | null;
  error: string | null;
  onRefresh: () => void;
  onSignOut: () => void;
  onUpdateAccountStatus: (
    userId: string,
    userType: AdminManagedUserType,
    status: AdminAccountStatus
  ) => Promise<void>;
  onUpdateVerificationStatus: (
    userId: string,
    userType: AdminManagedUserType,
    status: AdminVerificationStatus
  ) => Promise<void>;
}

type AdminSection =
  | 'overview'
  | 'users'
  | 'jobs'
  | 'reviews'
  | 'reports'
  | 'analytics'
  | 'audit';

const sectionLabels: Record<AdminSection, string> = {
  overview: 'Overview',
  users: 'Users',
  jobs: 'Jobs',
  reviews: 'Reviews',
  reports: 'Reports',
  analytics: 'Analytics',
  audit: 'Audit Log',
};

const sectionIcons: Record<AdminSection, React.ElementType> = {
  overview: LayoutDashboard,
  users: Users,
  jobs: Briefcase,
  reviews: Star,
  reports: FileWarning,
  analytics: BarChart3,
  audit: ListChecks,
};

function formatDate(value: string): string {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusClass(value: string): string {
  if (['verified', 'active', 'live', 'resolved', 'approved'].includes(value)) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (['pending', 'reviewing', 'suspended', 'closed'].includes(value)) {
    return 'bg-amber-50 text-amber-700';
  }

  if (['rejected', 'banned', 'removed', 'open'].includes(value)) {
    return 'bg-red-50 text-red-700';
  }

  return 'bg-zinc-100 text-zinc-600';
}

export default function AdminDashboard({
  admin,
  stats,
  users,
  loading,
  actionLoadingId,
  error,
  onRefresh,
  onSignOut,
  onUpdateAccountStatus,
  onUpdateVerificationStatus,
}: AdminDashboardProps) {
  const [section, setSection] = useState<AdminSection>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AdminManagedUserType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminAccountStatus>('all');
  const [verificationFilter, setVerificationFilter] = useState<
    'all' | AdminVerificationStatus
  >('all');
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminManagedUser | null>(null);

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalyticsPoint[]>([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [localActionId, setLocalActionId] = useState<string | null>(null);

  const loadManagementData = async () => {
    setSectionLoading(true);
    setSectionError(null);

    try {
      const [jobRows, reviewRows, reportRows, auditRows, analyticsRows] =
        await Promise.all([
          fetchAdminJobs(),
          fetchAdminReviews(),
          fetchAdminReports(),
          fetchAdminAuditLogs(),
          fetchAdminAnalytics(14),
        ]);

      setJobs(jobRows);
      setReviews(reviewRows);
      setReports(reportRows);
      setAuditLogs(auditRows);
      setAnalytics(analyticsRows);
    } catch (loadError: any) {
      setSectionError(loadError.message || String(loadError));
    } finally {
      setSectionLoading(false);
    }
  };

  useEffect(() => {
    loadManagementData();
  }, []);

  const refreshEverything = async () => {
    await Promise.all([Promise.resolve(onRefresh()), loadManagementData()]);
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter(user => {
      if (typeFilter !== 'all' && user.type !== typeFilter) return false;
      if (statusFilter !== 'all' && user.accountStatus !== statusFilter) return false;
      if (
        verificationFilter !== 'all' &&
        user.verificationStatus !== verificationFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        user.name,
        user.email,
        user.location,
        user.tradeOrIndustry,
      ].some(value => value.toLowerCase().includes(query));
    });
  }, [users, searchQuery, typeFilter, statusFilter, verificationFilter]);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter(job =>
      [job.title, job.companyName, job.trade, job.location, job.payRate].some(
        value => value.toLowerCase().includes(query)
      )
    );
  }, [jobs, searchQuery]);

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return reviews;

    return reviews.filter(review =>
      [
        review.reviewerName,
        review.reviewerRole,
        review.reviewText,
        review.reportReason,
      ].some(value => value.toLowerCase().includes(query))
    );
  }, [reviews, searchQuery]);

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return reports;

    return reports.filter(report =>
      [
        report.targetType,
        report.reason,
        report.details,
        report.status,
      ].some(value => value.toLowerCase().includes(query))
    );
  }, [reports, searchQuery]);

  const filteredAudit = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return auditLogs;

    return auditLogs.filter(log =>
      [log.action, log.targetType, log.targetId, log.adminUserId].some(value =>
        value.toLowerCase().includes(query)
      )
    );
  }, [auditLogs, searchQuery]);

  const runLocalAction = async (
    id: string,
    action: () => Promise<void>
  ) => {
    setLocalActionId(id);
    setSectionError(null);

    try {
      await action();
      await refreshEverything();
    } catch (actionError: any) {
      setSectionError(actionError.message || String(actionError));
    } finally {
      setLocalActionId(null);
    }
  };

  const confirmAction = (message: string): boolean => window.confirm(message);

  const openUsersQueue = (
    accountType: 'all' | AdminManagedUserType = 'all',
    verification: 'all' | AdminVerificationStatus = 'all',
    accountStatus: 'all' | AdminAccountStatus = 'all'
  ) => {
    setSection('users');
    setTypeFilter(accountType);
    setVerificationFilter(verification);
    setStatusFilter(accountStatus);
    setSearchQuery('');
  };

  const overviewCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      action: () => openUsersQueue(),
    },
    {
      label: 'Workers',
      value: stats?.workers ?? 0,
      icon: Wrench,
      action: () => openUsersQueue('worker'),
    },
    {
      label: 'Contractors',
      value: stats?.contractors ?? 0,
      icon: Building2,
      action: () => openUsersQueue('contractor'),
    },
    {
      label: 'Live Jobs',
      value: stats?.liveJobs ?? 0,
      icon: Briefcase,
      action: () => setSection('jobs'),
    },
    {
      label: 'Matches',
      value: stats?.matches ?? 0,
      icon: Heart,
    },
    {
      label: 'Messages',
      value: stats?.messages ?? 0,
      icon: MessageSquare,
    },
    {
      label: 'Interviews',
      value: stats?.interviews ?? 0,
      icon: Calendar,
    },
    {
      label: 'Reviews',
      value: stats?.reviews ?? 0,
      icon: Star,
      action: () => setSection('reviews'),
    },
  ];

  const actionCards = [
    {
      label: 'Reported Reviews',
      value: stats?.reportedReviews ?? 0,
      icon: AlertTriangle,
      action: () => setSection('reviews'),
    },
    {
      label: 'Worker Verifications',
      value: stats?.pendingWorkerVerifications ?? 0,
      icon: BadgeCheck,
      action: () => openUsersQueue('worker', 'pending'),
    },
    {
      label: 'Contractor Verifications',
      value: stats?.pendingContractorVerifications ?? 0,
      icon: ShieldCheck,
      action: () => openUsersQueue('contractor', 'pending'),
    },
    {
      label: 'Suspended Accounts',
      value:
        (stats?.suspendedWorkers ?? 0) +
        (stats?.suspendedContractors ?? 0),
      icon: Ban,
      action: () => openUsersQueue('all', 'all', 'suspended'),
    },
  ];

  const maxAnalyticsValue = Math.max(
    1,
    ...analytics.flatMap(point => [
      point.users,
      point.jobs,
      point.matches,
      point.messages,
      point.interviews,
      point.reviews,
    ])
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-[#34D399] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black">HireUp Admin</h1>
              <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                {admin.role.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshEverything}
              disabled={loading || sectionLoading}
              className="px-3 py-2 border border-zinc-200 hover:border-[#34D399] rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loading || sectionLoading ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-2 bg-red-50 border border-red-100 text-red-600 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-5">
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(sectionLabels) as AdminSection[]).map(item => {
            const Icon = sectionIcons[item];
            const active = item === section;

            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSection(item);
                  setSearchQuery('');
                }}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'bg-zinc-950 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-500 hover:border-[#34D399]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sectionLabels[item]}
              </button>
            );
          })}
        </nav>
      </div>

      <main className="max-w-[1500px] mx-auto px-4 md:px-8 pb-10 space-y-6">
        {(error || sectionError) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <strong>Admin dashboard error:</strong> {error || sectionError}
          </div>
        )}

        {section !== 'overview' && section !== 'analytics' && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder={`Search ${sectionLabels[section].toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-[#34D399]"
            />
          </div>
        )}

        {section === 'overview' && (
          <>
            <section className="bg-zinc-950 text-white rounded-3xl p-6 md:p-9 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-72 h-72 bg-[#34D399]/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
              <div className="relative max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] rounded-full text-[10px] font-mono font-black uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Administration Console
                </span>
                <h2 className="text-2xl md:text-4xl font-black mt-4">
                  Platform control centre
                </h2>
                <p className="text-sm text-zinc-400 mt-3">
                  Manage users, jobs, reviews, reports, analytics and every
                  administrative action from one console.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-black uppercase mb-4">
                Platform Overview
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {overviewCards.map(card => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.label}
                      type="button"
                      onClick={card.action}
                      disabled={!card.action}
                      className="bg-white border border-zinc-200 rounded-2xl p-5 text-left hover:border-[#34D399] disabled:cursor-default"
                    >
                      <div className="flex justify-between">
                        <span className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </span>
                        {card.action && (
                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        )}
                      </div>
                      <p className="text-3xl font-black mt-4">
                        {card.value.toLocaleString('en-GB')}
                      </p>
                      <p className="text-[10px] font-mono font-black uppercase text-zinc-600">
                        {card.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-black uppercase mb-4">
                Action Required
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {actionCards.map(card => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.label}
                      type="button"
                      onClick={card.action}
                      className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-2xl p-5 text-left"
                    >
                      <div className="flex justify-between">
                        <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-300" />
                      </div>
                      <p className="text-2xl font-black mt-4">{card.value}</p>
                      <p className="text-[10px] font-mono font-black uppercase">
                        {card.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {section === 'users' && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={typeFilter}
                onChange={event =>
                  setTypeFilter(event.target.value as 'all' | AdminManagedUserType)
                }
                className="p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
              >
                <option value="all">All account types</option>
                <option value="worker">Workers</option>
                <option value="contractor">Contractors</option>
              </select>
              <select
                value={statusFilter}
                onChange={event =>
                  setStatusFilter(event.target.value as 'all' | AdminAccountStatus)
                }
                className="p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
              >
                <option value="all">All account statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
              <select
                value={verificationFilter}
                onChange={event =>
                  setVerificationFilter(
                    event.target.value as 'all' | AdminVerificationStatus
                  )
                }
                className="p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
              >
                <option value="all">All verification</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl divide-y divide-zinc-100">
              {filteredUsers.map(user => (
                <div
                  key={`${user.type}-${user.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedUser(user)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setSelectedUser(user);
                    }
                  }}
                  className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : user.type === 'worker' ? (
                        <Wrench className="w-5 h-5 text-zinc-400" />
                      ) : (
                        <Building2 className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">{user.name}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {user.email || 'No email'}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {user.tradeOrIndustry} · {user.location || 'No location'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase ${statusClass(
                        user.verificationStatus
                      )}`}
                    >
                      {user.verificationStatus}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase ${statusClass(
                        user.accountStatus
                      )}`}
                    >
                      {user.accountStatus}
                    </span>
                  </div>

                  <div className="flex gap-2 relative">
                    {user.verificationStatus !== 'verified' && (
                      <button
                        type="button"
                        disabled={actionLoadingId === user.id}
                        onClick={event => {
                          event.stopPropagation();
                          onUpdateVerificationStatus(user.id, user.type, 'verified');
                        }}
                        className="px-3 py-2 bg-[#34D399] text-white rounded-lg text-[9px] font-mono font-black uppercase"
                      >
                        Verify
                      </button>
                    )}
                    {user.accountStatus !== 'active' && (
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          onUpdateAccountStatus(user.id, user.type, 'active');
                        }}
                        className="px-3 py-2 bg-zinc-950 text-white rounded-lg text-[9px] font-mono font-black uppercase"
                      >
                        Reactivate
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        setOpenActionsId(
                          openActionsId === user.id ? null : user.id
                        );
                      }}
                      className="p-2 border border-zinc-200 rounded-lg"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openActionsId === user.id && (
                      <div className="absolute right-0 top-11 z-30 w-52 bg-white border border-zinc-200 rounded-xl shadow-xl p-2">
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onUpdateVerificationStatus(
                              user.id,
                              user.type,
                              'rejected'
                            );
                          }}
                          className="w-full p-2 text-left text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg flex gap-2"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject verification
                        </button>
                        {user.accountStatus === 'active' && (
                          <button
                            type="button"
                            onClick={event => {
                              event.stopPropagation();
                              onUpdateAccountStatus(
                                user.id,
                                user.type,
                                'suspended'
                              );
                            }}
                            className="w-full p-2 text-left text-[10px] font-bold text-amber-700 hover:bg-amber-50 rounded-lg flex gap-2"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Suspend
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onUpdateAccountStatus(user.id, user.type, 'banned');
                          }}
                          className="w-full p-2 text-left text-[10px] font-bold text-red-700 hover:bg-red-50 rounded-lg flex gap-2"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Ban account
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {section === 'jobs' && (
          <section className="bg-white border border-zinc-200 rounded-2xl divide-y divide-zinc-100">
            {filteredJobs.map(job => (
              <div
                key={job.id}
                className="p-4 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black">{job.title}</p>
                    {job.featured && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[8px] font-black uppercase">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {job.companyName} · {job.trade} · {job.location}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {job.payRate} · {formatDate(job.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase ${statusClass(
                    job.status
                  )}`}
                >
                  {job.status}
                </span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={localActionId === job.id}
                    onClick={() =>
                      runLocalAction(job.id, () =>
                        updateAdminJob(job.id, {
                          featured: !job.featured,
                        })
                      )
                    }
                    className="px-3 py-2 border border-zinc-200 rounded-lg text-[9px] font-mono font-black uppercase"
                  >
                    {job.featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      runLocalAction(job.id, () =>
                        updateAdminJob(job.id, {
                          status: job.status === 'closed' ? 'live' : 'closed',
                        })
                      )
                    }
                    className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-mono font-black uppercase"
                  >
                    {job.status === 'closed' ? 'Reopen' : 'Close'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirmAction(
                          `Permanently delete "${job.title}"? This cannot be undone.`
                        )
                      ) {
                        runLocalAction(job.id, () => deleteAdminJob(job.id));
                      }
                    }}
                    className="p-2 bg-red-50 text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {section === 'reviews' && (
          <section className="space-y-3">
            {filteredReviews.map(review => (
              <article
                key={review.id}
                className={`bg-white border rounded-2xl p-5 ${
                  review.reported ? 'border-amber-300' : 'border-zinc-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex gap-2 items-center flex-wrap">
                      <p className="text-sm font-black">{review.reviewerName}</p>
                      <span className="text-xs text-amber-500">
                        {'★'.repeat(Math.max(0, Math.round(review.rating)))}
                      </span>
                      {review.reported && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[8px] font-black uppercase">
                          Reported
                        </span>
                      )}
                      {review.hidden && (
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[8px] font-black uppercase">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {review.reviewerRole} · {formatDate(review.createdAt)}
                    </p>
                    <p className="text-sm text-zinc-700 mt-3">
                      {review.reviewText}
                    </p>
                    {review.reportReason && (
                      <p className="text-xs text-red-600 mt-3">
                        Report reason: {review.reportReason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap lg:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        runLocalAction(review.id, () =>
                          updateAdminReview(review.id, 'approve')
                        )
                      }
                      className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-mono font-black uppercase"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runLocalAction(review.id, () =>
                          updateAdminReview(
                            review.id,
                            review.hidden ? 'restore' : 'hide'
                          )
                        )
                      }
                      className="px-3 py-2 border border-zinc-200 rounded-lg text-[9px] font-mono font-black uppercase flex gap-1.5"
                    >
                      {review.hidden ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                      {review.hidden ? 'Restore' : 'Hide'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmAction('Permanently delete this review?')) {
                          runLocalAction(review.id, () =>
                            updateAdminReview(review.id, 'delete')
                          );
                        }
                      }}
                      className="p-2 bg-red-50 text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {section === 'reports' && (
          <section className="space-y-3">
            {filteredReports.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="font-black mt-3">No reports found</p>
                <p className="text-xs text-zinc-400 mt-1">
                  New user, job and review reports will appear here.
                </p>
              </div>
            ) : (
              filteredReports.map(report => (
                <article
                  key={report.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-5"
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-black uppercase px-2 py-1 bg-zinc-100 rounded">
                          {report.targetType}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-black uppercase px-2 py-1 rounded ${statusClass(
                            report.status
                          )}`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="font-black mt-3">{report.reason}</p>
                      <p className="text-sm text-zinc-600 mt-1">
                        {report.details || 'No additional details supplied.'}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-3">
                        Target: {report.targetId} · {formatDate(report.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(['reviewing', 'resolved', 'dismissed'] as AdminReportStatus[]).map(
                        nextStatus => (
                          <button
                            key={nextStatus}
                            type="button"
                            onClick={() =>
                              runLocalAction(report.id, () =>
                                updateAdminReport(report.id, nextStatus)
                              )
                            }
                            className="px-3 py-2 border border-zinc-200 rounded-lg text-[9px] font-mono font-black uppercase"
                          >
                            {nextStatus}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {section === 'analytics' && (
          <section className="space-y-5">
            <div>
              <h2 className="text-2xl font-black">Last 14 Days</h2>
              <p className="text-sm text-zinc-500">
                Registrations and core platform activity by day.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-5 overflow-x-auto">
              <div className="min-w-[850px] grid grid-cols-14 gap-3 h-72 items-end">
                {analytics.map(point => {
                  const total =
                    point.users +
                    point.jobs +
                    point.matches +
                    point.messages +
                    point.interviews +
                    point.reviews;
                  const height = Math.max(4, (total / maxAnalyticsValue) * 220);

                  return (
                    <div key={point.date} className="h-full flex flex-col justify-end">
                      <div className="text-[9px] text-center font-bold mb-2">
                        {total}
                      </div>
                      <div
                        className="w-full bg-[#34D399] rounded-t-lg"
                        style={{ height }}
                        title={`${point.date}: ${total} total events`}
                      />
                      <p className="text-[8px] text-zinc-400 text-center mt-2">
                        {point.date.slice(5)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                ['Users', analytics.reduce((sum, p) => sum + p.users, 0)],
                ['Jobs', analytics.reduce((sum, p) => sum + p.jobs, 0)],
                ['Matches', analytics.reduce((sum, p) => sum + p.matches, 0)],
                ['Messages', analytics.reduce((sum, p) => sum + p.messages, 0)],
                ['Interviews', analytics.reduce((sum, p) => sum + p.interviews, 0)],
                ['Reviews', analytics.reduce((sum, p) => sum + p.reviews, 0)],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="bg-white border border-zinc-200 rounded-xl p-4"
                >
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-[9px] font-mono font-black uppercase text-zinc-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {section === 'audit' && (
          <section className="bg-white border border-zinc-200 rounded-2xl divide-y divide-zinc-100">
            {filteredAudit.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="font-black mt-3">No admin actions logged yet</p>
              </div>
            ) : (
              filteredAudit.map(log => (
                <div
                  key={log.id}
                  className="p-4 flex flex-col md:flex-row md:items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <ListChecks className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black">{log.action}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {log.targetType}: {log.targetId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-mono text-zinc-400">
                      {formatDate(log.createdAt)}
                    </p>
                    <p className="text-[9px] text-zinc-400 truncate max-w-48">
                      Admin: {log.adminUserId}
                    </p>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {selectedUser && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close user profile"
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
            />

            <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-zinc-200 overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-mono font-black text-[#10B981] uppercase tracking-wider">
                    Admin Profile View
                  </p>
                  <h3 className="text-lg font-black mt-0.5">
                    {selectedUser.type === 'worker'
                      ? 'Worker Profile'
                      : 'Contractor Profile'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                <section className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {selectedUser.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : selectedUser.type === 'worker' ? (
                      <Wrench className="w-8 h-8 text-zinc-400" />
                    ) : (
                      <Building2 className="w-8 h-8 text-zinc-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xl font-black truncate">
                      {selectedUser.name}
                    </h4>
                    <p className="text-sm text-zinc-500 mt-1">
                      {selectedUser.tradeOrIndustry}
                    </p>

                    <div className="flex gap-2 flex-wrap mt-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase ${statusClass(
                          selectedUser.verificationStatus
                        )}`}
                      >
                        {selectedUser.verificationStatus}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase ${statusClass(
                          selectedUser.accountStatus
                        )}`}
                      >
                        {selectedUser.accountStatus}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-start gap-3">
                    <Mail className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                        Email
                      </p>
                      <p className="text-sm font-bold break-all mt-1">
                        {selectedUser.email || 'No email stored'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                        Location
                      </p>
                      <p className="text-sm font-bold mt-1">
                        {selectedUser.location || 'No location stored'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-start gap-3">
                    <CalendarDays className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                        Joined
                      </p>
                      <p className="text-sm font-bold mt-1">
                        {formatDate(selectedUser.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-start gap-3">
                    <BadgeInfo className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                        Account ID
                      </p>
                      <p className="text-xs font-mono break-all mt-1 text-zinc-600">
                        {selectedUser.id}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h5 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500 mb-3">
                    Verification Actions
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedUser.verificationStatus !== 'verified' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateVerificationStatus(
                            selectedUser.id,
                            selectedUser.type,
                            'verified'
                          );
                          setSelectedUser({
                            ...selectedUser,
                            verificationStatus: 'verified',
                            verified: true,
                          });
                        }}
                        className="px-4 py-3 bg-[#34D399] hover:bg-[#10B981] text-white rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        Verify
                      </button>
                    )}

                    {selectedUser.verificationStatus !== 'rejected' && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirmAction(`Reject verification for ${selectedUser.name}?`)) {
                            return;
                          }

                          await onUpdateVerificationStatus(
                            selectedUser.id,
                            selectedUser.type,
                            'rejected'
                          );

                          setSelectedUser({
                            ...selectedUser,
                            verificationStatus: 'rejected',
                            verified: false,
                          });
                        }}
                        className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                  </div>
                </section>

                <section>
                  <h5 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500 mb-3">
                    Account Controls
                  </h5>

                  <div className="space-y-2">
                    {selectedUser.accountStatus !== 'active' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateAccountStatus(
                            selectedUser.id,
                            selectedUser.type,
                            'active'
                          );

                          setSelectedUser({
                            ...selectedUser,
                            accountStatus: 'active',
                          });
                        }}
                        className="w-full px-4 py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reactivate Account
                      </button>
                    )}

                    {selectedUser.accountStatus === 'active' && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirmAction(`Suspend ${selectedUser.name}?`)) return;

                          await onUpdateAccountStatus(
                            selectedUser.id,
                            selectedUser.type,
                            'suspended'
                          );

                          setSelectedUser({
                            ...selectedUser,
                            accountStatus: 'suspended',
                          });
                        }}
                        className="w-full px-4 py-3 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-2"
                      >
                        <UserX className="w-4 h-4" />
                        Suspend Account
                      </button>
                    )}

                    {selectedUser.accountStatus !== 'banned' && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            !confirmAction(
                              `Ban ${selectedUser.name}? They will remain banned until manually reactivated.`
                            )
                          ) {
                            return;
                          }

                          await onUpdateAccountStatus(
                            selectedUser.id,
                            selectedUser.type,
                            'banned'
                          );

                          setSelectedUser({
                            ...selectedUser,
                            accountStatus: 'banned',
                          });
                        }}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Ban Account
                      </button>
                    )}
                  </div>
                </section>

                <section className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex gap-3">
                    <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-blue-800">
                        Public profile integration
                      </p>
                      <p className="text-[10px] text-blue-700 mt-1 leading-relaxed">
                        The next profile-management step can connect this drawer
                        to the worker or contractor public profile screen and
                        include full qualifications, documents, reviews and
                        activity.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </aside>
          </div>
        )}

        {(loading || sectionLoading) && (
          <div className="fixed bottom-5 right-5 px-4 py-3 bg-zinc-950 text-white rounded-xl shadow-xl text-xs font-bold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#34D399]" />
            Updating admin data…
          </div>
        )}
      </main>
    </div>
  );
}