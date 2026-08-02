import React, { useMemo, useState } from 'react';
import {
  Users,
  Wrench,
  Building2,
  Briefcase,
  Heart,
  MessageSquare,
  Calendar,
  Star,
  AlertTriangle,
  BadgeCheck,
  Ban,
  RefreshCw,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Search,
  LayoutDashboard,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  RotateCcw,
  Filter,
} from 'lucide-react';
import {
  AdminAccountStatus,
  AdminDashboardStats,
  AdminManagedUser,
  AdminManagedUserType,
  AdminUser,
  AdminVerificationStatus,
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

type AdminSection = 'overview' | 'users';

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

  const cards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: 'Workers and contractors',
      action: () => {
        setSection('users');
        setTypeFilter('all');
      },
    },
    {
      label: 'Workers',
      value: stats?.workers ?? 0,
      icon: Wrench,
      description: 'Registered trade profiles',
      action: () => {
        setSection('users');
        setTypeFilter('worker');
      },
    },
    {
      label: 'Contractors',
      value: stats?.contractors ?? 0,
      icon: Building2,
      description: 'Registered companies',
      action: () => {
        setSection('users');
        setTypeFilter('contractor');
      },
    },
    {
      label: 'Live Jobs',
      value: stats?.liveJobs ?? 0,
      icon: Briefcase,
      description: 'Published vacancies',
    },
    {
      label: 'Matches',
      value: stats?.matches ?? 0,
      icon: Heart,
      description: 'Active recruitment links',
    },
    {
      label: 'Messages',
      value: stats?.messages ?? 0,
      icon: MessageSquare,
      description: 'Platform chat messages',
    },
    {
      label: 'Interviews',
      value: stats?.interviews ?? 0,
      icon: Calendar,
      description: 'Booked walkthroughs',
    },
    {
      label: 'Reviews',
      value: stats?.reviews ?? 0,
      icon: Star,
      description: 'Submitted reputation reviews',
    },
  ];

  const actionCards = [
    {
      label: 'Reported Reviews',
      value: stats?.reportedReviews ?? 0,
      icon: AlertTriangle,
      description: 'Awaiting moderation',
    },
    {
      label: 'Worker Verifications',
      value: stats?.pendingWorkerVerifications ?? 0,
      icon: BadgeCheck,
      description: 'Pending worker decisions',
      action: () => {
        setSection('users');
        setTypeFilter('worker');
        setVerificationFilter('pending');
      },
    },
    {
      label: 'Contractor Verifications',
      value: stats?.pendingContractorVerifications ?? 0,
      icon: ShieldCheck,
      description: 'Pending company decisions',
      action: () => {
        setSection('users');
        setTypeFilter('contractor');
        setVerificationFilter('pending');
      },
    },
    {
      label: 'Suspended Accounts',
      value:
        (stats?.suspendedWorkers ?? 0) +
        (stats?.suspendedContractors ?? 0),
      icon: Ban,
      description: 'Workers and contractors',
      action: () => {
        setSection('users');
        setTypeFilter('all');
        setStatusFilter('suspended');
      },
    },
  ];

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

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setVerificationFilter('all');
  };

  const confirmAccountStatus = async (
    user: AdminManagedUser,
    status: AdminAccountStatus
  ) => {
    const labels: Record<AdminAccountStatus, string> = {
      active: 'reactivate',
      suspended: 'suspend',
      banned: 'ban',
    };

    const confirmed = window.confirm(
      `Are you sure you want to ${labels[status]} ${user.name}?`
    );

    if (!confirmed) return;

    setOpenActionsId(null);
    await onUpdateAccountStatus(user.id, user.type, status);
  };

  const confirmVerification = async (
    user: AdminManagedUser,
    status: AdminVerificationStatus
  ) => {
    const labels: Record<AdminVerificationStatus, string> = {
      pending: 'return to pending',
      verified: 'verify',
      rejected: 'reject verification for',
    };

    const confirmed = window.confirm(
      `Are you sure you want to ${labels[status]} ${user.name}?`
    );

    if (!confirmed) return;

    setOpenActionsId(null);
    await onUpdateVerificationStatus(user.id, user.type, status);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-[#34D399] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black tracking-tight">
                HireUp Admin
              </h1>
              <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                {admin.role.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-2 bg-white border border-zinc-200 hover:border-[#34D399] rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-2 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-5">
        <nav className="inline-flex p-1 bg-white border border-zinc-200 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setSection('overview')}
            className={`px-4 py-2 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-2 cursor-pointer ${
              section === 'overview'
                ? 'bg-zinc-950 text-white'
                : 'text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Overview
          </button>
          <button
            type="button"
            onClick={() => setSection('users')}
            className={`px-4 py-2 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-2 cursor-pointer ${
              section === 'users'
                ? 'bg-[#34D399] text-white'
                : 'text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users
          </button>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <strong>Admin dashboard error:</strong> {error}
          </div>
        )}

        {section === 'overview' ? (
          <>
            <section className="bg-zinc-950 text-white rounded-3xl p-6 md:p-9 overflow-hidden relative">
              <div className="absolute right-0 top-0 w-64 h-64 bg-[#34D399]/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
              <div className="relative max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] rounded-full text-[10px] font-mono font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Administration Console
                </span>
                <h2 className="text-2xl md:text-4xl font-black mt-4 tracking-tight">
                  Platform control centre
                </h2>
                <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
                  Review HireUp activity, monitor moderation queues, and manage
                  verification and account safety from one secure dashboard.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    Platform Overview
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Live totals from the connected Supabase project
                  </p>
                </div>
                {loading && (
                  <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase">
                    Updating…
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {cards.map(card => {
                  const Icon = card.icon;
                  const interactive = Boolean(card.action);

                  return (
                    <button
                      key={card.label}
                      type="button"
                      onClick={card.action}
                      disabled={!interactive}
                      className={`bg-white border border-zinc-200 rounded-2xl p-4 md:p-5 shadow-xs text-left ${
                        interactive
                          ? 'hover:border-[#34D399] hover:shadow-sm cursor-pointer'
                          : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        {interactive && (
                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        )}
                      </div>
                      <p className="text-2xl md:text-3xl font-black mt-4">
                        {loading && !stats
                          ? '—'
                          : card.value.toLocaleString('en-GB')}
                      </p>
                      <p className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-wider mt-1">
                        {card.label}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {card.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Action Required
                </h3>
                <p className="text-xs text-zinc-500">
                  Open verification and account-management queues
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {actionCards.map(card => {
                  const Icon = card.icon;
                  const needsAttention = card.value > 0;

                  return (
                    <button
                      key={card.label}
                      type="button"
                      onClick={card.action}
                      disabled={!card.action}
                      className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-2xl p-5 text-left transition-all group cursor-pointer disabled:cursor-default"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            needsAttention
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-zinc-100 text-zinc-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        {card.action && (
                          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#10B981]" />
                        )}
                      </div>
                      <p className="text-2xl font-black mt-4">
                        {loading && !stats
                          ? '—'
                          : card.value.toLocaleString('en-GB')}
                      </p>
                      <p className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-wider mt-1">
                        {card.label}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {card.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  User Management
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Search, verify, suspend, reactivate, or ban HireUp accounts.
                </p>
              </div>

              <div className="text-xs text-zinc-500">
                Showing <strong>{filteredUsers.length}</strong> of{' '}
                <strong>{users.length}</strong> users
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, trade, industry, or location..."
                  className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-[#34D399]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                    Account type
                  </span>
                  <select
                    value={typeFilter}
                    onChange={event =>
                      setTypeFilter(
                        event.target.value as 'all' | AdminManagedUserType
                      )
                    }
                    className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="all">All users</option>
                    <option value="worker">Workers</option>
                    <option value="contractor">Contractors</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                    Account status
                  </span>
                  <select
                    value={statusFilter}
                    onChange={event =>
                      setStatusFilter(
                        event.target.value as 'all' | AdminAccountStatus
                      )
                    }
                    className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                    Verification
                  </span>
                  <select
                    value={verificationFilter}
                    onChange={event =>
                      setVerificationFilter(
                        event.target.value as
                          | 'all'
                          | AdminVerificationStatus
                      )
                    }
                    className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="all">All verification</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black text-zinc-500 hover:text-[#10B981] uppercase cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                Clear filters
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl overflow-visible">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-9 h-9 text-zinc-300 mx-auto" />
                  <p className="text-sm font-bold mt-3">No users found</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Try changing the search or filters.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {filteredUsers.map(user => {
                    const isActionLoading = actionLoadingId === user.id;

                    return (
                      <div
                        key={`${user.type}-${user.id}`}
                        className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center flex-shrink-0">
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-black truncate">
                                {user.name}
                              </p>
                              <span className="px-2 py-0.5 bg-zinc-100 rounded text-[8px] font-mono font-black uppercase">
                                {user.type}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 truncate">
                              {user.email || 'No email stored'}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                              {user.tradeOrIndustry}
                              {user.location ? ` · ${user.location}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase ${
                              user.verificationStatus === 'verified'
                                ? 'bg-emerald-50 text-emerald-700'
                                : user.verificationStatus === 'rejected'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {user.verificationStatus}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase ${
                              user.accountStatus === 'active'
                                ? 'bg-blue-50 text-blue-700'
                                : user.accountStatus === 'suspended'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {user.accountStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 lg:justify-end relative">
                          {user.verificationStatus !== 'verified' && (
                            <button
                              type="button"
                              onClick={() =>
                                confirmVerification(user, 'verified')
                              }
                              disabled={isActionLoading}
                              className="px-3 py-2 bg-[#34D399] hover:bg-[#10B981] text-white rounded-lg text-[9px] font-mono font-black uppercase flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Verify
                            </button>
                          )}

                          {user.accountStatus !== 'active' && (
                            <button
                              type="button"
                              onClick={() =>
                                confirmAccountStatus(user, 'active')
                              }
                              disabled={isActionLoading}
                              className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-[9px] font-mono font-black uppercase flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reactivate
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setOpenActionsId(
                                openActionsId === user.id ? null : user.id
                              )
                            }
                            disabled={isActionLoading}
                            className="p-2 border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 disabled:opacity-50 cursor-pointer"
                          >
                            {isActionLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="w-4 h-4" />
                            )}
                          </button>

                          {openActionsId === user.id && (
                            <div className="absolute right-0 top-11 z-50 w-52 bg-white border border-zinc-200 rounded-xl shadow-xl p-2">
                              {user.verificationStatus !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    confirmVerification(user, 'rejected')
                                  }
                                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-red-50 text-[10px] font-mono font-bold text-red-600 flex items-center gap-2 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject verification
                                </button>
                              )}

                              {user.verificationStatus !== 'pending' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    confirmVerification(user, 'pending')
                                  }
                                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-zinc-50 text-[10px] font-mono font-bold text-zinc-600 flex items-center gap-2 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Return to pending
                                </button>
                              )}

                              {user.accountStatus === 'active' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    confirmAccountStatus(user, 'suspended')
                                  }
                                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-amber-50 text-[10px] font-mono font-bold text-amber-700 flex items-center gap-2 cursor-pointer"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  Suspend account
                                </button>
                              )}

                              {user.accountStatus !== 'banned' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    confirmAccountStatus(user, 'banned')
                                  }
                                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-red-50 text-[10px] font-mono font-bold text-red-700 flex items-center gap-2 cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Ban account
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}