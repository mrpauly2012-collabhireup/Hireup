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