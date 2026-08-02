import { supabase } from './client';

export type AdminRole = 'admin' | 'super_admin';
export type AdminManagedUserType = 'worker' | 'contractor';
export type AdminAccountStatus = 'active' | 'suspended' | 'banned';
export type AdminVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface AdminUser {
  userId: string;
  role: AdminRole;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  workers: number;
  contractors: number;
  liveJobs: number;
  matches: number;
  messages: number;
  interviews: number;
  reviews: number;
  reportedReviews: number;
  pendingWorkerVerifications: number;
  pendingContractorVerifications: number;
  suspendedWorkers: number;
  suspendedContractors: number;
}

export interface AdminManagedUser {
  id: string;
  type: AdminManagedUserType;
  name: string;
  email: string;
  location: string;
  tradeOrIndustry: string;
  accountStatus: AdminAccountStatus;
  verificationStatus: AdminVerificationStatus;
  verified: boolean;
  createdAt: string;
  avatar: string;
}

export async function fetchAdminUser(
  userId: string
): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id, role, created_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not check administrator access: ${error.message}`);
  }

  if (!data) return null;

  return {
    userId: data.user_id,
    role: data.role as AdminRole,
    createdAt: data.created_at,
  };
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Could not read the current session: ${error.message}`);
  }

  if (!user) return null;
  return fetchAdminUser(user.id);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  return Boolean(await getCurrentAdmin());
}

async function requireCurrentAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error('Administrator access is required.');
  }

  return admin;
}

function normaliseVerificationStatus(row: any): AdminVerificationStatus {
  const raw =
    row.verification_status ??
    row.verified_status ??
    row.verified ??
    false;

  if (raw === true || raw === 'verified' || raw === 'approved') {
    return 'verified';
  }

  if (raw === 'rejected' || raw === 'declined') {
    return 'rejected';
  }

  return 'pending';
}

function normaliseAccountStatus(row: any): AdminAccountStatus {
  const raw = row.account_status ?? row.status ?? 'active';

  if (raw === 'suspended') return 'suspended';
  if (raw === 'banned' || raw === 'disabled') return 'banned';

  return 'active';
}

