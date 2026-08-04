import { WorkerProfile, CompanyProfile, JobProfile, Match, Message, Interview, UserType, JobApplication, ApplicationStatus } from '../types';
import { supabase } from './client';
import { fetchAdminUser } from './admin';

export { supabase } from './client';
export * from './admin';


// SQL schema for user reference
export const SQL_MIGRATION_SCRIPT = `
-- COPY AND PASTE THIS SCRIPT INTO YOUR SUPABASE SQL EDITOR TO PROVISION THE TABLES AND RLS POLICIES INSTANTLY!

-- 1. Create contractor_profiles table
CREATE TABLE IF NOT EXISTS contractor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID,
  company_name TEXT NOT NULL,
  logo TEXT,
  cover_image TEXT,
  description TEXT,
  open_vacancies_count INTEGER DEFAULT 0,
  benefits TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  location TEXT,
  stats JSONB,
  reviews JSONB DEFAULT '[]'::jsonb,
  requirements TEXT[],
  website TEXT,
  industry TEXT,
  company_size TEXT,
  company_house_number TEXT,
  vat_number TEXT,
  insurance_status TEXT,
  phone TEXT,
  email TEXT,
  trades_hiring_for TEXT[],
  hiring_requirements TEXT[],
  company_logo_url TEXT,
  company_gallery_images TEXT[],
  verification_documents TEXT[],
  public_liability_insurance TEXT,
  employers_liability_insurance TEXT,
  business_address TEXT,
  postcode TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create worker_profiles table
CREATE TABLE IF NOT EXISTS worker_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT,
  full_name TEXT NOT NULL,
  trade TEXT,
  subcategory TEXT,
  experience TEXT,
  years_experience TEXT,
  qualifications TEXT[],
  location TEXT,
  hometown TEXT,
  availability TEXT,
  pay_rate TEXT,
  day_rate TEXT,
  rating NUMERIC(3,2) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verified_badges TEXT[],
  portfolio TEXT[],
  work_history JSONB DEFAULT '[]'::jsonb,
  tools_and_transport TEXT[],
  own_tools BOOLEAN DEFAULT FALSE,
  own_transport BOOLEAN DEFAULT FALSE,
  bio TEXT,
  about TEXT,
  reviews JSONB DEFAULT '[]'::jsonb,
  references JSONB DEFAULT '[]'::jsonb,
  phone TEXT,
  email TEXT,
  avatar TEXT,
  cover_image TEXT,
  licences TEXT[],
  position_lengths TEXT[],
  employment_preferences TEXT[],
  profile_photo_url TEXT,
  gallery_images TEXT[],
  cv_url TEXT,
  certificate_files TEXT[],
  licence_images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT 'Verified Contractor',
  company_logo TEXT,
  company_cover TEXT,
  title TEXT NOT NULL,
  description TEXT,
  trade TEXT,
  trade_category TEXT,
  subcategory TEXT,
  trade_subcategory TEXT,
  location TEXT,
  postcode TEXT DEFAULT 'BN1 1AA',
  hourly_rate TEXT,
  day_rate TEXT,
  pay_rate TEXT,
  employment_type TEXT,
  start_date TEXT,
  duration TEXT DEFAULT 'Ongoing',
  urgent BOOLEAN DEFAULT FALSE,
  qualifications TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  benefits TEXT[],
  requirements TEXT[],
  company_stats JSONB,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'viewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn')),
  note TEXT,
  viewed_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, job_id)
);

-- 5. Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  last_message_text TEXT,
  last_message_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, job_id)
);

-- 5. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender TEXT CHECK (sender IN ('worker', 'employer')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  attachment_type TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  date TEXT,
  time TEXT,
  interview_time TIMESTAMPTZ,
  location TEXT,
  meeting_link TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'declined')) DEFAULT 'pending',
  ppe_required TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create saved_items table
CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT CHECK (item_type IN ('worker', 'job', 'company')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- 8. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('worker', 'employer')),
  county TEXT,
  date_of_birth TEXT,
  travel_distance TEXT,
  notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  privacy_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  platform_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL,
  reviewed_user_id UUID NOT NULL,
  job_id UUID,
  rating NUMERIC(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT,
  reliability_rating NUMERIC(3,2),
  communication_rating NUMERIC(3,2),
  professionalism_rating NUMERIC(3,2),
  timekeeping_rating NUMERIC(3,2),
  categories JSONB DEFAULT '{}'::jsonb,
  reported BOOLEAN DEFAULT FALSE,
  report_reason TEXT,
  moderated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_user_id, job_id)
);

-- Enable RLS & Add Public Access Policies
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on contractor_profiles" ON contractor_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public write on contractor_profiles" ON contractor_profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on worker_profiles" ON worker_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public write on worker_profiles" ON worker_profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Allow public write on jobs" ON jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Workers and contractors can read applications" ON job_applications;
DROP POLICY IF EXISTS "Workers can create applications" ON job_applications;
DROP POLICY IF EXISTS "Workers can withdraw applications" ON job_applications;
DROP POLICY IF EXISTS "Contractors can update applications" ON job_applications;

CREATE POLICY "Workers and contractors can read applications"
ON job_applications FOR SELECT
TO authenticated
USING (auth.uid() = worker_id OR auth.uid() = contractor_id);

CREATE POLICY "Workers can create applications"
ON job_applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can withdraw applications"
ON job_applications FOR UPDATE
TO authenticated
USING (auth.uid() = worker_id)
WITH CHECK (auth.uid() = worker_id AND status = 'withdrawn');

CREATE POLICY "Contractors can update applications"
ON job_applications FOR UPDATE
TO authenticated
USING (auth.uid() = contractor_id)
WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Allow public read on matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public write on matches" ON matches FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow public write on messages" ON messages FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on interviews" ON interviews FOR SELECT USING (true);
CREATE POLICY "Allow public write on interviews" ON interviews FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on saved_items" ON saved_items FOR SELECT USING (true);
CREATE POLICY "Allow public write on saved_items" ON saved_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow public write on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "Users can read own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow public read on reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public write on reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);

-- Ensure all new contractor onboarding columns are present for existing deployments
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS public_liability_insurance TEXT;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS employers_liability_insurance TEXT;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS postcode TEXT;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Ensure featured jobs support exists for current deployments
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
`;

