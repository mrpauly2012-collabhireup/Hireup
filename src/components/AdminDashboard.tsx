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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  Square,
  Download,
  Radio,
  TrendingUp,
  SlidersHorizontal,
  Clock3,
  Activity,
  FileText,
  Building,
  Flag,
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
  supabase,
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


type SortDirection = 'asc' | 'desc';

type SortState = {
  field: string;
  direction: SortDirection;
};


type PaginatedSection = 'users' | 'jobs' | 'reviews' | 'reports' | 'audit';

type PaginationState = {
  page: number;
  pageSize: number;
};


type AnalyticsMetric =
  | 'users'
  | 'jobs'
  | 'matches'
  | 'messages'
  | 'interviews'
  | 'reviews';


type DetailTarget =
  | { type: 'job'; item: AdminJob }
  | { type: 'review'; item: AdminReview }
  | { type: 'report'; item: AdminReport }
  | { type: 'audit'; item: AdminAuditLog }
  | null;

type ConfirmState = {
  title: string;
  message: string;
  tone: 'default' | 'warning' | 'danger';
  confirmLabel: string;
  action: () => Promise<void> | void;
} | null;

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


function compareValues(a: unknown, b: unknown): number {
  const aValue = a ?? '';
  const bValue = b ?? '';

  const aDate = typeof aValue === 'string' ? Date.parse(aValue) : Number.NaN;
  const bDate = typeof bValue === 'string' ? Date.parse(bValue) : Number.NaN;

  if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
    return aDate - bDate;
  }

  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return aValue - bValue;
  }

  return String(aValue).localeCompare(String(bValue), 'en-GB', {
    numeric: true,
    sensitivity: 'base',
  });
}

function SortButton({
  label,
  field,
  sort,
  onSort,
}: {
  label: string;
  field: string;
  sort: SortState;
  onSort: (field: string) => void;
}) {
  const active = sort.field === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-wider ${
        active ? 'text-[#10B981]' : 'text-zinc-400 hover:text-zinc-700'
      }`}
    >
      {label}
      {active ? (
        sort.direction === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3" />
      )}
    </button>
  );
}


function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter(
      pageNumber =>
        pageNumber === 1 ||
        pageNumber === totalPages ||
        Math.abs(pageNumber - safePage) <= 2
    );

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-xl">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-mono font-bold text-zinc-500">
          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of{' '}
          <strong>{totalItems}</strong>
        </p>

        <label className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-black text-zinc-400 uppercase">
            Rows
          </span>
          <select
            value={pageSize}
            onChange={event => onPageSizeChange(Number(event.target.value))}
            className="px-2 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] font-mono font-black"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safePage === 1}
          className="p-2 border border-zinc-200 rounded-lg disabled:opacity-30"
          aria-label="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          className="p-2 border border-zinc-200 rounded-lg disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {pageNumbers.map((pageNumber, index) => {
          const previousPage = pageNumbers[index - 1];
          const showGap = previousPage && pageNumber - previousPage > 1;

          return (
            <React.Fragment key={pageNumber}>
              {showGap && (
                <span className="px-1 text-[10px] text-zinc-400">…</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`min-w-8 h-8 px-2 rounded-lg text-[10px] font-mono font-black ${
                  safePage === pageNumber
                    ? 'bg-zinc-950 text-white'
                    : 'border border-zinc-200 text-zinc-600'
                }`}
              >
                {pageNumber}
              </button>
            </React.Fragment>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          className="p-2 border border-zinc-200 rounded-lg disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safePage === totalPages}
          className="p-2 border border-zinc-200 rounded-lg disabled:opacity-30"
          aria-label="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}


function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  const textValue =
    typeof value === 'object' ? JSON.stringify(value) : String(value);

  return `"${textValue.replace(/"/g, '""')}"`;
}

