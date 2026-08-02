import { createClient } from '@supabase/supabase-js';
import { WorkerProfile, CompanyProfile, JobProfile, Match, Message, Interview, UserType } from '../types';
import { INITIAL_COMPANIES, INITIAL_JOBS, INITIAL_WORKERS, INITIAL_MATCHES, INITIAL_MESSAGES, INITIAL_INTERVIEWS } from '../data';

// Supabase Connection details
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ewtikkoghisdpumiigwg.supabase.co';
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_a72uPSgjCKudGCBXCuZonA_wJahJYRN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Static UUIDs for Seed Data to maintain relational integrity in Supabase
export const SEED_IDS = {
  company1: '11111111-1111-1111-1111-111111111111',
  company2: '22222222-2222-2222-2222-222222222222',
  company3: '33333333-3333-3333-3333-333333333333',
  job1: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  job2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  job3: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  worker1: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  worker2: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  worker3: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
};

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create matches table
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

-- 9. Create reviews table
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
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on contractor_profiles" ON contractor_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public write on contractor_profiles" ON contractor_profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on worker_profiles" ON worker_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public write on worker_profiles" ON worker_profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Allow public write on jobs" ON jobs FOR ALL USING (true) WITH CHECK (true);

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
    verified: w.verified !== undefined ? Boolean(w.verified) : true,
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
    verified: c.verified !== undefined ? Boolean(c.verified) : false,
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
  return {
    id: j.id,
    companyId: j.company_id,
    companyName: j.company_name,
    companyLogo: j.company_logo || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=100&auto=format&fit=crop&q=80',
    companyCover: j.company_cover || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    title: j.title,
    trade: j.trade,
    subcategory: j.subcategory || '',
    payRate: j.pay_rate || '£200/day',
    location: j.location,
    startDate: j.start_date || '',
    duration: j.duration || 'Ongoing',
    employmentType: j.employment_type || 'Contract',
    qualifications: j.qualifications || [],
    verified: Boolean(j.verified),
    description: j.description || '',
    benefits: j.benefits || [],
    requirements: j.requirements || [],
    companyStats: j.company_stats || { projects: 0, workers: 0, rating: 5.0 }
  };
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

  // If no profile yet, return default worker and allow profile creation
  return { id: userId, email: authData.user.email!, userType: 'worker' as UserType };
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
    text: msg.text,
    timestamp: msg.timestamp,
    isRead: msg.is_read,
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
    text: msg.text,
    timestamp: msg.timestamp,
    isRead: msg.is_read,
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
    start_date: job.startDate,
    duration: job.duration,
    employment_type: job.employmentType,
    qualifications: job.qualifications,
    verified: job.verified,
    description: job.description,
    benefits: job.benefits,
    requirements: job.requirements,
    company_stats: job.companyStats,
    urgent: job.title?.toLowerCase().includes('urgent') || job.description?.toLowerCase().includes('urgent') || false,
  }).select('*').single();

  if (error) throw error;
  return mapJobFromDb(data);
}