// Field Mapping Helpers
export function isValidUploadUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.startsWith('blob:')) return false;
  if (lowercaseUrl.includes('unsplash.com')) return false;
  if (lowercaseUrl.includes('placeholder')) return false;
  if (lowercaseUrl.includes('demo')) return false;
  if (lowercaseUrl.includes('stock')) return false;
  return lowercaseUrl.startsWith('http');
}

export function mapWorkerFromDb(w: any): WorkerProfile {
  const profilePhotoUrl = w.profile_photo_url && isValidUploadUrl(w.profile_photo_url) ? w.profile_photo_url : '';
  return {
    id: w.id,
    name: w.full_name || w.name || 'Anonymous Worker',
    trade: w.trade || 'General Laborer',
    subcategory: w.subcategory || '',
    experience: w.years_experience || w.experience || '1 Year',
    qualifications: w.qualifications || [],
    location: w.hometown || w.location || 'London',
    availability: w.availability || 'Immediate',
    payRate: w.day_rate || w.pay_rate || '£150/day',
    rating: w.rating !== undefined && w.rating !== null ? Number(w.rating) : null,
    reviewsCount: w.reviews_count !== undefined && w.reviews_count !== null ? Number(w.reviews_count) : 0,
    verified:
      w.verified === true ||
      w.verified_status === true ||
      w.verified_status === 'verified' ||
      w.verified_status === 'approved' ||
      w.verification_status === 'verified' ||
      w.verification_status === 'approved',
    verifiedBadges: w.verified_badges || ['HireUp Certified', 'Right to Work Verified', 'CSCS Checked'],
    portfolio: w.gallery_images || w.portfolio || [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80'
    ],
    workHistory: w.work_history || [
      {
        id: 'wh1',
        role: `Senior Tradesperson`,
        company: 'Sussex Contract Services',
        duration: '2023 - Present',
        description: `Executed first and second-fix operations on major multi-million pound residential installations.`
      }
    ],
    toolsAndTransport: w.tools_and_transport || (w.own_tools ? ['Own Hand Tools', 'Full Power Tools'] : []).concat(w.own_transport ? ['Own Commercial Van', 'UK Clean Driving Licence'] : []),
    about: w.bio || w.about || 'Fully qualified tradesperson with verified credentials and site experience.',
    reviews: w.reviews || [],
    references: w.references || [],
    phone: w.phone || '',
    email: w.email || '',
    avatar: profilePhotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    coverImage: w.cover_image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80',
    licences: w.licences || [],
    positionLengths: w.employment_preferences || w.position_lengths || [],
    profilePhotoUrl: profilePhotoUrl,
    galleryImages: w.gallery_images || w.portfolio || [],
    cvUrl: w.cv_url || '',
    certificateFiles: w.certificate_files || [],
    licenceImages: w.licence_images || []
  };
}

export function mapCompanyFromDb(c: any): CompanyProfile {
  return {
    id: c.id,
    name: c.company_name || c.name || 'Contractor Ltd',
    logo: c.company_logo_url || c.logo || 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=200&auto=format&fit=crop&q=80',
    coverImage: c.cover_image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    description: c.description || `${c.company_name || 'The contractor'} is a registered building contractor.`,
    openVacanciesCount: Number(c.open_vacancies_count || 0),
    benefits: c.benefits || [],
    verified:
      c.verified === true ||
      c.verified_status === true ||
      c.verified_status === 'verified' ||
      c.verified_status === 'approved' ||
      c.verification_status === 'verified' ||
      c.verification_status === 'approved',
    location: c.location || '',
    stats: c.stats || { projects: 0, workers: 0, rating: null },
    reviews: c.reviews || [],
    requirements: c.hiring_requirements || c.requirements || [],
    website: c.website || '',
    industry: c.industry || '',
    companySize: c.company_size || '',
    companyHouseNumber: c.company_house_number || '',
    vatNumber: c.vat_number || '',
    insuranceStatus: c.insurance_status || '',
    phone: c.phone || '',
    companyLogoUrl: c.company_logo_url || c.logo || '',
    companyGalleryImages: c.company_gallery_images || [],
    verificationDocuments: c.verification_documents || [],
    publicLiabilityInsurance: c.public_liability_insurance || '',
    employersLiabilityInsurance: c.employers_liability_insurance || '',
    businessAddress: c.business_address || '',
    postcode: c.postcode || '',
    contactName: c.contact_name || '',
    contactPhone: c.contact_phone || '',
    contactEmail: c.contact_email || ''
  };
}

export function mapJobFromDb(j: any): JobProfile {
  const mappedJob = {
    id: j.id,
    companyId: j.company_id || j.contractor_id || '',
    companyName: j.company_name || 'Verified Contractor',
    companyLogo:
      j.company_logo ||
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=100&auto=format&fit=crop&q=80',
    companyCover:
      j.company_cover ||
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    title: j.title || 'Untitled Vacancy',
    trade: j.trade || j.trade_category || '',
    subcategory: j.subcategory || j.trade_subcategory || '',
    payRate: j.pay_rate || j.day_rate || j.hourly_rate || '£200/day',
    location: j.location || '',
    postcode: j.postcode || '',
    startDate: j.start_date || '',
    duration: j.duration || 'Ongoing',
    employmentType: j.employment_type || 'Contract',
    qualifications: j.qualifications || [],
    verified: Boolean(j.verified),
    urgent: Boolean(j.urgent),
    createdAt: j.created_at || '',

    // This value is set from the Admin Dashboard.
    // Keeping it on the mapped job allows Featured Jobs to display it.
    featured: Boolean(j.featured),

    description: j.description || '',
    benefits: j.benefits || [],
    requirements: j.requirements || [],
    companyStats:
      j.company_stats || { projects: 0, workers: 0, rating: 5.0 },
  };

  // JobProfile may not yet declare `featured`, but the worker-facing
  // Featured Jobs page safely reads this runtime property.
  return mappedJob as JobProfile & { featured: boolean };
}