export async function fetchAdminManagedUsers(): Promise<AdminManagedUser[]> {
  await requireCurrentAdmin();

  const [
    { data: workerRows, error: workerError },
    { data: contractorRows, error: contractorError },
  ] = await Promise.all([
    supabase
      .from('worker_profiles')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('contractor_profiles')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  if (workerError) {
    throw new Error(`Could not load workers for admin: ${workerError.message}`);
  }

  if (contractorError) {
    throw new Error(
      `Could not load contractors for admin: ${contractorError.message}`
    );
  }

  const workers: AdminManagedUser[] = (workerRows || []).map((row: any) => {
    const verificationStatus = normaliseVerificationStatus(row);

    return {
      id: row.id,
      type: 'worker',
      name: row.full_name || row.name || 'Unnamed Worker',
      email: row.email || '',
      location: row.hometown || row.location || '',
      tradeOrIndustry:
        row.main_trade_category ||
        row.trade ||
        row.trade_category ||
        'General Labour',
      accountStatus: normaliseAccountStatus(row),
      verificationStatus,
      verified: verificationStatus === 'verified',
      createdAt: row.created_at || row.updated_at || '',
      avatar:
        row.profile_photo ||
        row.profile_photo_url ||
        row.avatar ||
        '',
    };
  });

  const contractors: AdminManagedUser[] = (contractorRows || []).map(
    (row: any) => {
      const verificationStatus = normaliseVerificationStatus(row);

      return {
        id: row.id,
        type: 'contractor',
        name: row.company_name || row.name || 'Unnamed Contractor',
        email: row.email || row.contact_email || '',
        location:
          row.headquarters_location ||
          row.location ||
          row.business_address ||
          '',
        tradeOrIndustry:
          row.industry ||
          (Array.isArray(row.trades_hiring_for)
            ? row.trades_hiring_for.join(', ')
            : '') ||
          'Construction',
        accountStatus: normaliseAccountStatus(row),
        verificationStatus,
        verified: verificationStatus === 'verified',
        createdAt: row.created_at || row.updated_at || '',
        avatar:
          row.company_logo_url ||
          row.logo ||
          row.company_logo ||
          '',
      };
    }
  );

  return [...workers, ...contractors].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

async function countRows(table: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true });

  if (error) {
    const message =
      error.message ||
      error.details ||
      error.hint ||
      JSON.stringify(error);

    throw new Error(`Could not count ${table}: ${message}`);
  }

  return count || 0;
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  await requireCurrentAdmin();

  const [
    managedUsers,
    liveJobs,
    matches,
    messages,
    interviews,
    reviews,
    reportedReviews,
  ] = await Promise.all([
    fetchAdminManagedUsers(),
    countRows('jobs'),
    countRows('matches'),
    countRows('messages'),
    countRows('interviews'),
    countRows('reviews'),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reported', true),
  ]);

  if (reportedReviews.error) {
    throw new Error(
      `Could not count reported reviews: ${
        reportedReviews.error.message ||
        reportedReviews.error.details ||
        JSON.stringify(reportedReviews.error)
      }`
    );
  }

  const workers = managedUsers.filter(user => user.type === 'worker');
  const contractors = managedUsers.filter(
    user => user.type === 'contractor'
  );

  return {
    totalUsers: managedUsers.length,
    workers: workers.length,
    contractors: contractors.length,
    liveJobs,
    matches,
    messages,
    interviews,
    reviews,
    reportedReviews: reportedReviews.count || 0,
    pendingWorkerVerifications: workers.filter(
      user => user.verificationStatus === 'pending'
    ).length,
    pendingContractorVerifications: contractors.filter(
      user => user.verificationStatus === 'pending'
    ).length,
    suspendedWorkers: workers.filter(
      user => user.accountStatus === 'suspended'
    ).length,
    suspendedContractors: contractors.filter(
      user => user.accountStatus === 'suspended'
    ).length,
  };
}

export async function updateAdminVerificationStatus(
  userId: string,
  userType: AdminManagedUserType,
  status: AdminVerificationStatus
): Promise<void> {
  await requireCurrentAdmin();

  const table =
    userType === 'worker' ? 'worker_profiles' : 'contractor_profiles';

  const updatePayload =
    userType === 'contractor'
      ? {
          verification_status: status,
          verified_status: status === 'verified',
        }
      : {
          verification_status: status,
        };

  const selectColumns =
    userType === 'contractor'
      ? 'id, user_id, verification_status, verified_status'
      : 'id, user_id, verification_status';

  const { data, error } = await supabase
    .from(table)
    .update(updatePayload)
    .or(`id.eq.${userId},user_id.eq.${userId}`)
    .select(selectColumns)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not update verification: ${
        error.message || error.details || error.hint || JSON.stringify(error)
      }`
    );
  }

  if (!data) {
    throw new Error(
      'Could not update verification: no matching profile was changed. Check the profile ID and the admin update policy.'
    );
  }

  if (data.verification_status !== status) {
    throw new Error(
      `Could not update verification: expected "${status}" but the database returned "${data.verification_status}".`
    );
  }

  if (
    userType === 'contractor' &&
    Boolean(data.verified_status) !== (status === 'verified')
  ) {
    throw new Error(
      'Could not update verification: the contractor verification fields did not stay in sync.'
    );
  }
}

export async function updateAdminAccountStatus(
  userId: string,
  userType: AdminManagedUserType,
  status: AdminAccountStatus
): Promise<void> {
  await requireCurrentAdmin();

  const table =
    userType === 'worker' ? 'worker_profiles' : 'contractor_profiles';

  const { error } = await supabase
    .from(table)
    .update({ account_status: status })
    .eq('id', userId);

  if (error) {
    throw new Error(
      `Could not update account status: ${
        error.message || error.details || JSON.stringify(error)
      }`
    );
  }
}

// -----------------------------------------------------------------------------
// Complete Admin Management System
// -----------------------------------------------------------------------------

export type AdminJobStatus = 'live' | 'closed' | 'removed';
export type AdminReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type AdminReportTargetType = 'user' | 'job' | 'review';

export interface AdminJob {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  trade: string;
  location: string;
  payRate: string;
  status: AdminJobStatus;
  featured: boolean;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  reviewerId: string;
  reviewedUserId: string;
  reviewerName: string;
  reviewerRole: string;
  rating: number;
  reviewText: string;
  reported: boolean;
  reportReason: string;
  moderated: boolean;
  hidden: boolean;
  createdAt: string;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  targetType: AdminReportTargetType;
  targetId: string;
  reason: string;
  details: string;
  status: AdminReportStatus;
  assignedAdminId: string;
  resolutionNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AdminAnalyticsPoint {
  date: string;
  users: number;
  jobs: number;
  matches: number;
  messages: number;
  interviews: number;
  reviews: number;
}

async function writeAdminAuditLog(
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const admin = await requireCurrentAdmin();

  const { error } = await supabase.from('admin_audit_logs').insert({
    admin_user_id: admin.userId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });

  if (error) {
    // A moderation action should not be reversed just because its audit insert
    // failed, but the failure should remain visible during development.
    console.warn('Could not write admin audit log:', error.message);
  }
}

export async function fetchAdminJobs(): Promise<AdminJob[]> {
  await requireCurrentAdmin();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Could not load jobs for admin: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title || 'Untitled Vacancy',
    companyId: row.company_id || row.contractor_id || '',
    companyName: row.company_name || 'Unknown Contractor',
    trade: row.trade || row.trade_category || '',
    location: row.location || '',
    payRate: row.pay_rate || row.day_rate || row.hourly_rate || '',
    status: (row.moderation_status || 'live') as AdminJobStatus,
    featured: Boolean(row.featured),
    createdAt: row.created_at || '',
  }));
}

export async function updateAdminJob(
  jobId: string,
  changes: Partial<Pick<AdminJob, 'status' | 'featured'>>
): Promise<void> {
  await requireCurrentAdmin();

  const payload: Record<string, unknown> = {};

  if (changes.status !== undefined) {
    payload.moderation_status = changes.status;
  }

  if (changes.featured !== undefined) {
    payload.featured = changes.featured;
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', jobId)
    .select('id, moderation_status, featured')
    .maybeSingle();

  if (error) {
    throw new Error(`Could not update job: ${error.message}`);
  }

  if (!data) {
    throw new Error('Could not update job: no matching vacancy was changed.');
  }

  await writeAdminAuditLog('job.updated', 'job', jobId, changes);
}

export async function deleteAdminJob(jobId: string): Promise<void> {
  await requireCurrentAdmin();

  const { error } = await supabase.from('jobs').delete().eq('id', jobId);

  if (error) {
    throw new Error(`Could not delete job: ${error.message}`);
  }

  await writeAdminAuditLog('job.deleted', 'job', jobId);
}

export async function fetchAdminReviews(): Promise<AdminReview[]> {
  await requireCurrentAdmin();

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Could not load reviews for admin: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    reviewerId: row.reviewer_id || '',
    reviewedUserId: row.reviewed_user_id || '',
    reviewerName: row.reviewer_name || 'Unknown User',
    reviewerRole: row.reviewer_role || '',
    rating: Number(row.rating || 0),
    reviewText: row.review_text || '',
    reported: Boolean(row.reported),
    reportReason: row.report_reason || '',
    moderated: Boolean(row.moderated),
    hidden: Boolean(row.hidden),
    createdAt: row.created_at || '',
  }));
}

export async function updateAdminReview(
  reviewId: string,
  action: 'approve' | 'hide' | 'restore' | 'delete'
): Promise<void> {
  await requireCurrentAdmin();

  if (action === 'delete') {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

    if (error) {
      throw new Error(`Could not delete review: ${error.message}`);
    }

    await writeAdminAuditLog('review.deleted', 'review', reviewId);
    return;
  }

  const payload =
    action === 'approve'
      ? {
          reported: false,
          report_reason: null,
          moderated: true,
          hidden: false,
        }
      : action === 'hide'
      ? {
          hidden: true,
          moderated: true,
        }
      : {
          hidden: false,
          moderated: true,
        };

  const { data, error } = await supabase
    .from('reviews')
    .update(payload)
    .eq('id', reviewId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`Could not moderate review: ${error.message}`);
  }

  if (!data) {
    throw new Error('Could not moderate review: no matching review was changed.');
  }

  await writeAdminAuditLog(`review.${action}`, 'review', reviewId);
}

export async function fetchAdminReports(): Promise<AdminReport[]> {
  await requireCurrentAdmin();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Could not load reports: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    reporterId: row.reporter_id || '',
    targetType: row.target_type as AdminReportTargetType,
    targetId: row.target_id || '',
    reason: row.reason || '',
    details: row.details || '',
    status: (row.status || 'open') as AdminReportStatus,
    assignedAdminId: row.assigned_admin_id || '',
    resolutionNotes: row.resolution_notes || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || row.created_at || '',
  }));
}

export async function updateAdminReport(
  reportId: string,
  status: AdminReportStatus,
  resolutionNotes = ''
): Promise<void> {
  const admin = await requireCurrentAdmin();

  const { data, error } = await supabase
    .from('reports')
    .update({
      status,
      assigned_admin_id: admin.userId,
      resolution_notes: resolutionNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`Could not update report: ${error.message}`);
  }

  if (!data) {
    throw new Error('Could not update report: no matching report was changed.');
  }

  await writeAdminAuditLog('report.status_changed', 'report', reportId, {
    status,
    resolutionNotes,
  });
}

export async function fetchAdminAuditLogs(): Promise<AdminAuditLog[]> {
  await requireCurrentAdmin();

  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Could not load audit log: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    adminUserId: row.admin_user_id || '',
    action: row.action || '',
    targetType: row.target_type || '',
    targetId: row.target_id || '',
    details: row.details || {},
    createdAt: row.created_at || '',
  }));
}

function formatAnalyticsDate(value: string): string {
  return value.slice(0, 10);
}

export async function fetchAdminAnalytics(
  days = 14
): Promise<AdminAnalyticsPoint[]> {
  await requireCurrentAdmin();

  const start = new Date();
  start.setDate(start.getDate() - Math.max(1, days - 1));
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  const [
    workerResult,
    contractorResult,
    jobsResult,
    matchesResult,
    messagesResult,
    interviewsResult,
    reviewsResult,
  ] = await Promise.all([
    supabase.from('worker_profiles').select('created_at').gte('created_at', startIso),
    supabase.from('contractor_profiles').select('created_at').gte('created_at', startIso),
    supabase.from('jobs').select('created_at').gte('created_at', startIso),
    supabase.from('matches').select('matched_at').gte('matched_at', startIso),
    supabase.from('messages').select('created_at, timestamp').gte('created_at', startIso),
    supabase.from('interviews').select('created_at').gte('created_at', startIso),
    supabase.from('reviews').select('created_at').gte('created_at', startIso),
  ]);

  const results = [
    workerResult,
    contractorResult,
    jobsResult,
    matchesResult,
    messagesResult,
    interviewsResult,
    reviewsResult,
  ];

  const firstError = results.find(result => result.error)?.error;
  if (firstError) {
    throw new Error(`Could not load analytics: ${firstError.message}`);
  }

  const points = new Map<string, AdminAnalyticsPoint>();

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);

    points.set(key, {
      date: key,
      users: 0,
      jobs: 0,
      matches: 0,
      messages: 0,
      interviews: 0,
      reviews: 0,
    });
  }

  const increment = (
    rows: any[] | null,
    field: keyof Omit<AdminAnalyticsPoint, 'date'>,
    dateKeys: string[] = ['created_at']
  ) => {
    for (const row of rows || []) {
      const rawDate = dateKeys.map(key => row[key]).find(Boolean);
      if (!rawDate) continue;

      const point = points.get(formatAnalyticsDate(rawDate));
      if (point) point[field] += 1;
    }
  };

  increment(workerResult.data, 'users');
  increment(contractorResult.data, 'users');
  increment(jobsResult.data, 'jobs');
  increment(matchesResult.data, 'matches', ['matched_at']);
  increment(messagesResult.data, 'messages', ['created_at', 'timestamp']);
  increment(interviewsResult.data, 'interviews');
  increment(reviewsResult.data, 'reviews');

  return Array.from(points.values());
}