export async function createMatchInDb(workerId: string, jobId: string): Promise<Match> {
  // Prevent duplicate matches
  try {
    const { data: existingMatches, error: queryError } = await supabase
      .from('matches')
      .select('*')
      .eq('worker_id', workerId)
      .eq('job_id', jobId);
      
    if (!queryError && existingMatches && existingMatches.length > 0) {
      const match = existingMatches[0];
      return {
        id: match.id,
        workerId: match.worker_id,
        jobId: match.job_id,
        matchedAt: match.matched_at,
        lastMessageText: match.last_message_text,
        lastMessageTime: match.last_message_time,
      };
    }
  } catch (err) {
    console.warn("Error checking for duplicate matches:", err);
  }

  // Fetch job details to get contractor_id
  let contractorId = null;
  try {
    const { data: jobData } = await supabase.from('jobs').select('contractor_id, company_id').eq('id', jobId).maybeSingle();
    if (jobData) {
      contractorId = jobData.contractor_id || jobData.company_id;
    }
  } catch (err) {
    console.warn("Error resolving contractor_id for match:", err);
  }

  const { data, error } = await supabase.from('matches').insert({
    worker_id: workerId,
    job_id: jobId,
    contractor_id: contractorId,
    status: 'active',
    last_message_text: "You matched! Say hello and discuss site details.",
    last_message_time: "Just now"
  }).select('*').single();

  if (error) throw error;

  // Insert automatic intro message
  await supabase.from('messages').insert({
    match_id: data.id,
    sender: 'employer',
    sender_id: contractorId,
    recipient_id: workerId,
    text: "Automatic system dispatch: Match unlocked! Discuss trade availability, CSCS clearances, or propose walkthrough slots.",
    message: "Automatic system dispatch: Match unlocked! Discuss trade availability, CSCS clearances, or propose walkthrough slots."
  });

  return {
    id: data.id,
    workerId: data.worker_id,
    jobId: data.job_id,
    matchedAt: data.matched_at,
    lastMessageText: data.last_message_text,
    lastMessageTime: data.last_message_time,
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

export async function createNotificationInDb(userId: string, title: string, message: string): Promise<AppNotification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        body: message,
        type: 'info',
        read: false,
        is_read: false
      }).select('*').single();
    if (error) {
      console.warn("Could not create notification in Supabase:", error.message);
      return null;
    }
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      message: data.body || data.message,
      isRead: data.read !== undefined ? data.read : data.is_read,
      createdAt: data.created_at
    };
  } catch (err: any) {
    console.warn("createNotificationInDb error:", err.message);
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

export async function createInterviewInDb(interview: Omit<Interview, 'id'>): Promise<Interview> {
  // Try to find contractor_id from job_id
  let contractorId = null;
  try {
    const { data: jobData } = await supabase.from('jobs').select('contractor_id, company_id').eq('id', interview.jobId).maybeSingle();
    if (jobData) {
      contractorId = jobData.contractor_id || jobData.company_id;
    }
  } catch (err) {
    console.warn("Could not find job contractor id:", err);
  }

  const { data, error } = await supabase.from('interviews').insert({
    worker_id: interview.workerId,
    contractor_id: contractorId,
    job_id: interview.jobId,
    date: interview.date,
    time: interview.time,
    interview_time: interview.date && interview.time ? `${interview.date}T${interview.time}:00Z` : null,
    location: interview.location,
    meeting_link: interview.location?.toLowerCase().includes('http') ? interview.location : 'https://meet.google.com/abc-defg-hij',
    status: interview.status,
    ppe_required: interview.ppeRequired,
    notes: interview.notes,
  }).select('*').single();

  if (error) throw error;
  return {
    id: data.id,
    workerId: data.worker_id,
    jobId: data.job_id,
    date: data.date,
    time: data.time,
    location: data.location || data.meeting_link || 'Online Walkthrough',
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

// Memory fallback to support seamless execution if Supabase tables are not fully run
let localReviewsFallback: any[] = [
  {
    id: 'r_init_1',
    reviewer_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    reviewed_user_id: '11111111-1111-1111-1111-111111111111',
    job_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    rating: 5.0,
    review_text: 'Fantastic firm to work for. Paid on time every Friday, site managers know what they are doing, clean and organised material staging areas.',
    reviewer_name: 'Dave K. (Electrician)',
    reviewer_role: 'Subcontractor',
    categories: { communication: 5, site_organisation: 5, payment_speed: 5, professionalism: 5, accuracy_of_job_description: 5 },
    reported: false,
    moderated: false,
    created_at: '2026-05-12T10:00:00Z'
  },
  {
    id: 'r_init_2',
    reviewer_id: '11111111-1111-1111-1111-111111111111',
    reviewed_user_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    job_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    rating: 5.0,
    review_text: 'Dave did a fantastic job on our Chelsea development. Neat trunking, excellent attitude, and very efficient with testing. Will hire again.',
    reviewer_name: 'Robert J. (Site Agent)',
    reviewer_role: 'Apex Build Group',
    categories: { reliability: 5, quality_of_work: 5, communication: 5, professionalism: 5, timekeeping: 5 },
    reported: false,
    moderated: false,
    created_at: '2026-05-10T14:30:00Z'
  }
];

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
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn("Reviews table not provisioned. Falling back to local state.");
        return localReviewsFallback.map(r => ({
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
          createdAt: r.created_at,
        }));
      }
      throw error;
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
  } catch (err: any) {
    console.warn("Reviews select fail:", err.message);
    return localReviewsFallback.map(r => ({
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
      createdAt: r.created_at,
    }));
  }
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
    console.warn("Inserting to reviews table failed, falling back to local fallback + JSONB column updates:", err.message);
    
    // Add to local fallback list
    localReviewsFallback.push(newReviewObj);

    // Sync to profiles
    const mappedReviewItem = {
      id: newReviewObj.id,
      reviewer: reviewerName,
      role: reviewerRole,
      rating: Number(rating),
      text: reviewText,
      date: new Date().toISOString().split('T')[0]
    };

    await syncReviewToProfile(reviewedUserId, mappedReviewItem, rating);

    return {
      id: newReviewObj.id,
      reviewerId: newReviewObj.reviewer_id,
      reviewedUserId: newReviewObj.reviewed_user_id,
      jobId: newReviewObj.job_id,
      rating: Number(newReviewObj.rating),
      reviewText: newReviewObj.review_text,
      reviewerName: newReviewObj.reviewer_name,
      reviewerRole: newReviewObj.reviewer_role,
      categories: newReviewObj.categories || {},
      reported: newReviewObj.reported || false,
      moderated: newReviewObj.moderated || false,
      createdAt: newReviewObj.created_at,
    };
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
  try {
    const { error } = await supabase
      .from('reviews')
      .update({ reported: true, report_reason: reason })
      .eq('id', reviewId);

    if (error) throw error;
  } catch (err: any) {
    console.warn("reportReviewInDb failed, applying to local fallback:", err.message);
    const rev = localReviewsFallback.find(r => r.id === reviewId);
    if (rev) {
      rev.reported = true;
      rev.report_reason = reason;
    }
  }
}