// Check database table connection
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('jobs').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Supabase Storage file upload helper with auto-bucket creation fallback
export async function uploadFileToStorage(bucket: string, filePath: string, file: File): Promise<string> {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (!listError && buckets) {
      const exists = buckets.some(b => b.name === bucket);
      if (!exists) {
        console.log(`Bucket "${bucket}" not found, attempting to create it...`);
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: true,
        });
        if (createError) {
          console.warn(`Could not create bucket "${bucket}":`, createError.message);
        } else {
          console.log(`Bucket "${bucket}" created successfully!`);
        }
      }
    }
  } catch (err) {
    console.warn("Error checking/creating bucket:", err);
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error(`Storage upload error to bucket "${bucket}":`, error);
    // If it is a bucket not found error, attempt explicit bucket creation one last time and retry
    if (error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('bucket')) {
      try {
        console.log(`Retrying upload after explicit bucket creation for "${bucket}"...`);
        await supabase.storage.createBucket(bucket, { public: true });
        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        if (retryError) throw retryError;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(retryData.path);
        return urlData.publicUrl;
      } catch (retryErr: any) {
        throw new Error(`Upload failed after retry: ${retryErr.message || retryErr}`);
      }
    }
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Registration functions
export async function registerWorker(
  email: string, 
  password: string, 
  profile: Omit<WorkerProfile, 'id' | 'email'>,
  addLog?: (msg: string, status: 'pending' | 'success' | 'error' | 'info') => void
) {
  console.log("Auth request sent");
  addLog?.("Auth request sent", "pending");

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error(`Auth error: ${authError.message}`);
    addLog?.(`Auth error: ${authError.message}`, "error");
    throw authError;
  }
  if (!authData.user) {
    const err = new Error('Onboarding Error: Auth registration was unsuccessful.');
    console.error(`Auth error: ${err.message}`);
    addLog?.(`Auth error: ${err.message}`, "error");
    throw err;
  }

  console.log("Auth request completed");
  addLog?.("Auth request completed", "success");

  const userId = authData.user.id;
  console.log(`Auth user ID: ${userId}`);
  addLog?.(`Auth user ID: ${userId}`, "success");

  console.log("Profile insert started");
  addLog?.("Profile insert started", "pending");

  // Create Worker Profile Record
  const { error: profileError } = await supabase.from('worker_profiles').insert({
    id: userId,
    user_id: userId,
    full_name: profile.name,
    years_experience: profile.experience,
    hometown: profile.location,
    bio: profile.about,
    qualifications: Array.isArray(profile.qualifications) ? profile.qualifications : [],
    availability: profile.availability || 'Immediate',
    phone: profile.phone || '07911 123456',
    email: email,
    licences: Array.isArray(profile.licences) ? profile.licences : [],
    employment_preferences: Array.isArray(profile.positionLengths) ? profile.positionLengths : [],
    day_rate: profile.payRate || '£150/day',
    own_tools: profile.toolsAndTransport?.some(t => t.toLowerCase().includes('tool')) ?? false,
    own_transport: profile.toolsAndTransport?.some(t => t.toLowerCase().includes('van') || t.toLowerCase().includes('licence') || t.toLowerCase().includes('driving')) ?? false,
    profile_photo_url: profile.profilePhotoUrl || profile.avatar || '',
    gallery_images: profile.galleryImages || profile.portfolio || [],
  });

  if (profileError) {
    console.error(`Profile insert error: ${profileError.message}`);
    addLog?.(`Profile insert error: ${profileError.message}`, "error");
    throw profileError;
  }

  console.log("Profile insert completed");
  addLog?.("Profile insert completed", "success");

  return { id: userId, email, userType: 'worker' as UserType, session: authData.session };
}

export async function registerContractor(
  email: string,
  password: string,
  profile: Omit<CompanyProfile, 'id'>,
  hiringRequirements: string[] = [],
  tradesHiringFor: string[] = [],
  addLog?: (msg: string, status: 'pending' | 'success' | 'error' | 'info') => void
) {
  console.log("Auth request sent");
  addLog?.("Auth request sent", "pending");

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error(`Auth error: ${authError.message}`);
    addLog?.(`Auth error: ${authError.message}`, "error");
    throw authError;
  }
  if (!authData.user) {
    const err = new Error('Onboarding Error: Auth registration was unsuccessful.');
    console.error(`Auth error: ${err.message}`);
    addLog?.(`Auth error: ${err.message}`, "error");
    throw err;
  }

  console.log("Auth request completed");
  addLog?.("Auth request completed", "success");

  const userId = authData.user.id;
  console.log(`Auth user ID: ${userId}`);
  addLog?.(`Auth user ID: ${userId}`, "success");

  console.log("Profile insert started");
  addLog?.("Profile insert started", "pending");

  // Create Contractor / Company Profile Record
  const { error: profileError } = await supabase.from('contractor_profiles').insert({
    id: userId,
    user_id: userId,
    company_name: profile.name,
    logo: profile.logo || 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=200&auto=format&fit=crop&q=80',
    hiring_requirements: Array.isArray(hiringRequirements) ? hiringRequirements : [],
    trades_hiring_for: Array.isArray(tradesHiringFor) ? tradesHiringFor : [],
    email: email,
    phone: profile.phone || '01273 900300',
    company_logo_url: profile.companyLogoUrl || profile.logo || '',
    company_gallery_images: profile.companyGalleryImages || [],
  });

  if (profileError) {
    console.error(`Profile insert error: ${profileError.message}`);
    addLog?.(`Profile insert error: ${profileError.message}`, "error");
    throw profileError;
  }

  console.log("Profile insert completed");
  addLog?.("Profile insert completed", "success");

  return { id: userId, email, userType: 'employer' as UserType, session: authData.session };
}

// Sign In function
export async function signInUser(email: string, password: string) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Invalid credentials.');

  const userId = authData.user.id;

  // Dedicated admin accounts do not require a worker or contractor profile.
  const adminUser = await fetchAdminUser(userId);
  if (adminUser) {
    return {
      id: userId,
      email: authData.user.email!,
      userType: 'employer' as UserType,
      isAdmin: true,
      adminRole: adminUser.role,
    };
  }

  // Check if profile exists in worker_profiles (using id or user_id)
  const { data: workerData } = await supabase
    .from('worker_profiles')
    .select('id, user_id')
    .or(`id.eq.${userId},user_id.eq.${userId}`)
    .maybeSingle();

  if (workerData) {
    return { id: userId, email: authData.user.email!, userType: 'worker' as UserType };
  }

  // Check if profile exists in contractor_profiles (using id or user_id)
  const { data: contractorData } = await supabase
    .from('contractor_profiles')
    .select('id, user_id')
    .or(`id.eq.${userId},user_id.eq.${userId}`)
    .maybeSingle();

  if (contractorData) {
    return { id: userId, email: authData.user.email!, userType: 'employer' as UserType };
  }

  throw new Error(
    'Your authenticated account does not have a worker or contractor profile. Please complete registration or contact support.'
  );
}