function downloadCsv(
  filename: string,
  headers: string[],
  rows: unknown[][]
): void {
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(',')),
  ].join('\n');

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

  const [sorts, setSorts] = useState<Record<Exclude<AdminSection, 'overview' | 'analytics'>, SortState>>({
    users: { field: 'createdAt', direction: 'desc' },
    jobs: { field: 'createdAt', direction: 'desc' },
    reviews: { field: 'createdAt', direction: 'desc' },
    reports: { field: 'createdAt', direction: 'desc' },
    audit: { field: 'createdAt', direction: 'desc' },
  });

  const [pagination, setPagination] = useState<Record<PaginatedSection, PaginationState>>({
    users: { page: 1, pageSize: 25 },
    jobs: { page: 1, pageSize: 25 },
    reviews: { page: 1, pageSize: 25 },
    reports: { page: 1, pageSize: 25 },
    audit: { page: 1, pageSize: 25 },
  });

  const [selectedIds, setSelectedIds] = useState<Record<'users' | 'jobs' | 'reviews' | 'reports', Set<string>>>({
    users: new Set(),
    jobs: new Set(),
    reviews: new Set(),
    reports: new Set(),
  });

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalyticsPoint[]>([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [localActionId, setLocalActionId] = useState<string | null>(null);
  const [analyticsMetric, setAnalyticsMetric] =
    useState<AnalyticsMetric>('users');
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastRealtimeUpdate, setLastRealtimeUpdate] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<DetailTarget>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const [jobStatusFilter, setJobStatusFilter] =
    useState<'all' | AdminJobStatus>('all');
  const [jobFeaturedFilter, setJobFeaturedFilter] =
    useState<'all' | 'featured' | 'not_featured'>('all');
  const [reviewFilter, setReviewFilter] =
    useState<'all' | 'reported' | 'hidden' | 'visible'>('all');
  const [reportStatusFilter, setReportStatusFilter] =
    useState<'all' | AdminReportStatus>('all');
  const [auditTypeFilter, setAuditTypeFilter] = useState('all');

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

  useEffect(() => {
    setPagination(previous => ({
      ...previous,
      users: { ...previous.users, page: 1 },
      jobs: { ...previous.jobs, page: 1 },
      reviews: { ...previous.reviews, page: 1 },
      reports: { ...previous.reports, page: 1 },
      audit: { ...previous.audit, page: 1 },
    }));
  }, [searchQuery]);

  useEffect(() => {
    setPagination(previous => ({
      ...previous,
      users: { ...previous.users, page: 1 },
    }));
  }, [typeFilter, statusFilter, verificationFilter]);

  const refreshEverything = async () => {
    await Promise.all([Promise.resolve(onRefresh()), loadManagementData()]);
  };

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRealtimeRefresh = () => {
      setLastRealtimeUpdate(new Date().toISOString());

      if (refreshTimer) clearTimeout(refreshTimer);

      refreshTimer = setTimeout(() => {
        refreshEverything();
      }, 500);
    };

    const channel = supabase
      .channel('hireup-admin-live-console')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_profiles' },
        scheduleRealtimeRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contractor_profiles' },
        scheduleRealtimeRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        scheduleRealtimeRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        scheduleRealtimeRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        scheduleRealtimeRefresh
      )
      .subscribe(status => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      setRealtimeConnected(false);
      supabase.removeChannel(channel);
    };
  }, []);

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

    return jobs.filter(job => {
      if (jobStatusFilter !== 'all' && job.status !== jobStatusFilter) return false;
      if (jobFeaturedFilter === 'featured' && !job.featured) return false;
      if (jobFeaturedFilter === 'not_featured' && job.featured) return false;

      if (!query) return true;

      return [job.title, job.companyName, job.trade, job.location, job.payRate].some(
        value => value.toLowerCase().includes(query)
      );
    });
  }, [jobs, searchQuery, jobStatusFilter, jobFeaturedFilter]);

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reviews.filter(review => {
      if (reviewFilter === 'reported' && !review.reported) return false;
      if (reviewFilter === 'hidden' && !review.hidden) return false;
      if (reviewFilter === 'visible' && review.hidden) return false;

      if (!query) return true;

      return [
        review.reviewerName,
        review.reviewerRole,
        review.reviewText,
        review.reportReason,
      ].some(value => value.toLowerCase().includes(query));
    });
  }, [reviews, searchQuery, reviewFilter]);

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reports.filter(report => {
      if (reportStatusFilter !== 'all' && report.status !== reportStatusFilter) {
        return false;
      }

      if (!query) return true;

      return [
        report.targetType,
        report.reason,
        report.details,
        report.status,
      ].some(value => value.toLowerCase().includes(query));
    });
  }, [reports, searchQuery, reportStatusFilter]);

  const filteredAudit = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return auditLogs.filter(log => {
      if (auditTypeFilter !== 'all' && log.targetType !== auditTypeFilter) {
        return false;
      }

      if (!query) return true;

      return [log.action, log.targetType, log.targetId, log.adminUserId].some(value =>
        value.toLowerCase().includes(query)
      );
    });
  }, [auditLogs, searchQuery, auditTypeFilter]);

  const handleSort = (
    targetSection: Exclude<AdminSection, 'overview' | 'analytics'>,
    field: string
  ) => {
    setSorts(previous => {
      const current = previous[targetSection];

      return {
        ...previous,
        [targetSection]: {
          field,
          direction:
            current.field === field && current.direction === 'asc'
              ? 'desc'
              : 'asc',
        },
      };
    });
  };

  const applySort = <T,>(
    rows: T[],
    sort: SortState,
    getter: (row: T, field: string) => unknown
  ): T[] => {
    return [...rows].sort((a, b) => {
      const result = compareValues(getter(a, sort.field), getter(b, sort.field));
      return sort.direction === 'asc' ? result : -result;
    });
  };

  const updatePagination = (
    targetSection: PaginatedSection,
    changes: Partial<PaginationState>
  ) => {
    setPagination(previous => ({
      ...previous,
      [targetSection]: {
        ...previous[targetSection],
        ...changes,
      },
    }));
  };

  const paginateRows = <T,>(
    rows: T[],
    targetSection: PaginatedSection
  ): T[] => {
    const state = pagination[targetSection];
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    const safePage = Math.min(Math.max(1, state.page), totalPages);
    const start = (safePage - 1) * state.pageSize;
    return rows.slice(start, start + state.pageSize);
  };

  const toggleSelected = (
    targetSection: 'users' | 'jobs' | 'reviews' | 'reports',
    id: string
  ) => {
    setSelectedIds(previous => {
      const next = new Set(previous[targetSection]);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return {
        ...previous,
        [targetSection]: next,
      };
    });
  };

  const setPageSelection = (
    targetSection: 'users' | 'jobs' | 'reviews' | 'reports',
    ids: string[],
    selected: boolean
  ) => {
    setSelectedIds(previous => {
      const next = new Set(previous[targetSection]);

      ids.forEach(id => {
        if (selected) next.add(id);
        else next.delete(id);
      });

      return {
        ...previous,
        [targetSection]: next,
      };
    });
  };

  const clearSelection = (
    targetSection: 'users' | 'jobs' | 'reviews' | 'reports'
  ) => {
    setSelectedIds(previous => ({
      ...previous,
      [targetSection]: new Set(),
    }));
  };

  const sortedUsers = useMemo(
    () =>
      applySort<AdminManagedUser>(filteredUsers, sorts.users, (user, field) => {
        const values: Record<string, unknown> = {
          name: user.name,
          type: user.type,
          tradeOrIndustry: user.tradeOrIndustry,
          createdAt: user.createdAt,
          accountStatus: user.accountStatus,
          verificationStatus: user.verificationStatus,
        };
        return values[field];
      }),
    [filteredUsers, sorts.users]
  );

  const sortedJobs = useMemo(
    () =>
      applySort<AdminJob>(filteredJobs, sorts.jobs, (job, field) => {
        const values: Record<string, unknown> = {
          title: job.title,
          companyName: job.companyName,
          trade: job.trade,
          location: job.location,
          payRate: job.payRate,
          status: job.status,
          featured: job.featured ? 1 : 0,
          createdAt: job.createdAt,
        };
        return values[field];
      }),
    [filteredJobs, sorts.jobs]
  );

  const sortedReviews = useMemo(
    () =>
      applySort<AdminReview>(filteredReviews, sorts.reviews, (review, field) => {
        const values: Record<string, unknown> = {
          reviewerName: review.reviewerName,
          rating: review.rating,
          reported: review.reported ? 1 : 0,
          hidden: review.hidden ? 1 : 0,
          createdAt: review.createdAt,
        };
        return values[field];
      }),
    [filteredReviews, sorts.reviews]
  );

  const sortedReports = useMemo(
    () =>
      applySort<AdminReport>(filteredReports, sorts.reports, (report, field) => {
        const values: Record<string, unknown> = {
          targetType: report.targetType,
          reason: report.reason,
          status: report.status,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        };
        return values[field];
      }),
    [filteredReports, sorts.reports]
  );

  const sortedAudit = useMemo(
    () =>
      applySort<AdminAuditLog>(filteredAudit, sorts.audit, (log, field) => {
        const values: Record<string, unknown> = {
          action: log.action,
          targetType: log.targetType,
          adminUserId: log.adminUserId,
          createdAt: log.createdAt,
        };
        return values[field];
      }),
    [filteredAudit, sorts.audit]
  );

  const paginatedUsers = useMemo(
    () => paginateRows(sortedUsers, 'users'),
    [sortedUsers, pagination.users]
  );

  const paginatedJobs = useMemo(
    () => paginateRows(sortedJobs, 'jobs'),
    [sortedJobs, pagination.jobs]
  );

  const paginatedReviews = useMemo(
    () => paginateRows(sortedReviews, 'reviews'),
    [sortedReviews, pagination.reviews]
  );

  const paginatedReports = useMemo(
    () => paginateRows(sortedReports, 'reports'),
    [sortedReports, pagination.reports]
  );

  const paginatedAudit = useMemo(
    () => paginateRows(sortedAudit, 'audit'),
    [sortedAudit, pagination.audit]
  );

  const runBulkUserAction = async (
    statusType: 'verification' | 'account',
    status: AdminVerificationStatus | AdminAccountStatus
  ) => {
    const selectedUsers = sortedUsers.filter(user =>
      selectedIds.users.has(user.id)
    );

    if (selectedUsers.length === 0) return;

    setSectionLoading(true);
    setSectionError(null);

    try {
      if (statusType === 'verification') {
        await Promise.all(
          selectedUsers.map(user =>
            onUpdateVerificationStatus(
              user.id,
              user.type,
              status as AdminVerificationStatus
            )
          )
        );
      } else {
        await Promise.all(
          selectedUsers.map(user =>
            onUpdateAccountStatus(
              user.id,
              user.type,
              status as AdminAccountStatus
            )
          )
        );
      }

      clearSelection('users');
      await refreshEverything();
    } catch (bulkError: any) {
      setSectionError(bulkError.message || String(bulkError));
    } finally {
      setSectionLoading(false);
    }
  };

  const runBulkJobAction = async (
    action: 'feature' | 'unfeature' | 'close' | 'reopen' | 'delete'
  ) => {
    const selectedJobs = sortedJobs.filter(job =>
      selectedIds.jobs.has(job.id)
    );

    if (selectedJobs.length === 0) return;

    setSectionLoading(true);
    setSectionError(null);

    try {
      await Promise.all(
        selectedJobs.map(job => {
          if (action === 'delete') return deleteAdminJob(job.id);
          if (action === 'feature') {
            return updateAdminJob(job.id, { featured: true });
          }
          if (action === 'unfeature') {
            return updateAdminJob(job.id, { featured: false });
          }
          if (action === 'close') {
            return updateAdminJob(job.id, { status: 'closed' });
          }
          return updateAdminJob(job.id, { status: 'live' });
        })
      );

      clearSelection('jobs');
      await refreshEverything();
    } catch (bulkError: any) {
      setSectionError(bulkError.message || String(bulkError));
    } finally {
      setSectionLoading(false);
    }
  };

  const runBulkReviewAction = async (
    action: 'approve' | 'hide' | 'restore' | 'delete'
  ) => {
    const selectedReviews = sortedReviews.filter(review =>
      selectedIds.reviews.has(review.id)
    );

    if (selectedReviews.length === 0) return;

    setSectionLoading(true);
    setSectionError(null);

    try {
      await Promise.all(
        selectedReviews.map(review =>
          updateAdminReview(review.id, action)
        )
      );

      clearSelection('reviews');
      await refreshEverything();
    } catch (bulkError: any) {
      setSectionError(bulkError.message || String(bulkError));
    } finally {
      setSectionLoading(false);
    }
  };

  const runBulkReportAction = async (status: AdminReportStatus) => {
    const selectedReports = sortedReports.filter(report =>
      selectedIds.reports.has(report.id)
    );

    if (selectedReports.length === 0) return;

    setSectionLoading(true);
    setSectionError(null);

    try {
      await Promise.all(
        selectedReports.map(report =>
          updateAdminReport(report.id, status)
        )
      );

      clearSelection('reports');
      await refreshEverything();
    } catch (bulkError: any) {
      setSectionError(bulkError.message || String(bulkError));
    } finally {
      setSectionLoading(false);
    }
  };

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

  const confirmAction = (
    title: string,
    message: string,
    action: () => Promise<void> | void,
    tone: 'default' | 'warning' | 'danger' = 'warning',
    confirmLabel = 'Confirm'
  ) => {
    setConfirmState({
      title,
      message,
      action,
      tone,
      confirmLabel,
    });
  };

  const exportCurrentSection = () => {
    const date = new Date().toISOString().slice(0, 10);

    if (section === 'users') {
      const rows =
        selectedIds.users.size > 0
          ? sortedUsers.filter(user => selectedIds.users.has(user.id))
          : sortedUsers;

      downloadCsv(
        `hireup-users-${date}.csv`,
        [
          'ID',
          'Name',
          'Type',
          'Email',
          'Trade or Industry',
          'Location',
          'Verification Status',
          'Account Status',
          'Joined',
        ],
        rows.map(user => [
          user.id,
          user.name,
          user.type,
          user.email,
          user.tradeOrIndustry,
          user.location,
          user.verificationStatus,
          user.accountStatus,
          user.createdAt,
        ])
      );
      return;
    }

    if (section === 'jobs') {
      const rows =
        selectedIds.jobs.size > 0
          ? sortedJobs.filter(job => selectedIds.jobs.has(job.id))
          : sortedJobs;

      downloadCsv(
        `hireup-jobs-${date}.csv`,
        [
          'ID',
          'Title',
          'Company',
          'Trade',
          'Location',
          'Pay Rate',
          'Status',
          'Featured',
          'Created',
        ],
        rows.map(job => [
          job.id,
          job.title,
          job.companyName,
          job.trade,
          job.location,
          job.payRate,
          job.status,
          job.featured,
          job.createdAt,
        ])
      );
      return;
    }

    if (section === 'reviews') {
      const rows =
        selectedIds.reviews.size > 0
          ? sortedReviews.filter(review => selectedIds.reviews.has(review.id))
          : sortedReviews;

      downloadCsv(
        `hireup-reviews-${date}.csv`,
        [
          'ID',
          'Reviewer',
          'Role',
          'Rating',
          'Review',
          'Reported',
          'Report Reason',
          'Moderated',
          'Hidden',
          'Created',
        ],
        rows.map(review => [
          review.id,
          review.reviewerName,
          review.reviewerRole,
          review.rating,
          review.reviewText,
          review.reported,
          review.reportReason,
          review.moderated,
          review.hidden,
          review.createdAt,
        ])
      );
      return;
    }

    if (section === 'reports') {
      const rows =
        selectedIds.reports.size > 0
          ? sortedReports.filter(report => selectedIds.reports.has(report.id))
          : sortedReports;

      downloadCsv(
        `hireup-reports-${date}.csv`,
        [
          'ID',
          'Target Type',
          'Target ID',
          'Reason',
          'Details',
          'Status',
          'Assigned Admin',
          'Resolution Notes',
          'Created',
          'Updated',
        ],
        rows.map(report => [
          report.id,
          report.targetType,
          report.targetId,
          report.reason,
          report.details,
          report.status,
          report.assignedAdminId,
          report.resolutionNotes,
          report.createdAt,
          report.updatedAt,
        ])
      );
      return;
    }

    if (section === 'audit') {
      downloadCsv(
        `hireup-audit-log-${date}.csv`,
        [
          'ID',
          'Admin User ID',
          'Action',
          'Target Type',
          'Target ID',
          'Details',
          'Created',
        ],
        sortedAudit.map(log => [
          log.id,
          log.adminUserId,
          log.action,
          log.targetType,
          log.targetId,
          log.details,
          log.createdAt,
        ])
      );
    }
  };

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

  const activityFeed = useMemo(() => {
    const entries = [
      ...users.slice(0, 6).map(user => ({
        id: `user-${user.id}`,
        type: 'user',
        title: `${user.name} joined HireUp`,
        detail: user.type === 'worker' ? user.tradeOrIndustry : 'Contractor account',
        date: user.createdAt,
      })),
      ...jobs.slice(0, 6).map(job => ({
        id: `job-${job.id}`,
        type: 'job',
        title: `New vacancy: ${job.title}`,
        detail: job.companyName,
        date: job.createdAt,
      })),
      ...reviews.slice(0, 6).map(review => ({
        id: `review-${review.id}`,
        type: 'review',
        title: `${review.reviewerName} submitted a review`,
        detail: `${review.rating}/5 rating`,
        date: review.createdAt,
      })),
      ...reports.slice(0, 6).map(report => ({
        id: `report-${report.id}`,
        type: 'report',
        title: `New ${report.targetType} report`,
        detail: report.reason,
        date: report.createdAt,
      })),
      ...auditLogs.slice(0, 6).map(log => ({
        id: `audit-${log.id}`,
        type: 'audit',
        title: log.action,
        detail: `${log.targetType}: ${log.targetId}`,
        date: log.createdAt,
      })),
    ];

    return entries
      .filter(entry => entry.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);
  }, [users, jobs, reviews, reports, auditLogs]);

  const auditTargetTypes = useMemo(
    () => Array.from(new Set(auditLogs.map(log => log.targetType))).sort(),
    [auditLogs]
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
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-mono font-black uppercase ${
                realtimeConnected
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
              title={
                lastRealtimeUpdate
                  ? `Last live update: ${formatDate(lastRealtimeUpdate)}`
                  : 'Waiting for a live database event'
              }
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  realtimeConnected ? 'animate-pulse' : ''
                }`}
              />
              {realtimeConnected ? 'Live' : 'Connecting'}
            </div>

            {['users', 'jobs', 'reviews', 'reports', 'audit'].includes(section) && (
              <button
                type="button"
                onClick={exportCurrentSection}
                className="px-3 py-2 border border-zinc-200 hover:border-[#34D399] rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            )}

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

            <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-5">
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase">Live Activity Centre</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Recent registrations, jobs, reviews, reports and admin actions
                    </p>
                  </div>
                  <Activity className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="divide-y divide-zinc-100">
                  {activityFeed.length === 0 ? (
                    <div className="p-8 text-center text-sm text-zinc-400">
                      No recent activity.
                    </div>
                  ) : (
                    activityFeed.map(entry => (
                      <div key={entry.id} className="p-4 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                          {entry.type === 'job' ? (
                            <Briefcase className="w-4 h-4 text-zinc-500" />
                          ) : entry.type === 'review' ? (
                            <Star className="w-4 h-4 text-zinc-500" />
                          ) : entry.type === 'report' ? (
                            <Flag className="w-4 h-4 text-zinc-500" />
                          ) : entry.type === 'audit' ? (
                            <ListChecks className="w-4 h-4 text-zinc-500" />
                          ) : (
                            <Users className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black truncate">{entry.title}</p>
                          <p className="text-xs text-zinc-500 truncate">{entry.detail}</p>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-zinc-950 text-white rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-mono font-black uppercase text-[#34D399]">
                      Moderation Health
                    </p>
                    <h3 className="text-xl font-black mt-1">Queue Snapshot</h3>
                  </div>
                  <Clock3 className="w-5 h-5 text-[#34D399]" />
                </div>

                <div className="space-y-3 mt-6">
                  {[
                    ['Pending workers', stats?.pendingWorkerVerifications ?? 0],
                    ['Pending contractors', stats?.pendingContractorVerifications ?? 0],
                    ['Reported reviews', stats?.reportedReviews ?? 0],
                    ['Open reports', reports.filter(report => report.status === 'open').length],
                    ['Suspended accounts', (stats?.suspendedWorkers ?? 0) + (stats?.suspendedContractors ?? 0)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <span className="text-xs text-zinc-300">{label}</span>
                      <strong className="text-lg">{value}</strong>
                    </div>
                  ))}
                </div>
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
            {selectedIds.users.size > 0 && (
              <div className="sticky top-20 z-20 bg-zinc-950 text-white rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                <p className="text-sm font-black flex-1">
                  {selectedIds.users.size} user{selectedIds.users.size === 1 ? '' : 's'} selected
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => runBulkUserAction('verification', 'verified')} className="px-3 py-2 bg-[#34D399] rounded-lg text-[9px] font-mono font-black uppercase">
                    Verify
                  </button>
                  <button type="button" onClick={() => runBulkUserAction('verification', 'rejected')} className="px-3 py-2 bg-red-600 rounded-lg text-[9px] font-mono font-black uppercase">
                    Reject
                  </button>
                  <button type="button" onClick={() => runBulkUserAction('account', 'suspended')} className="px-3 py-2 bg-amber-500 rounded-lg text-[9px] font-mono font-black uppercase">
                    Suspend
                  </button>
                  <button type="button" onClick={() => runBulkUserAction('account', 'banned')} className="px-3 py-2 bg-red-700 rounded-lg text-[9px] font-mono font-black uppercase">
                    Ban
                  </button>
                  <button type="button" onClick={() => runBulkUserAction('account', 'active')} className="px-3 py-2 border border-zinc-600 rounded-lg text-[9px] font-mono font-black uppercase">
                    Reactivate
                  </button>
                  <button type="button" onClick={() => clearSelection('users')} className="px-3 py-2 border border-zinc-600 rounded-lg text-[9px] font-mono font-black uppercase">
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase text-zinc-500">
              <SlidersHorizontal className="w-4 h-4" />
              Advanced filters
            </div>
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

            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
              <div className="hidden lg:grid grid-cols-[auto_1.5fr_0.7fr_1fr_0.8fr_0.8fr_0.8fr_auto] gap-4 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    const ids = paginatedUsers.map(user => user.id);
                    const allSelected = ids.every(id => selectedIds.users.has(id));
                    setPageSelection('users', ids, !allSelected);
                  }}
                  className="text-zinc-400 hover:text-[#10B981]"
                  aria-label="Select current user page"
                >
                  {paginatedUsers.length > 0 && paginatedUsers.every(user => selectedIds.users.has(user.id)) ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <SortButton label="Name" field="name" sort={sorts.users} onSort={field => handleSort('users', field)} />
                <SortButton label="Type" field="type" sort={sorts.users} onSort={field => handleSort('users', field)} />
                <SortButton label="Trade" field="tradeOrIndustry" sort={sorts.users} onSort={field => handleSort('users', field)} />
                <SortButton label="Joined" field="createdAt" sort={sorts.users} onSort={field => handleSort('users', field)} />
                <SortButton label="Account" field="accountStatus" sort={sorts.users} onSort={field => handleSort('users', field)} />
                <SortButton label="Verified" field="verificationStatus" sort={sorts.users} onSort={field => handleSort('users', field)} />
                <span className="text-[9px] font-mono font-black uppercase text-zinc-400">Actions</span>
              </div>
              <div className="divide-y divide-zinc-100">
              {paginatedUsers.map(user => (
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
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation();
                      toggleSelected('users', user.id);
                    }}
                    className="text-zinc-400 hover:text-[#10B981] flex-shrink-0"
                    aria-label={`Select ${user.name}`}
                  >
                    {selectedIds.users.has(user.id) ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
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
            </div>

            <PaginationControls
              page={pagination.users.page}
              pageSize={pagination.users.pageSize}
              totalItems={sortedUsers.length}
              onPageChange={page => updatePagination('users', { page })}
              onPageSizeChange={pageSize =>
                updatePagination('users', { page: 1, pageSize })
              }
            />
          </section>
        )}

        {section === 'jobs' && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={jobStatusFilter}
                onChange={event => setJobStatusFilter(event.target.value as 'all' | AdminJobStatus)}
                className="p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
              >
                <option value="all">All job statuses</option>
                <option value="live">Live</option>
                <option value="closed">Closed</option>
                <option value="removed">Removed</option>
              </select>
              <select
                value={jobFeaturedFilter}
                onChange={event => setJobFeaturedFilter(event.target.value as 'all' | 'featured' | 'not_featured')}
                className="p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
              >
                <option value="all">All featured states</option>
                <option value="featured">Featured only</option>
                <option value="not_featured">Not featured</option>
              </select>
            </div>
            {selectedIds.jobs.size > 0 && (
              <div className="sticky top-20 z-20 bg-zinc-950 text-white rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                <p className="text-sm font-black flex-1">
                  {selectedIds.jobs.size} job{selectedIds.jobs.size === 1 ? '' : 's'} selected
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => runBulkJobAction('feature')} className="px-3 py-2 bg-amber-500 rounded-lg text-[9px] font-mono font-black uppercase">Feature</button>
                  <button type="button" onClick={() => runBulkJobAction('unfeature')} className="px-3 py-2 border border-zinc-600 rounded-lg text-[9px] font-mono font-black uppercase">Unfeature</button>
                  <button type="button" onClick={() => runBulkJobAction('close')} className="px-3 py-2 bg-amber-700 rounded-lg text-[9px] font-mono font-black uppercase">Close</button>
                  <button type="button" onClick={() => runBulkJobAction('reopen')} className="px-3 py-2 bg-[#34D399] rounded-lg text-[9px] font-mono font-black uppercase">Reopen</button>
                  <button type="button" onClick={() => runBulkJobAction('delete')} className="px-3 py-2 bg-red-600 rounded-lg text-[9px] font-mono font-black uppercase">Delete</button>
                  <button type="button" onClick={() => clearSelection('jobs')} className="px-3 py-2 border border-zinc-600 rounded-lg text-[9px] font-mono font-black uppercase">Clear</button>
                </div>
              </div>
            )}

            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="hidden lg:grid grid-cols-[auto_1.4fr_1fr_0.8fr_0.8fr_0.7fr_auto] gap-4 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
              <button
                type="button"
                onClick={() => {
                  const ids = paginatedJobs.map(job => job.id);
                  const allSelected = ids.every(id => selectedIds.jobs.has(id));
                  setPageSelection('jobs', ids, !allSelected);
                }}
                className="text-zinc-400 hover:text-[#10B981]"
                aria-label="Select current job page"
              >
                {paginatedJobs.length > 0 && paginatedJobs.every(job => selectedIds.jobs.has(job.id)) ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <SortButton label="Vacancy" field="title" sort={sorts.jobs} onSort={field => handleSort('jobs', field)} />
              <SortButton label="Company" field="companyName" sort={sorts.jobs} onSort={field => handleSort('jobs', field)} />
              <SortButton label="Trade" field="trade" sort={sorts.jobs} onSort={field => handleSort('jobs', field)} />
              <SortButton label="Location" field="location" sort={sorts.jobs} onSort={field => handleSort('jobs', field)} />
              <SortButton label="Status" field="status" sort={sorts.jobs} onSort={field => handleSort('jobs', field)} />
              <span className="text-[9px] font-mono font-black uppercase text-zinc-400">Actions</span>
            </div>
            <div className="divide-y divide-zinc-100">
            {paginatedJobs.map(job => (
              <div
                key={job.id}
                onClick={() => setDetailTarget({ type: 'job', item: job })}
                className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 cursor-pointer hover:bg-zinc-50"
              >
                <button
                  type="button"
                  onClick={event => { event.stopPropagation(); toggleSelected('jobs', job.id); }}
                  className="text-zinc-400 hover:text-[#10B981] flex-shrink-0"
                  aria-label={`Select ${job.title}`}
                >
                  {selectedIds.jobs.has(job.id) ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
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
                      confirmAction(
                        'Delete job',
                        `Permanently delete "${job.title}"? This cannot be undone.`,
                        () => runLocalAction(job.id, () => deleteAdminJob(job.id)),
                        'danger',
                        'Delete'
                      );
                    }}
                    className="p-2 bg-red-50 text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            </div>
            </div>

            <div className="mt-4">
              <PaginationControls
                page={pagination.jobs.page}
                pageSize={pagination.jobs.pageSize}
                totalItems={sortedJobs.length}
                onPageChange={page => updatePagination('jobs', { page })}
                onPageSizeChange={pageSize =>
                  updatePagination('jobs', { page: 1, pageSize })
                }
              />
            </div>
          </section>
        )}

        {section === 'reviews' && (
          <section className="space-y-3">
            <select
              value={reviewFilter}
              onChange={event => setReviewFilter(event.target.value as 'all' | 'reported' | 'hidden' | 'visible')}
              className="w-full sm:w-72 p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
            >
              <option value="all">All reviews</option>
              <option value="reported">Reported only</option>
              <option value="hidden">Hidden only</option>
              <option value="visible">Visible only</option>
            </select>
            {selectedIds.reviews.size > 0 && (
              <div className="sticky top-20 z-20 bg-zinc-950 text-white rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                <p className="text-sm font-black flex-1">
                  {selectedIds.reviews.size} review{selectedIds.reviews.size === 1 ? '' : 's'} selected
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => runBulkReviewAction('approve')} className="px-3 py-2 bg-[#34D399] rounded-lg text-[9px] font-mono font-black uppercase">Approve</button>
                  <button type="button" onClick={() => runBulkReviewAction('hide')} className="px-3 py-2 bg-zinc-700 rounded-lg text-[9px] font-mono font-black uppercase">Hide</button>
                  <button type="button" onClick={() => runBulkReviewAction('restore')} className="px-3 py-2 border border-zinc-600 rounded-lg text-[9px] font-mono font-black uppercase">Restore</button>
                  <button type="button" onClick={() => runBulkReviewAction('delete')} className="px-3 py-2 bg-red-600 rounded-lg text-[9px] font-mono font-black uppercase">Delete</button>
                  <button type="button" onClick={() => clearSelection('reviews')} className="px-3 py-2 border border-zinc-600 rounded-lg text-[9px] font-mono font-black uppercase">Clear</button>
                </div>
              </div>
            )}
            <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => {
                  const ids = paginatedReviews.map(review => review.id);
                  const allSelected = ids.every(id => selectedIds.reviews.has(id));
                  setPageSelection('reviews', ids, !allSelected);
                }}
                className="inline-flex items-center gap-1.5 text-[9px] font-mono font-black uppercase text-zinc-500"
              >
                {paginatedReviews.length > 0 && paginatedReviews.every(review => selectedIds.reviews.has(review.id)) ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select page
              </button>
              <SortButton label="Reviewer" field="reviewerName" sort={sorts.reviews} onSort={field => handleSort('reviews', field)} />
              <SortButton label="Rating" field="rating" sort={sorts.reviews} onSort={field => handleSort('reviews', field)} />
              <SortButton label="Reported" field="reported" sort={sorts.reviews} onSort={field => handleSort('reviews', field)} />
              <SortButton label="Hidden" field="hidden" sort={sorts.reviews} onSort={field => handleSort('reviews', field)} />
              <SortButton label="Date" field="createdAt" sort={sorts.reviews} onSort={field => handleSort('reviews', field)} />
            </div>
            {paginatedReviews.map(review => (
              <article
                key={review.id}
                onClick={() => setDetailTarget({ type: 'review', item: review })}
                className={`bg-white border rounded-2xl p-5 cursor-pointer hover:border-[#34D399] ${
                  review.reported ? 'border-amber-300' : 'border-zinc-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  <button
                    type="button"
                    onClick={event => { event.stopPropagation(); toggleSelected('reviews', review.id); }}
                    className="text-zinc-400 hover:text-[#10B981] flex-shrink-0"
                    aria-label={`Select review by ${review.reviewerName}`}
                  >
                    {selectedIds.reviews.has(review.id) ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
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
                        confirmAction(
                          'Delete review',
                          'Permanently delete this review? This cannot be undone.',
                          () =>
                            runLocalAction(review.id, () =>
                              updateAdminReview(review.id, 'delete')
                            ),
                          'danger',
                          'Delete'
                        );
                      }}
                      className="p-2 bg-red-50 text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}

            <PaginationControls
              page={pagination.reviews.page}
              pageSize={pagination.reviews.pageSize}
              totalItems={sortedReviews.length}
              onPageChange={page => updatePagination('reviews', { page })}
              onPageSizeChange={pageSize =>
                updatePagination('reviews', { page: 1, pageSize })
              }
            />
          </section>
        )}

        {section === 'reports' && (
          <section className="space-y-3">
            <select
              value={reportStatusFilter}
              onChange={event => setReportStatusFilter(event.target.value as 'all' | AdminReportStatus)}
              className="w-full sm:w-72 p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
            >
              <option value="all">All report statuses</option>
              <option value="open">Open</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            {selectedIds.reports.size > 0 && (
              <div className="sticky top-20 z-20 bg-zinc-950 text-white rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                <p className="text-sm font-black flex-1">
                  {selectedIds.reports.size} report{selectedIds.reports.size === 1 ? '' : 's'} selected
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => runBulkReportAction('reviewing')} className="px-3 py-2 bg-amber-500 rounded-lg text-[9px] font-mono font-black uppercase">Reviewing</button>
                  <button type="button" onClick={() => runBulkReportAction('resolved')} className="px-3 py-2 bg-[#34D399] rounded-lg text-[9px] font-mono font-black uppercase">Resolve</button>
                  <button type="button" onClick={() => runBulkReportAction('dismissed')} className="px-3 py-2 bg-zinc-700 rounded-lg text-[9px] font-mono font-black uppercase">Dismiss</button>
                  <button type="button" onClick={() => clearSelection('reports')} className="px-3 py-2 border border-zinc-600 rounded-lg text-[9px] font-mono font-black uppercase">Clear</button>
                </div>
              </div>
            )}
            <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => {
                  const ids = paginatedReports.map(report => report.id);
                  const allSelected = ids.every(id => selectedIds.reports.has(id));
                  setPageSelection('reports', ids, !allSelected);
                }}
                className="inline-flex items-center gap-1.5 text-[9px] font-mono font-black uppercase text-zinc-500"
              >
                {paginatedReports.length > 0 && paginatedReports.every(report => selectedIds.reports.has(report.id)) ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select page
              </button>
              <SortButton label="Type" field="targetType" sort={sorts.reports} onSort={field => handleSort('reports', field)} />
              <SortButton label="Reason" field="reason" sort={sorts.reports} onSort={field => handleSort('reports', field)} />
              <SortButton label="Status" field="status" sort={sorts.reports} onSort={field => handleSort('reports', field)} />
              <SortButton label="Created" field="createdAt" sort={sorts.reports} onSort={field => handleSort('reports', field)} />
              <SortButton label="Updated" field="updatedAt" sort={sorts.reports} onSort={field => handleSort('reports', field)} />
            </div>
            {sortedReports.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="font-black mt-3">No reports found</p>
                <p className="text-xs text-zinc-400 mt-1">
                  New user, job and review reports will appear here.
                </p>
              </div>
            ) : (
              paginatedReports.map(report => (
                <article
                  key={report.id}
                  onClick={() => setDetailTarget({ type: 'report', item: report })}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 cursor-pointer hover:border-[#34D399]"
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    <button
                      type="button"
                      onClick={event => { event.stopPropagation(); toggleSelected('reports', report.id); }}
                      className="text-zinc-400 hover:text-[#10B981] flex-shrink-0"
                      aria-label={`Select report ${report.id}`}
                    >
                      {selectedIds.reports.has(report.id) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
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

            <PaginationControls
              page={pagination.reports.page}
              pageSize={pagination.reports.pageSize}
              totalItems={sortedReports.length}
              onPageChange={page => updatePagination('reports', { page })}
              onPageSizeChange={pageSize =>
                updatePagination('reports', { page: 1, pageSize })
              }
            />
          </section>
        )}

        {section === 'analytics' && (
          <section className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Interactive Analytics</h2>
                <p className="text-sm text-zinc-500">
                  Explore the last 14 days of platform activity.
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    'users',
                    'jobs',
                    'matches',
                    'messages',
                    'interviews',
                    'reviews',
                  ] as AnalyticsMetric[]
                ).map(metric => (
                  <button
                    key={metric}
                    type="button"
                    onClick={() => setAnalyticsMetric(metric)}
                    className={`px-3 py-2 rounded-lg text-[9px] font-mono font-black uppercase ${
                      analyticsMetric === metric
                        ? 'bg-zinc-950 text-white'
                        : 'bg-white border border-zinc-200 text-zinc-500'
                    }`}
                  >
                    {metric}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[9px] font-mono font-black uppercase text-zinc-400">
                    Selected Metric
                  </p>
                  <p className="text-xl font-black capitalize mt-1">
                    {analyticsMetric}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {analytics.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-sm text-zinc-400">
                  No analytics data available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <svg
                    viewBox="0 0 900 320"
                    className="min-w-[800px] w-full h-80"
                    role="img"
                    aria-label={`${analyticsMetric} activity chart`}
                  >
                    {[0, 1, 2, 3, 4].map(line => (
                      <line
                        key={line}
                        x1="55"
                        x2="875"
                        y1={35 + line * 55}
                        y2={35 + line * 55}
                        stroke="currentColor"
                        className="text-zinc-100"
                        strokeWidth="1"
                      />
                    ))}

                    <polyline
                      fill="none"
                      stroke="currentColor"
                      className="text-[#10B981]"
                      strokeWidth="4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={analytics
                        .map((point, index) => {
                          const maxValue = Math.max(
                            1,
                            ...analytics.map(item => item[analyticsMetric])
                          );
                          const x =
                            60 +
                            (index * 805) /
                              Math.max(1, analytics.length - 1);
                          const y =
                            255 -
                            (point[analyticsMetric] / maxValue) * 205;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />

                    {analytics.map((point, index) => {
                      const maxValue = Math.max(
                        1,
                        ...analytics.map(item => item[analyticsMetric])
                      );
                      const x =
                        60 +
                        (index * 805) /
                          Math.max(1, analytics.length - 1);
                      const y =
                        255 -
                        (point[analyticsMetric] / maxValue) * 205;

                      return (
                        <g key={point.date}>
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill="currentColor"
                            className="text-[#34D399]"
                          >
                            <title>
                              {point.date}: {point[analyticsMetric]}{' '}
                              {analyticsMetric}
                            </title>
                          </circle>
                          <text
                            x={x}
                            y="285"
                            textAnchor="middle"
                            className="fill-zinc-400 text-[9px]"
                          >
                            {point.date.slice(5)}
                          </text>
                          <text
                            x={x}
                            y={Math.max(18, y - 12)}
                            textAnchor="middle"
                            className="fill-zinc-700 text-[10px] font-bold"
                          >
                            {point[analyticsMetric]}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {(
                [
                  'users',
                  'jobs',
                  'matches',
                  'messages',
                  'interviews',
                  'reviews',
                ] as AnalyticsMetric[]
              ).map(metric => {
                const total = analytics.reduce(
                  (sum, point) => sum + point[metric],
                  0
                );

                return (
                  <button
                    key={metric}
                    type="button"
                    onClick={() => setAnalyticsMetric(metric)}
                    className={`text-left border rounded-xl p-4 ${
                      analyticsMetric === metric
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-white border-zinc-200'
                    }`}
                  >
                    <p className="text-2xl font-black">{total}</p>
                    <p
                      className={`text-[9px] font-mono font-black uppercase ${
                        analyticsMetric === metric
                          ? 'text-[#34D399]'
                          : 'text-zinc-500'
                      }`}
                    >
                      {metric}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {section === 'audit' && (
          <section className="space-y-4">
            <select
              value={auditTypeFilter}
              onChange={event => setAuditTypeFilter(event.target.value)}
              className="w-full sm:w-72 p-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
            >
              <option value="all">All target types</option>
              {auditTargetTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.2fr_0.8fr_1fr_0.8fr] gap-4 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
              <SortButton label="Action" field="action" sort={sorts.audit} onSort={field => handleSort('audit', field)} />
              <SortButton label="Target" field="targetType" sort={sorts.audit} onSort={field => handleSort('audit', field)} />
              <SortButton label="Admin" field="adminUserId" sort={sorts.audit} onSort={field => handleSort('audit', field)} />
              <SortButton label="Date" field="createdAt" sort={sorts.audit} onSort={field => handleSort('audit', field)} />
            </div>
            <div className="divide-y divide-zinc-100">
            {sortedAudit.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="font-black mt-3">No admin actions logged yet</p>
              </div>
            ) : (
              paginatedAudit.map(log => (
                <div
                  key={log.id}
                  onClick={() => setDetailTarget({ type: 'audit', item: log })}
                  className="p-4 flex flex-col md:flex-row md:items-center gap-3 cursor-pointer hover:bg-zinc-50"
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
            </div>

            <div className="mt-4">
              <PaginationControls
                page={pagination.audit.page}
                pageSize={pagination.audit.pageSize}
                totalItems={sortedAudit.length}
                onPageChange={page => updatePagination('audit', { page })}
                onPageSizeChange={pageSize =>
                  updatePagination('audit', { page: 1, pageSize })
                }
              />
            </div>
            </div>
          </section>
        )}

        {detailTarget && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close detail panel"
              onClick={() => setDetailTarget(null)}
              className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
            />

            <aside className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl border-l border-zinc-200 overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-mono font-black text-[#10B981] uppercase">
                    Admin Detail View
                  </p>
                  <h3 className="text-lg font-black mt-1 capitalize">
                    {detailTarget.type}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailTarget(null)}
                  className="p-2 rounded-lg border border-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {detailTarget.type === 'job' && (
                  <>
                    <div className="p-5 bg-zinc-950 text-white rounded-2xl">
                      <p className="text-[9px] font-mono uppercase text-[#34D399]">
                        Vacancy
                      </p>
                      <h4 className="text-xl font-black mt-2">{detailTarget.item.title}</h4>
                      <p className="text-sm text-zinc-400 mt-2">{detailTarget.item.companyName}</p>
                    </div>
                    {[
                      ['Trade', detailTarget.item.trade],
                      ['Location', detailTarget.item.location],
                      ['Pay', detailTarget.item.payRate],
                      ['Status', detailTarget.item.status],
                      ['Featured', detailTarget.item.featured ? 'Yes' : 'No'],
                      ['Created', formatDate(detailTarget.item.createdAt)],
                      ['Job ID', detailTarget.item.id],
                    ].map(([label, value]) => (
                      <div key={label} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                        <p className="text-[9px] font-mono font-black uppercase text-zinc-400">{label}</p>
                        <p className="text-sm font-bold mt-1 break-all">{value}</p>
                      </div>
                    ))}
                  </>
                )}

                {detailTarget.type === 'review' && (
                  <>
                    <div className="p-5 bg-zinc-950 text-white rounded-2xl">
                      <p className="text-[9px] font-mono uppercase text-[#34D399]">Review</p>
                      <h4 className="text-xl font-black mt-2">{detailTarget.item.reviewerName}</h4>
                      <p className="text-amber-400 mt-2">{'★'.repeat(Math.round(detailTarget.item.rating))}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <p className="text-sm leading-relaxed">{detailTarget.item.reviewText}</p>
                    </div>
                    {detailTarget.item.reportReason && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                        {detailTarget.item.reportReason}
                      </div>
                    )}
                  </>
                )}

                {detailTarget.type === 'report' && (
                  <>
                    <div className="p-5 bg-zinc-950 text-white rounded-2xl">
                      <p className="text-[9px] font-mono uppercase text-[#34D399]">{detailTarget.item.targetType} report</p>
                      <h4 className="text-xl font-black mt-2">{detailTarget.item.reason}</h4>
                    </div>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <p className="text-sm">{detailTarget.item.details || 'No additional details supplied.'}</p>
                    </div>
                    {[
                      ['Status', detailTarget.item.status],
                      ['Target ID', detailTarget.item.targetId],
                      ['Reporter ID', detailTarget.item.reporterId],
                      ['Created', formatDate(detailTarget.item.createdAt)],
                      ['Updated', formatDate(detailTarget.item.updatedAt)],
                    ].map(([label, value]) => (
                      <div key={label} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                        <p className="text-[9px] font-mono font-black uppercase text-zinc-400">{label}</p>
                        <p className="text-sm font-bold mt-1 break-all">{value}</p>
                      </div>
                    ))}
                  </>
                )}

                {detailTarget.type === 'audit' && (
                  <>
                    <div className="p-5 bg-zinc-950 text-white rounded-2xl">
                      <p className="text-[9px] font-mono uppercase text-[#34D399]">Audit event</p>
                      <h4 className="text-xl font-black mt-2">{detailTarget.item.action}</h4>
                    </div>
                    {[
                      ['Target type', detailTarget.item.targetType],
                      ['Target ID', detailTarget.item.targetId],
                      ['Admin ID', detailTarget.item.adminUserId],
                      ['Created', formatDate(detailTarget.item.createdAt)],
                    ].map(([label, value]) => (
                      <div key={label} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                        <p className="text-[9px] font-mono font-black uppercase text-zinc-400">{label}</p>
                        <p className="text-sm font-bold mt-1 break-all">{value}</p>
                      </div>
                    ))}
                    <pre className="p-4 bg-zinc-950 text-emerald-300 rounded-xl text-xs overflow-x-auto">
                      {JSON.stringify(detailTarget.item.details, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}

        {confirmState && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Cancel confirmation"
              onClick={() => setConfirmState(null)}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  confirmState.tone === 'danger'
                    ? 'bg-red-50 text-red-600'
                    : confirmState.tone === 'warning'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black mt-4">{confirmState.title}</h3>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                {confirmState.message}
              </p>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setConfirmState(null)}
                  className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl text-[10px] font-mono font-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const action = confirmState.action;
                    setConfirmState(null);
                    await action();
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl text-white text-[10px] font-mono font-black uppercase ${
                    confirmState.tone === 'danger'
                      ? 'bg-red-600'
                      : confirmState.tone === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-[#34D399]'
                  }`}
                >
                  {confirmState.confirmLabel}
                </button>
              </div>
            </div>
          </div>
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
                          confirmAction(
                            'Reject verification',
                            `Reject verification for ${selectedUser.name}?`,
                            async () => {
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
                            },
                            'danger',
                            'Reject'
                          );
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
                        onClick={() => {
                          confirmAction(
                            'Suspend account',
                            `Suspend ${selectedUser.name}?`,
                            async () => {
                              await onUpdateAccountStatus(
                                selectedUser.id,
                                selectedUser.type,
                                'suspended'
                              );

                              setSelectedUser({
                                ...selectedUser,
                                accountStatus: 'suspended',
                              });
                            },
                            'warning',
                            'Suspend'
                          );
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
                        onClick={() => {
                          confirmAction(
                            'Ban account',
                            `Ban ${selectedUser.name}? They will remain banned until manually reactivated.`,
                            async () => {
                              await onUpdateAccountStatus(
                                selectedUser.id,
                                selectedUser.type,
                                'banned'
                              );

                              setSelectedUser({
                                ...selectedUser,
                                accountStatus: 'banned',
                              });
                            },
                            'danger',
                            'Ban'
                          );
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