export async function moderateReviewInDb(reviewId: string, action: 'approve' | 'delete'): Promise<void> {
  try {
    if (action === 'delete') {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('reviews')
        .update({ reported: false, report_reason: null, moderated: true })
        .eq('id', reviewId);
      if (error) throw error;
    }
  } catch (err: any) {
    console.warn("moderateReviewInDb failed, applying to local fallback:", err.message);
    if (action === 'delete') {
      localReviewsFallback = localReviewsFallback.filter(r => r.id !== reviewId);
    } else {
      const rev = localReviewsFallback.find(r => r.id === reviewId);
      if (rev) {
        rev.reported = false;
        rev.report_reason = null;
        rev.moderated = true;
      }
    }
  }
}

// Main seeder function to initialize tables with the user requested seed content inside Supabase
export async function seedInitialDataToSupabase() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.warn("Could not seed initial data: Supabase tables are not provisioned yet.");
      return;
    }

    // Check if contractor/company profiles is empty
    const { data: existingCompanies } = await supabase.from('contractor_profiles').select('id').limit(1);
    if (!existingCompanies || existingCompanies.length === 0) {
      console.log("Seeding contractor profiles...");
      const seededCompanies = INITIAL_COMPANIES.map((c, i) => {
        const id = i === 0 ? SEED_IDS.company1 : i === 1 ? SEED_IDS.company2 : SEED_IDS.company3;
        return {
          id,
          user_id: id,
          company_name: c.name,
          logo: c.logo || 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=200&auto=format&fit=crop&q=80',
          hiring_requirements: c.requirements || ['Right to work in UK', 'Valid CSCS Certification'],
          trades_hiring_for: [c.industry || 'General construction'].filter(Boolean),
          email: `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@hiring.co.uk`,
          phone: '01273 900200',
        };
      });
      await supabase.from('contractor_profiles').insert(seededCompanies);
    }

    // Check if workers is empty
    const { data: existingWorkers } = await supabase.from('worker_profiles').select('id').limit(1);
    if (!existingWorkers || existingWorkers.length === 0) {
      console.log("Seeding workers...");
      const seededWorkers = INITIAL_WORKERS.map((w, i) => {
        const id = i === 0 ? SEED_IDS.worker1 : i === 1 ? SEED_IDS.worker2 : SEED_IDS.worker3;
        return {
          id,
          user_id: id,
          full_name: w.name,
          years_experience: w.experience,
          hometown: w.location,
          bio: w.about,
          qualifications: w.qualifications || [],
          availability: w.availability || 'Immediate',
          phone: w.phone || '07911 123456',
          email: w.email || `${w.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@trades.co.uk`,
          licences: w.licences || [],
          employment_preferences: w.positionLengths || [],
          day_rate: w.payRate || '£150/day',
          own_tools: w.toolsAndTransport?.some(t => t.toLowerCase().includes('tool')) ?? false,
          own_transport: w.toolsAndTransport?.some(t => t.toLowerCase().includes('van') || t.toLowerCase().includes('licence') || t.toLowerCase().includes('driving')) ?? false,
        };
      });
      await supabase.from('worker_profiles').insert(seededWorkers);
    }

    // Check if jobs is empty
    const { data: existingJobs } = await supabase.from('jobs').select('id').limit(1);
    if (!existingJobs || existingJobs.length === 0) {
      console.log("Seeding jobs...");
      const seededJobs = INITIAL_JOBS.map((j, i) => {
        const id = i === 0 ? SEED_IDS.job1 : i === 1 ? SEED_IDS.job2 : SEED_IDS.job3;
        const companyId = i === 0 ? SEED_IDS.company1 : i === 1 ? SEED_IDS.company2 : SEED_IDS.company3;
        return {
          id,
          company_id: companyId,
          company_name: j.companyName,
          company_logo: j.companyLogo,
          company_cover: j.companyCover,
          title: j.title,
          trade: j.trade,
          subcategory: j.subcategory,
          pay_rate: j.payRate,
          location: j.location,
          start_date: j.startDate,
          duration: j.duration,
          employment_type: j.employmentType,
          qualifications: j.qualifications,
          verified: j.verified,
          description: j.description,
          benefits: j.benefits,
          requirements: j.requirements,
          company_stats: j.companyStats,
        };
      });
      await supabase.from('jobs').insert(seededJobs);
    }

    console.log("Supabase tables seed successful!");
  } catch (err: any) {
    console.error("Seed execution failed:", err.message);
  }
}