// Sign Out function
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Fetch lists
export async function fetchWorkers(): Promise<WorkerProfile[]> {
  const { data, error } = await supabase.from('worker_profiles').select('*');
  if (error) {
    console.warn("Could not load worker profiles from Supabase:", error.message);
    return [];
  }
  return (data || []).map(mapWorkerFromDb);
}

export async function fetchCompanies(): Promise<CompanyProfile[]> {
  const { data, error } = await supabase.from('contractor_profiles').select('*');
  if (error) {
    console.warn("Could not load company profiles from Supabase:", error.message);
    return [];
  }
  return (data || []).map(mapCompanyFromDb);
}

export async function fetchJobs(): Promise<JobProfile[]> {
  const { data, error } = await supabase.from('jobs').select('*');
  if (error) {
    console.warn("Could not load jobs from Supabase:", error.message);
    return [];
  }
  return (data || []).map(mapJobFromDb);
}


export function createJobSeoSlug(job: JobProfile): string {
  const base = `${job.title}-${job.location}`
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || `construction-job-${job.id.slice(0, 8)}`;
}

export async function fetchPublicJobs(): Promise<JobProfile[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Could not load public jobs from Supabase:', error.message);
    return [];
  }

  return (data || []).map(mapJobFromDb);
}

export async function fetchPublicJobBySlug(
  slug: string
): Promise<JobProfile | null> {
  const jobs = await fetchPublicJobs();

  return (
    jobs.find(job => createJobSeoSlug(job) === slug) ||
    jobs.find(job => job.id === slug) ||
    null
  );
}

export function mapApplicationFromDb(application: any): JobApplication {
  return {
    id: application.id,
    workerId: application.worker_id,
    contractorId: application.contractor_id,
    jobId: application.job_id,
    status: application.status as ApplicationStatus,
    appliedAt: application.applied_at,
    updatedAt: application.updated_at,
    viewedAt: application.viewed_at || undefined,
    withdrawnAt: application.withdrawn_at || undefined,
    note: application.note || undefined,
  };
}

export async function fetchApplications(
  userId: string,
  userType: UserType
): Promise<JobApplication[]> {
  const column = userType === 'worker' ? 'worker_id' : 'contractor_id';

  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq(column, userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('Could not load job applications:', error.message);
    return [];
  }

  return (data || []).map(mapApplicationFromDb);
}

export async function createApplicationInDb(
  workerId: string,
  jobId: string
): Promise<JobApplication | null> {
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, company_id, contractor_id')
    .eq('id', jobId)
    .maybeSingle();

  if (jobError || !job) {
    console.warn(
      'Could not resolve the job before creating an application:',
      jobError?.message || 'Job not found'
    );
    return null;
  }

  const contractorId = job.company_id || job.contractor_id;
  if (!contractorId) return null;

  const { data, error } = await supabase
    .from('job_applications')
    .upsert(
      {
        worker_id: workerId,
        contractor_id: contractorId,
        job_id: jobId,
        status: 'applied',
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'worker_id,job_id',
        ignoreDuplicates: true,
      }
    )
    .select('*')
    .maybeSingle();

  if (error) {
    console.warn('Could not create job application:', error.message);
    return null;
  }

  return data ? mapApplicationFromDb(data) : null;
}

export async function updateApplicationStatusInDb(
  applicationId: string,
  status: ApplicationStatus,
  note?: string
): Promise<JobApplication> {
  const update: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (note !== undefined) update.note = note;
  if (status === 'viewed') update.viewed_at = new Date().toISOString();
  if (status === 'withdrawn') update.withdrawn_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('job_applications')
    .update(update)
    .eq('id', applicationId)
    .select('*')
    .single();

  if (error) throw error;
  return mapApplicationFromDb(data);
}

export async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await supabase.from('matches').select('*').order('matched_at', { ascending: false });
  if (error) {
    console.warn("Could not load matches from Supabase:", error.message);
    return [];
  }
  return (data || []).map((m: any) => ({
    id: m.id,
    workerId: m.worker_id,
    jobId: m.job_id,
    matchedAt: m.matched_at,
    lastMessageText: m.last_message_text,
    lastMessageTime: m.last_message_time,
    status: m.status || 'active',
    contractorId: m.contractor_id,
  }));
}

export async function markMessagesAsReadForUser(
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({
      read: true,
      is_read: true,
    })
    .eq('recipient_id', userId)
    .eq('read', false);

  if (error) {
    throw error;
  }
}


export async function markMessagesAsReadForMatch(
  matchId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({
      read: true,
      is_read: true,
    })
    .eq('match_id', matchId)
    .eq('recipient_id', userId)
    .or('read.eq.false,is_read.eq.false');

  if (error) {
    throw error;
  }
}


export async function fetchMessages(matchId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('timestamp', { ascending: true });
  if (error) {
    console.warn(`Could not load messages for match ${matchId} from Supabase:`, error.message);
    return [];
  }
  return (data || []).map((msg: any) => ({
    id: msg.id,
    matchId: msg.match_id,
    sender: msg.sender,
    text: msg.message || msg.text || '',
    timestamp: msg.created_at || msg.timestamp,
    isRead:
      msg.read !== undefined
        ? Boolean(msg.read)
        : Boolean(msg.is_read),
    attachmentType: msg.attachment_type,
    attachmentName: msg.attachment_name,
  }));
}

export async function fetchMessagesForMatches(matchIds: string[]): Promise<Message[]> {
  if (!matchIds || matchIds.length === 0) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .in('match_id', matchIds)
    .order('timestamp', { ascending: true });
  if (error) {
    console.warn("Could not load messages for matches:", error.message);
    return [];
  }
  return (data || []).map((msg: any) => ({
    id: msg.id,
    matchId: msg.match_id,
    sender: msg.sender,
    text: msg.message || msg.text || '',
    timestamp: msg.created_at || msg.timestamp,
    isRead:
      msg.read !== undefined
        ? Boolean(msg.read)
        : Boolean(msg.is_read),
    attachmentType: msg.attachment_type,
    attachmentName: msg.attachment_name,
  }));
}

export async function fetchInterviews(): Promise<Interview[]> {
  const { data, error } = await supabase.from('interviews').select('*');
  if (error) {
    console.warn("Could not load interviews from Supabase:", error.message);
    return [];
  }
  return (data || []).map((i: any) => ({
    id: i.id,
    workerId: i.worker_id,
    jobId: i.job_id,
    date: i.date,
    time: i.time,
    location: i.location,
    meetingLink: i.meeting_link || '',
    status: i.status,
    ppeRequired: i.ppe_required || [],
    notes: i.notes || '',
  }));
}

// Create/Update helpers
export async function createJobInDb(job: Omit<JobProfile, 'id'>): Promise<JobProfile> {
  const { data, error } = await supabase.from('jobs').insert({
    company_id: job.companyId,
    contractor_id: job.companyId,
    company_name: job.companyName,
    company_logo: job.companyLogo,
    company_cover: job.companyCover,
    title: job.title,
    trade: job.trade,
    trade_category: job.trade,
    subcategory: job.subcategory,
    trade_subcategory: job.subcategory,
    pay_rate: job.payRate,
    day_rate: job.payRate?.includes('day') ? job.payRate : null,
    hourly_rate: job.payRate?.includes('hour') ? job.payRate : null,
    location: job.location,
    postcode: 'BN1 1AA',
    start_date: job.startDate?.trim() ? job.startDate : null,
    duration: job.duration,
    employment_type: job.employmentType,
    qualifications: job.qualifications,
    verified: job.verified,
    description: job.description,
    benefits: job.benefits,
    requirements: job.requirements,
    company_stats: job.companyStats,
    urgent:
      job.title?.toLowerCase().includes('urgent') ||
      job.description?.toLowerCase().includes('urgent') ||
      false,

    // New jobs are not featured until an admin promotes them.
    featured: Boolean(
      (job as JobProfile & { featured?: boolean }).featured
    ),
  }).select('*').single();

  if (error) throw error;
  return mapJobFromDb(data);
}

export async function createMatchInDb(
  workerId: string,
  jobId: string | null,
  explicitContractorId?: string
): Promise<Match> {
  let contractorId: string | null = explicitContractorId || null;

  if (!contractorId && jobId) {
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('contractor_id, company_id')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError) throw jobError;
    contractorId = jobData?.contractor_id || jobData?.company_id || null;
  }

  if (!contractorId) {
    throw new Error('Could not resolve contractor for this match.');
  }

  let duplicateQuery = supabase
    .from('matches')
    .select('*')
    .eq('worker_id', workerId)
    .eq('contractor_id', contractorId);

  duplicateQuery = jobId
    ? duplicateQuery.eq('job_id', jobId)
    : duplicateQuery.is('job_id', null);

  const { data: existingMatches, error: duplicateError } = await duplicateQuery.limit(1);
  if (duplicateError) throw duplicateError;

  if (existingMatches && existingMatches.length > 0) {
    const match = existingMatches[0];
    return {
      id: match.id,
      workerId: match.worker_id,
      jobId: match.job_id || '',
      matchedAt: match.matched_at,
      lastMessageText: match.last_message_text,
      lastMessageTime: match.last_message_time,
      status: match.status || 'active',
      contractorId: match.contractor_id,
    };
  }

  const { data, error } = await supabase
    .from('matches')
    .insert({
      worker_id: workerId,
      contractor_id: contractorId,
      job_id: jobId,
      status: 'active',
      matched_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;

  const introText =
    'Match unlocked! Discuss trade availability, qualifications, and possible site walkthroughs.';

  const { error: messageError } = await supabase.from('messages').insert({
    match_id: data.id,
    sender: 'employer',
    sender_id: contractorId,
    recipient_id: workerId,
    text: introText,
    message: introText,
    is_read: false,
    read: false,
  });

  if (messageError) {
    console.warn('Match created, but intro message could not be added:', messageError.message);
  }

  return {
    id: data.id,
    workerId: data.worker_id,
    jobId: data.job_id || '',
    matchedAt: data.matched_at,
    lastMessageText: introText,
    lastMessageTime: 'Just now',
    status: data.status || 'active',
    contractorId: data.contractor_id,
  };
}

// Saved Items live Supabase functions
export interface SavedItem {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'worker' | 'job' | 'company';
  createdAt: string;
}

export async function fetchSavedItems(userId: string): Promise<SavedItem[]> {
  try {
    const { data, error } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.warn("Could not load saved items from Supabase:", error.message);
      return [];
    }
    return (data || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      itemId: item.item_id,
      itemType: item.item_type,
      createdAt: item.created_at
    }));
  } catch (err: any) {
    console.warn("fetchSavedItems error:", err.message);
    return [];
  }
}

export async function saveItemInDb(userId: string, itemId: string, itemType: 'worker' | 'job' | 'company'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('saved_items')
      .upsert({
        user_id: userId,
        item_id: itemId,
        item_type: itemType
      }, { onConflict: 'user_id,item_id' });
    if (error) {
      console.warn("Could not save item to Supabase:", error.message);
      return false;
    }

    if (itemType === 'job') {
      await createApplicationInDb(userId, itemId);
    }

    return true;
  } catch (err: any) {
    console.warn("saveItemInDb error:", err.message);
    return false;
  }
}

export async function deleteSavedItemFromDb(userId: string, itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId);
    if (error) {
      console.warn("Could not delete saved item from Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("deleteSavedItemFromDb error:", err.message);
    return false;
  }
}


export interface UserSettingsRecord {
  userId: string;
  accountType: UserType;
  county: string;
  dateOfBirth: string;
  travelDistance: string;
  notifications: {
    matchNotifications: boolean;
    messageNotifications: boolean;
    interviewNotifications: boolean;
    jobNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    twoFactorEnabled: boolean;
    profileVisibility: 'public' | 'verified' | 'private';
    showInSearch: boolean;
    showOnlineStatus: boolean;
    allowDirectContact: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    distanceUnit: 'miles' | 'kilometres';
    dateFormat: string;
    timeFormat: string;
    searchRadius: string;
    matchSensitivity: string;
  };
  updatedAt?: string;
}

export async function fetchUserSettings(
  userId: string
): Promise<UserSettingsRecord | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (
      error.message?.toLowerCase().includes('user_settings') ||
      error.message?.toLowerCase().includes('does not exist')
    ) {
      console.warn(
        'The user_settings table has not been created yet. Run the supplied SQL migration.'
      );
      return null;
    }

    throw error;
  }

  if (!data) return null;

  return {
    userId: data.user_id,
    accountType: data.account_type as UserType,
    county: data.county || '',
    dateOfBirth: data.date_of_birth || '',
    travelDistance: data.travel_distance || '',
    notifications: {
      matchNotifications:
        data.notification_preferences?.matchNotifications ?? true,
      messageNotifications:
        data.notification_preferences?.messageNotifications ?? true,
      interviewNotifications:
        data.notification_preferences?.interviewNotifications ?? true,
      jobNotifications:
        data.notification_preferences?.jobNotifications ?? true,
      pushNotifications:
        data.notification_preferences?.pushNotifications ?? true,
      smsNotifications:
        data.notification_preferences?.smsNotifications ?? false,
      weeklyReports:
        data.notification_preferences?.weeklyReports ?? false,
      marketingEmails:
        data.notification_preferences?.marketingEmails ?? false,
    },
    privacy: {
      twoFactorEnabled:
        data.privacy_preferences?.twoFactorEnabled ?? false,
      profileVisibility:
        data.privacy_preferences?.profileVisibility || 'public',
      showInSearch:
        data.privacy_preferences?.showInSearch ?? true,
      showOnlineStatus:
        data.privacy_preferences?.showOnlineStatus ?? true,
      allowDirectContact:
        data.privacy_preferences?.allowDirectContact ?? true,
    },
    preferences: {
      theme: data.platform_preferences?.theme || 'light',
      language: data.platform_preferences?.language || 'English',
      distanceUnit:
        data.platform_preferences?.distanceUnit || 'miles',
      dateFormat:
        data.platform_preferences?.dateFormat || 'DD/MM/YYYY',
      timeFormat:
        data.platform_preferences?.timeFormat || '24 hour',
      searchRadius:
        data.platform_preferences?.searchRadius || '25',
      matchSensitivity:
        data.platform_preferences?.matchSensitivity || 'balanced',
    },
    updatedAt: data.updated_at || '',
  };
}

export async function saveUserSettings(
  settings: UserSettingsRecord
): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: settings.userId,
        account_type: settings.accountType,
        county: settings.county || null,
        date_of_birth: settings.dateOfBirth || null,
        travel_distance: settings.travelDistance || null,
        notification_preferences: settings.notifications,
        privacy_preferences: settings.privacy,
        platform_preferences: settings.preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    if (
      error.message?.toLowerCase().includes('user_settings') ||
      error.message?.toLowerCase().includes('does not exist')
    ) {
      throw new Error(
        'The user_settings table is missing. Run the supplied Supabase SQL migration first.'
      );
    }

    throw error;
  }
}

// Notifications live Supabase functions
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn("Could not load notifications from Supabase:", error.message);
      return [];
    }
    return (data || []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.body || n.message || '',
      isRead: n.read !== undefined ? n.read : (n.is_read !== undefined ? n.is_read : false),
      createdAt: n.created_at
    }));
  } catch (err: any) {
    console.warn("fetchNotifications error:", err.message);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      is_read: true
    })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      is_read: true
    })
    .eq('user_id', userId);

  if (error) throw error;
}

export async function createNotificationInDb(
  userId: string,
  title: string,
  message: string,
  options?: {
    type?: string;
    url?: string;
    tag?: string;
  }
): Promise<AppNotification | null> {
  try {
    const type = options?.type || 'info';

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        body: message,
        type,
        read: false,
        is_read: false,
      })
      .select('*')
      .single();

    if (error) {
      console.warn(
        'Could not create notification in Supabase:',
        error.message
      );
      return null;
    }

    try {
      const { error: pushError } = await supabase.functions.invoke(
        'send-push',
        {
          body: {
            userId,
            title,
            body: message,
            type,
            url: options?.url || '/',
            tag: options?.tag || `hireup-${data.id}`,
          },
        }
      );

      if (pushError) {
        console.warn(
          'Notification saved, but push delivery failed:',
          pushError.message
        );
      }
    } catch (pushError: any) {
      console.warn(
        'Notification saved, but send-push could not be called:',
        pushError?.message || String(pushError)
      );
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      message: data.body || data.message,
      isRead:
        data.read !== undefined
          ? data.read
          : data.is_read,
      createdAt: data.created_at,
    };
  } catch (err: any) {
    console.warn(
      'createNotificationInDb error:',
      err.message
    );
    return null;
  }
}


export async function sendMessageInDb(matchId: string, sender: 'worker' | 'employer', text: string, attachmentType?: string, attachmentName?: string): Promise<Message> {
  let workerId = null;
  let contractorId = null;
  try {
    const { data: matchData } = await supabase.from('matches').select('worker_id, contractor_id').eq('id', matchId).maybeSingle();
    if (matchData) {
      workerId = matchData.worker_id;
      contractorId = matchData.contractor_id;
    }
  } catch (err) {
    console.warn("Could not retrieve match details for message insert:", err);
  }

  const senderId = sender === 'worker' ? workerId : contractorId;
  const recipientId = sender === 'worker' ? contractorId : workerId;

  const { data, error } = await supabase.from('messages').insert({
    match_id: matchId,
    sender,
    sender_id: senderId,
    recipient_id: recipientId,
    text,
    message: text,
    is_read: false,
    read: false,
    attachment_type: attachmentType,
    attachment_name: attachmentName,
  }).select('*').single();

  if (error) throw error;

  // Update match summary text
  await supabase.from('matches').update({
    last_message_text: text,
    last_message_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }).eq('id', matchId);

  return {
    id: data.id,
    matchId: data.match_id,
    sender: data.sender || (data.sender_id === workerId ? 'worker' : 'employer'),
    text: data.message || data.text,
    timestamp: data.created_at || data.timestamp,
    isRead: data.read !== undefined ? data.read : data.is_read,
    attachmentType: data.attachment_type,
    attachmentName: data.attachment_name,
  };
}

const createInterviewRoomName = (interview: Omit<Interview, 'id'>) => {
  const source = [
    'HireUpInterview',
    interview.workerId,
    interview.jobId,
    interview.date,
    interview.time,
  ].join('-');

  return source.replace(/[^a-zA-Z0-9]/g, '').slice(0, 120);
};

export async function createInterviewInDb(
  interview: Omit<Interview, 'id'>
): Promise<Interview> {
  let contractorId: string | null = null;

  try {
    const { data: jobData } = await supabase
      .from('jobs')
      .select('contractor_id, company_id')
      .eq('id', interview.jobId)
      .maybeSingle();

    if (jobData) {
      contractorId = jobData.contractor_id || jobData.company_id;
    }
  } catch (err) {
    console.warn('Could not find job contractor id:', err);
  }

  const meetingLink =
    interview.meetingLink ||
    `https://meet.jit.si/${createInterviewRoomName(interview)}`;

  const { data, error } = await supabase
    .from('interviews')
    .insert({
      worker_id: interview.workerId,
      contractor_id: contractorId,
      job_id: interview.jobId,
      date: interview.date,
      time: interview.time,
      interview_time:
        interview.date && interview.time
          ? `${interview.date}T${interview.time}:00Z`
          : null,
      location: interview.location,
      meeting_link: meetingLink,
      status: interview.status,
      ppe_required: interview.ppeRequired,
      notes: interview.notes,
    })
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    workerId: data.worker_id,
    jobId: data.job_id,
    date: data.date,
    time: data.time,
    location: data.location || 'Online video interview',
    meetingLink: data.meeting_link || meetingLink,
    status: data.status,
    ppeRequired: data.ppe_required || [],
    notes: data.notes || '',
  };
}

export async function updateInterviewStatusInDb(id: string, status: string) {
  const { error } = await supabase.from('interviews').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function updateWorkerProfileInDb(id: string, profile: WorkerProfile, photoChanged: boolean = false) {
  const updateData: any = {
    full_name: profile.name,
    trade: profile.trade,
    subcategory: profile.subcategory || '',
    years_experience: profile.experience,
    hometown: profile.location,
    bio: profile.about,
    qualifications: profile.qualifications,
    availability: profile.availability,
    phone: profile.phone,
    licences: profile.licences,
    employment_preferences: profile.positionLengths,
    day_rate: profile.payRate,
    own_tools: profile.toolsAndTransport?.some(t => t.toLowerCase().includes('tool')) ?? false,
    own_transport: profile.toolsAndTransport?.some(t => t.toLowerCase().includes('van') || t.toLowerCase().includes('licence') || t.toLowerCase().includes('driving')) ?? false,
    cover_image: profile.coverImage,
    portfolio: profile.portfolio,
    gallery_images: profile.galleryImages || profile.portfolio,
    cv_url: profile.cvUrl,
    certificate_files: profile.certificateFiles,
    licence_images: profile.licenceImages,
  };

  if (photoChanged) {
    if (!profile.profilePhotoUrl || profile.profilePhotoUrl === '') {
      updateData.profile_photo_url = null;
    } else if (isValidUploadUrl(profile.profilePhotoUrl)) {
      updateData.profile_photo_url = profile.profilePhotoUrl;
    }
  }

  const { error } = await supabase.from('worker_profiles').update(updateData).eq('id', id);

  if (error) throw error;
}

export async function updateCompanyProfileInDb(id: string, profile: CompanyProfile) {
  const { error } = await supabase.from('contractor_profiles').update({
    company_name: profile.name,
    logo: profile.logo,
    cover_image: profile.coverImage,
    description: profile.description,
    location: profile.location,
    website: profile.website,
    industry: profile.industry,
    company_size: profile.companySize,
    company_house_number: profile.companyHouseNumber,
    vat_number: profile.vatNumber,
    insurance_status: profile.insuranceStatus,
    hiring_requirements: profile.requirements,
    phone: profile.phone,
    company_logo_url: profile.companyLogoUrl || profile.logo,
    company_gallery_images: profile.companyGalleryImages || [],
    verification_documents: profile.verificationDocuments || [],
    public_liability_insurance: profile.publicLiabilityInsurance,
    employers_liability_insurance: profile.employersLiabilityInsurance,
    business_address: profile.businessAddress,
    postcode: profile.postcode,
    contact_name: profile.contactName,
    contact_phone: profile.contactPhone,
    contact_email: profile.contactEmail
  }).eq('id', id);

  if (error) throw error;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewedUserId: string;
  jobId: string;
  rating: number;
  reviewText: string;
  reviewerName: string;
  reviewerRole: string;
  categories: Record<string, number>;
  reported: boolean;
  reportReason?: string;
  moderated: boolean;
  createdAt: string;
}

export async function fetchReviewsFromDb(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn("Could not load reviews from Supabase:", error.message);
    return [];
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    reviewerId: r.reviewer_id,
    reviewedUserId: r.reviewed_user_id,
    jobId: r.job_id,
    rating: Number(r.rating),
    reviewText: r.review_text,
    reviewerName: r.reviewer_name,
    reviewerRole: r.reviewer_role,
    categories: r.categories || {},
    reported: r.reported || false,
    reportReason: r.report_reason,
    moderated: r.moderated || false,
    createdAt: r.created_at || r.timestamp,
  }));
}

export async function createReviewInDb(
  reviewerId: string,
  reviewedUserId: string,
  jobId: string,
  rating: number,
  reviewText: string,
  categories: Record<string, number>,
  reviewerName: string,
  reviewerRole: string
): Promise<Review> {
  // Prevent duplicate reviews: check if review already exists
  const existingReviews = await fetchReviewsFromDb();
  const duplicate = existingReviews.find(r => r.reviewerId === reviewerId && r.reviewedUserId === reviewedUserId && r.jobId === jobId);
  if (duplicate) {
    throw new Error("One review per completed job. No duplicate reviews allowed.");
  }

  const newReviewObj: any = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rev_${Date.now()}`,
    reviewer_id: reviewerId,
    reviewed_user_id: reviewedUserId,
    job_id: jobId,
    rating: rating,
    review_text: reviewText,
    reviewer_name: reviewerName,
    reviewer_role: reviewerRole,
    reliability_rating: categories.reliability || categories.reliability_rating || null,
    communication_rating: categories.communication || categories.communication_rating || null,
    professionalism_rating: categories.professionalism || categories.professionalism_rating || null,
    timekeeping_rating: categories.timekeeping || categories.timekeeping_rating || null,
    categories: categories,
    reported: false,
    moderated: false,
    created_at: new Date().toISOString()
  };

  try {
    let { data, error } = await supabase
      .from('reviews')
      .insert(newReviewObj)
      .select('*')
      .single();

    if (error) {
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn("Missing ratings columns in reviews table, retrying insert with standard columns only.");
        const standardReviewObj = { ...newReviewObj };
        delete standardReviewObj.reliability_rating;
        delete standardReviewObj.communication_rating;
        delete standardReviewObj.professionalism_rating;
        delete standardReviewObj.timekeeping_rating;

        const retryResult = await supabase
          .from('reviews')
          .insert(standardReviewObj)
          .select('*')
          .single();

        if (retryResult.error) {
          throw retryResult.error;
        }
        data = retryResult.data;
      } else {
        throw error;
      }
    }

    // Success in real reviews table. Let us also sync to JSONB field on profile for complete stability
    await syncReviewToProfile(reviewedUserId, {
      id: data.id,
      reviewer: reviewerName,
      role: reviewerRole,
      rating: Number(rating),
      text: reviewText,
      date: new Date().toISOString().split('T')[0]
    }, rating);

    return {
      id: data.id,
      reviewerId: data.reviewer_id,
      reviewedUserId: data.reviewed_user_id,
      jobId: data.job_id,
      rating: Number(data.rating),
      reviewText: data.review_text,
      reviewerName: data.reviewer_name,
      reviewerRole: data.reviewer_role,
      categories: data.categories || {},
      reported: data.reported || false,
      moderated: data.moderated || false,
      createdAt: data.created_at,
    };
  } catch (err: any) {
    console.error("Review insert failed:", err.message);
    throw err;
  }
}

async function syncReviewToProfile(userId: string, reviewItem: any, newRatingValue: number) {
  try {
    // 1. Check if it is a worker
    const { data: worker, error: wErr } = await supabase.from('worker_profiles').select('*').eq('id', userId).single();
    if (!wErr && worker) {
      const existingReviews = Array.isArray(worker.reviews) ? worker.reviews : [];
      // Prevent duplicates in JSONB as well
      if (existingReviews.some((r: any) => r.id === reviewItem.id || (r.reviewer === reviewItem.reviewer && r.text === reviewItem.text))) {
        return;
      }
      const updatedReviews = [...existingReviews, reviewItem];
      const newCount = updatedReviews.length;
      const totalRating = updatedReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 5.0), 0);
      const newAverage = Number((totalRating / newCount).toFixed(2));

      await supabase.from('worker_profiles').update({
        reviews: updatedReviews,
        reviews_count: newCount,
        rating: newAverage
      }).eq('id', userId);
      return;
    }

    // 2. Otherwise try contractor
    const { data: contractor, error: cErr } = await supabase.from('contractor_profiles').select('*').eq('id', userId).single();
    if (!cErr && contractor) {
      const existingReviews = Array.isArray(contractor.reviews) ? contractor.reviews : [];
      if (existingReviews.some((r: any) => r.id === reviewItem.id || (r.reviewer === reviewItem.reviewer && r.text === reviewItem.text))) {
        return;
      }
      const updatedReviews = [...existingReviews, reviewItem];
      const newCount = updatedReviews.length;
      const totalRating = updatedReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 5.0), 0);
      const newAverage = Number((totalRating / newCount).toFixed(2));

      const oldStats = contractor.stats || { projects: 12, workers: 30, rating: 4.8 };
      await supabase.from('contractor_profiles').update({
        reviews: updatedReviews,
        stats: {
          ...oldStats,
          rating: newAverage
        }
      }).eq('id', userId);
    }
  } catch (err: any) {
    console.warn("Could not sync review to profiles column:", err.message);
  }
}

export async function reportReviewInDb(reviewId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ reported: true, report_reason: reason })
    .eq('id', reviewId);

  if (error) throw error;
}

export async function moderateReviewInDb(
  reviewId: string,
  action: 'approve' | 'delete'
): Promise<void> {
  if (action === 'delete') {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      reported: false,
      report_reason: null,
      moderated: true
    })
    .eq('id', reviewId);

  if (error) throw errogr;
}

// ============================================================================
// ADMIN DASHBOARD HELPERS
// ============================================================================

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

// ============================================================================
// PUBLIC SEO HELPERS
// ============================================================================

export function createSeoSlug(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function fetchPublicCompanies(): Promise<CompanyProfile[]> {
  const { data, error } = await supabase
    .from('contractor_profiles')
    .select('*')
    .order('company_name', { ascending: true });

  if (error) {
    console.warn('Could not load public companies:', error.message);
    return [];
  }

  return (data || []).map(mapCompanyFromDb).filter(company => {
    const publicProfile = (company as CompanyProfile & {
      publicProfile?: boolean;
    }).publicProfile;

    return publicProfile !== false;
  });
}

export async function fetchPublicCompanyBySlug(
  slug: string
): Promise<CompanyProfile | null> {
  const companies = await fetchPublicCompanies();

  return (
    companies.find(company => {
      const seoSlug = (company as CompanyProfile & {
        seoSlug?: string;
      }).seoSlug;

      return seoSlug === slug;
    }) ||
    companies.find(company => createSeoSlug(company.name) === slug) ||
    null
  );
}

export async function fetchPublicWorkers(): Promise<WorkerProfile[]> {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('public_profile', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('Could not load public workers:', error.message);
    return [];
  }

  return (data || []).map(mapWorkerFromDb);
}

export async function fetchPublicWorkerBySlug(
  slug: string
): Promise<WorkerProfile | null> {
  const workers = await fetchPublicWorkers();

  return (
    workers.find(worker => {
      const seoSlug = (worker as WorkerProfile & {
        seoSlug?: string;
      }).seoSlug;

      return seoSlug === slug;
    }) ||
    workers.find(
      worker =>
        createSeoSlug(
          `${worker.name}-${worker.trade}-${worker.location}`
        ) === slug
    ) ||
    null
  );
}