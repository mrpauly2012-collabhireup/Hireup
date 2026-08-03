/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wrench, HardHat, ShieldCheck, Mail, Phone, Lock, ArrowRight, 
  Sparkles, Check, ChevronRight, MapPin, Award, Truck, Clock, 
  Users, Building, FileText, CheckCircle2, AlertCircle, PlayCircle, Eye, EyeOff, CheckSquare,
  Sliders, LayoutGrid, Layers, Image as ImageIcon
} from 'lucide-react';
import { WorkerProfile, CompanyProfile, JobProfile, UserType } from '../types';
import SearchableDropdown from './SearchableDropdown';
import { HOMETOWNS, LICENCES, POSITION_LENGTHS, GRADES, REQUIREMENTS, TRADES_CATEGORIES, TRADE_SUBCATEGORIES_MAP } from '../data/datasets';
import { signInUser, registerWorker, registerContractor, uploadFileToStorage, supabase } from '../lib/supabase';
import { HIREUP_LOGO } from '../constants';


interface AuthViewProps {
  onAuthSuccess: (session: { id: string; email: string; userType: UserType }) => void;
  workers: WorkerProfile[];
  companies: CompanyProfile[];
  onAddWorker: (worker: WorkerProfile) => void;
  onAddCompany: (company: CompanyProfile) => void;
  onAddJob: (job: JobProfile) => void;
}

type AuthSubView = 'landing' | 'signin' | 'signup_worker' | 'signup_contractor';

export default function AuthView({
  onAuthSuccess,
  workers,
  companies,
  onAddWorker,
  onAddCompany,
  onAddJob
}: AuthViewProps) {
  const [view, setView] = useState<AuthSubView>('landing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [registeredType, setRegisteredType] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Concept switcher states
  const [activeConcept, setActiveConcept] = useState<'bento' | 'split' | 'panoramic'>('split');
  const [blueprintTab, setBlueprintTab] = useState<'trades' | 'contractor'>('trades');
  const [showPanoramicSignIn, setShowPanoramicSignIn] = useState(false);

  // Custom modal states for high-converting interactive landing page
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Common input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Worker Signup states
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerRate, setWorkerRate] = useState('£200');
  const [workerExp, setWorkerExp] = useState('8 Years');
  const [workerMainTrade, setWorkerMainTrade] = useState(TRADES_CATEGORIES[0] || 'Electrician');
  const [workerSubcategory, setWorkerSubcategory] = useState(
    (TRADES_CATEGORIES[0] && TRADE_SUBCATEGORIES_MAP[TRADES_CATEGORIES[0]] && TRADE_SUBCATEGORIES_MAP[TRADES_CATEGORIES[0]][0]) || 'Electrician'
  );
  const [workerSecondaryTrade, setWorkerSecondaryTrade] = useState('Plumber');
  const [workerLocation, setWorkerLocation] = useState('Brighton');
  const [workerQualifications, setWorkerQualifications] = useState<string[]>([]);
  const [workerLicences, setWorkerLicences] = useState<string[]>([]);
  const [workerPrefs, setWorkerPrefs] = useState<string[]>([]);
  const [workerAvailability, setWorkerAvailability] = useState('Immediate');
  const [workerType, setWorkerType] = useState('CIS Subcontract');
  const [workerTools, setWorkerTools] = useState<string[]>(['Own Hand Tools', 'Full Power Tools']);
  const [workerProfilePhotoUrl, setWorkerProfilePhotoUrl] = useState('');
  const [workerGalleryImages, setWorkerGalleryImages] = useState<string[]>([]);

  // Contractor Signup states
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('Civil Engineering & Commercial Build');
  const [companySize, setCompanySize] = useState('100 - 250 Employees');
  const [companyHQ, setCompanyHQ] = useState('Brighton');
  const [companyInsurance, setCompanyInsurance] = useState('No insurance');
  const [companyRequirements, setCompanyRequirements] = useState<string[]>([]);
  const [tradesHiring, setTradesHiring] = useState(TRADES_CATEGORIES[0] || 'Electrician');
  const [tradesHiringSubcategory, setTradesHiringSubcategory] = useState(
    (TRADES_CATEGORIES[0] && TRADE_SUBCATEGORIES_MAP[TRADES_CATEGORIES[0]] && TRADE_SUBCATEGORIES_MAP[TRADES_CATEGORIES[0]][0]) || 'Electrician'
  );
  const [jobLocation, setJobLocation] = useState('Brighton');
  const [hiringPositionLengths, setHiringPositionLengths] = useState<string[]>([]);
  const [requiredQuals, setRequiredQuals] = useState<string[]>([]);
  const [requiredLics, setRequiredLics] = useState<string[]>([]);
  const [contractorCompanyLogoUrl, setContractorCompanyLogoUrl] = useState('');
  const [contractorCompanyGalleryImages, setContractorCompanyGalleryImages] = useState<string[]>([]);

  // Local File states to defer upload until after signup is completed
  const [workerAvatarFile, setWorkerAvatarFile] = useState<File | null>(null);
  const [workerGalleryFiles, setWorkerGalleryFiles] = useState<{file: File, previewUrl: string}[]>([]);
  const [contractorLogoFile, setContractorLogoFile] = useState<File | null>(null);
  const [contractorGalleryFiles, setContractorGalleryFiles] = useState<{file: File, previewUrl: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup Onboarding Progress Logs state
  const [debugLogs, setDebugLogs] = useState<{message: string; status: 'pending' | 'success' | 'error' | 'info'}[]>([]);

  const addDebugLog = (message: string, status: 'pending' | 'success' | 'error' | 'info' = 'info') => {
    console.log(`[Signup Debug] ${message} (${status.toUpperCase()})`);
    setDebugLogs(prev => [...prev, { message, status }]);
  };

  // Signup Upload status states
  const [signupUploading, setSignupUploading] = useState<string | null>(null); // 'avatar' | 'gallery' | 'logo' | 'company_gallery' | 'onboarding_files'
  const [signupUploadError, setSignupUploadError] = useState<string | null>(null);
  const [showPostSignupDebug, setShowPostSignupDebug] = useState(false);
  const [signupDebugData, setSignupDebugData] = useState<any | null>(null);

  const handleSignupFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: string, // Kept in signature for backwards compatibility
    type: 'avatar' | 'gallery' | 'logo' | 'company_gallery'
  ) => {
    setSignupUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const objectUrl = URL.createObjectURL(file);
    
    addDebugLog(`File selected: "${file.name}" (size: ${(file.size / 1024).toFixed(1)} KB) for type "${type}"`, 'success');
    
    if (type === 'avatar') {
      setWorkerAvatarFile(file);
      setWorkerProfilePhotoUrl(objectUrl);
    } else if (type === 'gallery') {
      setWorkerGalleryFiles(prev => [...prev, { file, previewUrl: objectUrl }]);
      setWorkerGalleryImages(prev => [...prev, objectUrl]);
    } else if (type === 'logo') {
      setContractorLogoFile(file);
      setContractorCompanyLogoUrl(objectUrl);
    } else if (type === 'company_gallery') {
      setContractorGalleryFiles(prev => [...prev, { file, previewUrl: objectUrl }]);
      setContractorCompanyGalleryImages(prev => [...prev, objectUrl]);
    }
  };

  const handleRemoveSignupFile = (
    urlToRemove: string,
    type: 'gallery' | 'company_gallery'
  ) => {
    if (type === 'gallery') {
      setWorkerGalleryFiles(prev => prev.filter(item => item.previewUrl !== urlToRemove));
      setWorkerGalleryImages(prev => prev.filter(url => url !== urlToRemove));
    } else if (type === 'company_gallery') {
      setContractorGalleryFiles(prev => prev.filter(item => item.previewUrl !== urlToRemove));
      setContractorCompanyGalleryImages(prev => prev.filter(url => url !== urlToRemove));
    }
    
    try {
      URL.revokeObjectURL(urlToRemove);
    } catch (e) {
      console.warn("Could not revoke object URL", e);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    try {
      const session = await signInUser(email, password);
      onAuthSuccess(session);
    } catch (err: any) {
      console.error("Sign in error:", err);
      if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
        setErrorMsg('Database tables are missing from your Supabase project. Please contact support.');
      } else {
        setErrorMsg(err.message || 'Failed to sign in. Please check your credentials.');
      }
    }
  };

  const handleWorkerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    if (!workerName || !email || !password) {
      setErrorMsg('Please complete your name, email, and choose a secure password.');
      setIsSubmitting(false);
      return;
    }

    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Signup timed out while waiting for Supabase Auth.'));
      }, 15000);
    });

    try {
      const newWorker: Omit<WorkerProfile, 'id' | 'email'> = {
        name: workerName,
        trade: workerMainTrade,
        subcategory: workerSubcategory,
        experience: workerExp,
        qualifications: workerQualifications.length > 0 ? workerQualifications : ['NVQ Level 3 ' + workerMainTrade, 'CSCS Blue Card'],
        location: workerLocation,
        availability: workerAvailability,
        payRate: workerRate.startsWith('£') ? workerRate : `£${workerRate}`,
        rating: 5.0,
        reviewsCount: 1,
        verified: true,
        verifiedBadges: ['HireUp Certified', 'Right to Work Verified', 'CSCS Checked'],
        portfolio: [
          'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80'
        ],
        galleryImages: [],
        profilePhotoUrl: '',
        workHistory: [
          {
            id: 'wh1',
            role: `Senior ${workerMainTrade}`,
            company: 'Sussex Contract Services',
            duration: '2023 - Present',
            description: `Executed first and second-fix ${workerMainTrade} operations on major multi-million pound residential housing block installations.`
          },
          {
            id: 'wh2',
            role: `Qualified ${workerMainTrade}`,
            company: 'Brighton Electrical Contractors',
            duration: '2020 - 2023',
            description: `Responsible for site containment rigs, diagnostic tracing, safe isolation sign-offs, and final equipment commissioning.`
          }
        ],
        toolsAndTransport: workerTools,
        about: `Fully qualified, high-performing ${workerMainTrade} with ${workerExp} experience based in ${workerLocation}. Specialize in commercial builds and industrial containment layouts. CIS registered with a full clean UK driver's licence and own professional vehicle. Ready to start ${workerAvailability}.`,
        reviews: [
          {
            id: 'rev1',
            reviewer: 'Sussex Site Manager',
            role: 'Apex Build Group Ltd',
            rating: 5.0,
            text: `Extremely reliable, arrived early with all mandatory safety gear and high-quality power tools. Completed first fix containment ahead of project schedule.`,
            date: '2026-06-15'
          }
        ],
        references: [
          {
            id: 'ref1',
            name: 'Richard Vance',
            position: 'Contract Lead, Apex Build',
            contact: '07700 900077'
          }
        ],
        phone: workerPhone || '07911 123456',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80',
        licences: workerLicences.length > 0 ? workerLicences : ['Driver\'s License - UK Full', 'CSCS Skilled Worker Card'],
        positionLengths: workerPrefs.length > 0 ? workerPrefs : ['Contract', 'Permanent']
      };

      addDebugLog(`Starting worker sign up with email: ${email}...`, 'pending');
      const result = await Promise.race([
        registerWorker(email, password, newWorker, addDebugLog),
        timeoutPromise
      ]);

      clearTimeout(timeoutId);

      // Pre-add worker profile locally to guarantee instant rendering in state without race conditions
      const fullWorkerProfile: WorkerProfile = {
        ...newWorker,
        id: result.id,
        email: email,
        avatar: newWorker.avatar,
        profilePhotoUrl: newWorker.profilePhotoUrl,
        galleryImages: newWorker.galleryImages
      };
      onAddWorker(fullWorkerProfile);

      console.log("Redirecting to dashboard");
      addDebugLog("Redirecting to dashboard", 'success');

      onAuthSuccess({
        id: result.id,
        email: email,
        userType: 'worker'
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Worker sign up error:", err);
      const msg = err.message || String(err);
      setErrorMsg(msg);
      addDebugLog(`Signup failed: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContractorSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    if (!companyName || !email || !password) {
      setErrorMsg('Please enter your company name, email and secure password.');
      setIsSubmitting(false);
      return;
    }

    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Signup timed out while waiting for Supabase Auth.'));
      }, 15000);
    });

    try {
      const newCompany: Omit<CompanyProfile, 'id'> = {
        name: companyName,
        logo: 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=200&auto=format&fit=crop&q=80',
        companyLogoUrl: '',
        companyGalleryImages: [],
        coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
        description: `${companyName} is a premier ${companyIndustry} contractor headquartered in ${companyHQ}, operating a highly skilled crew of ${companySize}. We maintain an outstanding reputation for quality site execution, compliance, and strict adherence to CDM standards.`,
        openVacanciesCount: 1,
        benefits: ['Competitive Trade Pay', 'Weekly CIS Invoicing', 'Long-term contracts available', 'Direct site transport options'],
        reviews: [
          {
            id: 'rev_c1',
            reviewer: 'James K. (Electrician)',
            role: 'Subcontractor',
            rating: 5.0,
            text: `Excellent firm to work for. Materials are always ready on site, and payments are approved on time every Friday without delay.`,
            date: '2026-05-18'
          }
        ],
        stats: {
          projects: 14,
          workers: 45,
          rating: 4.9
        },
        verified: true,
        location: companyHQ,
        requirements: companyRequirements.length > 0 ? companyRequirements : ['Insurance requirements (liability insurance)', 'Qualification checks'],
        website: companyWebsite || `www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.uk`,
        industry: companyIndustry,
        companySize: companySize,
        companyHouseNumber: '08' + Math.floor(100000 + Math.random() * 900000),
        vatNumber: 'GB ' + Math.floor(100 + Math.random() * 900) + ' ' + Math.floor(1000 + Math.random() * 9000) + ' ' + Math.floor(10 + Math.random() * 90),
        insuranceStatus: companyInsurance,
        phone: contractorPhone
      };

      addDebugLog(`Starting contractor sign up for company "${companyName}" with email: ${email}...`, 'pending');
      const result = await Promise.race([
        registerContractor(
          email,
          password,
          newCompany,
          companyRequirements,
          [tradesHiring, tradesHiringSubcategory].filter(Boolean),
          addDebugLog
        ),
        timeoutPromise
      ]);

      clearTimeout(timeoutId);

      // Pre-add company profile locally
      const fullCompanyProfile: CompanyProfile = {
        ...newCompany,
        id: result.id,
        logo: newCompany.logo,
        companyLogoUrl: newCompany.companyLogoUrl,
        companyGalleryImages: newCompany.companyGalleryImages
      };
      onAddCompany(fullCompanyProfile);

      console.log("Redirecting to dashboard");
      addDebugLog("Redirecting to dashboard", 'success');

      onAuthSuccess({
        id: result.id,
        email: email,
        userType: 'employer'
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Contractor sign up error:", err);
      const msg = err.message || String(err);
      setErrorMsg(msg);
      addDebugLog(`Signup failed: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="auth-main-container" className={`min-h-screen ${(view === 'landing' || view === 'signin') ? 'bg-white' : 'bg-zinc-50 flex flex-col justify-center py-12'} px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden`}>
      {/* Decorative Grid Pattern Background */}
      {!(view === 'landing' || view === 'signin') && (
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-70 pointer-events-none" />
      )}
      
      {/* Abstract light blobs for depth */}
      {!(view === 'landing' || view === 'signin') && (
        <>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-zinc-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        </>
      )}

      <div className={`${(view === 'landing' || view === 'signin') ? 'w-full' : 'max-w-4xl mx-auto w-full space-y-6 relative z-10'}`}>
        
        {/* LOGO & HEADING COMMON TO ALL SUB-VIEWS */}
        {!(view === 'landing' || view === 'signin') && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-1 bg-white px-5 py-3 rounded-2xl border border-zinc-200 shadow-2xs">
              <img
                src={HIREUP_LOGO}
                alt="HireUp Trades Recruitment"
                className="w-44 h-20 object-contain"
              />
            </div>
          </div>
        )}

        {/* ERROR DISPLAY */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-150 rounded-2xl p-4 flex items-center gap-3 text-rose-800 animate-pulse max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-xs font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* TEMPORARY POST-SIGNUP DEBUG PANEL OR REGISTERED EMAIL OR CORE VIEWS */}
        {showPostSignupDebug && signupDebugData ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xl max-w-2xl mx-auto space-y-6 relative z-10 my-8">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#10B981] mx-auto border border-emerald-100 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-[#10B981] border border-emerald-100 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider animate-pulse">
                Signup Completed Successfully
              </span>
              <h2 className="text-2xl font-black text-zinc-900 font-sans tracking-tight mt-2">Temporary Debug Console</h2>
              <p className="text-xs text-zinc-500 max-w-md mx-auto font-sans font-medium">
                Below are the real-time upload and database synchronization details verified from Supabase.
              </p>
            </div>

            <div className="border border-zinc-200 rounded-2xl overflow-hidden text-left font-mono text-[11px] divide-y divide-zinc-200 bg-zinc-50">
              <div className="p-3.5 flex justify-between items-center gap-4">
                <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Auth User ID:</span>
                <span className="text-zinc-800 font-bold break-all select-all">{signupDebugData.userId}</span>
              </div>
              <div className="p-3.5 flex justify-between items-center gap-4">
                <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">File Name:</span>
                <span className="text-zinc-800 font-bold break-all select-all">{signupDebugData.fileName}</span>
              </div>
              <div className="p-3.5 flex justify-between items-center gap-4">
                <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Storage Bucket:</span>
                <span className="text-zinc-800 font-bold select-all">{signupDebugData.bucket}</span>
              </div>
              <div className="p-3.5 flex justify-between gap-2 flex-col">
                <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Upload Path:</span>
                <span className="text-zinc-800 font-bold break-all select-all bg-zinc-100/70 px-2 py-1 rounded border border-zinc-200 mt-1">{signupDebugData.uploadPath}</span>
              </div>
              <div className="p-3.5 flex justify-between gap-2 flex-col">
                <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Public URL:</span>
                <span className="text-zinc-800 font-bold break-all select-all bg-zinc-100/70 px-2 py-1 rounded border border-zinc-200 mt-1">
                  {signupDebugData.publicUrl ? (
                    <span className="text-zinc-700">{signupDebugData.publicUrl}</span>
                  ) : (
                    <span className="text-rose-500 font-bold">❌ Empty URL!</span>
                  )}
                </span>
              </div>
              <div className="p-3.5 flex justify-between items-center gap-4">
                <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Database Column Updated:</span>
                <span className="text-zinc-800 font-bold select-all bg-zinc-150 px-1.5 py-0.5 rounded text-[10px]">{signupDebugData.dbColumnUpdated}</span>
              </div>
              <div className="p-3.5 flex justify-between gap-2 flex-col">
                <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Database Value After Update (Re-fetched):</span>
                <span className="text-zinc-800 font-bold break-all select-all bg-zinc-100/70 px-2 py-1 rounded border border-zinc-200 mt-1">
                  {signupDebugData.dbValueAfterUpdate ? (
                    <span className="text-zinc-700">{signupDebugData.dbValueAfterUpdate}</span>
                  ) : (
                    <span className="text-rose-500 font-bold">❌ Column contains NULL or Empty String!</span>
                  )}
                </span>
              </div>
              <div className="p-3.5 flex justify-between items-center gap-4">
                <span className="text-zinc-400 uppercase font-black tracking-wider text-[9px]">Profile Re-fetch Result:</span>
                <span className={`font-bold uppercase text-[10px] ${signupDebugData.refetchResult === 'Success' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {signupDebugData.refetchResult}
                </span>
              </div>
            </div>

            {/* Verification Warnings & Integrity Checks */}
            <div className="space-y-2.5">
              {!signupDebugData.publicUrl && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-mono font-bold text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce" />
                  ERROR: Public URL is empty! Upload failed or returned undefined.
                </div>
              )}
              {signupDebugData.publicUrl && !signupDebugData.dbValueAfterUpdate && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-mono font-bold text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce" />
                  ERROR: Column "{signupDebugData.dbColumnUpdated}" is null in the database. Persistence check failed!
                </div>
              )}
              {signupDebugData.dbValueAfterUpdate && signupDebugData.dbValueAfterUpdate !== signupDebugData.publicUrl && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs font-mono font-bold text-amber-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  WARNING: Database value does not match generated public URL exactly.
                </div>
              )}
              {/* Integrity checks */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 space-y-1">
                <p className="font-bold font-mono uppercase text-[10px] tracking-wider text-emerald-900 flex items-center gap-1">
                  <span>✓</span> INTEGRITY MAPPINGS VERIFIED
                </p>
                <p className="font-medium font-sans">
                  The application is configured to read from database column <strong>{signupDebugData.dbColumnUpdated}</strong>. Map helpers successfully translate this to mapped UI state properties, preventing rendering mismatches.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPostSignupDebug(false);
                onAuthSuccess(signupDebugData.session);
              }}
              className="w-full py-4 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              PROCEED TO DASHBOARD <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : registeredEmail ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-lg max-w-lg mx-auto text-center space-y-6 animate-fade-in relative z-10 my-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#10B981] mx-auto border border-emerald-100 shadow-xs">
              <Mail className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-[#10B981] border border-emerald-100 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider animate-pulse">
                Pre-Registration Complete
              </span>
              <h2 className="text-2xl font-bold text-zinc-900 font-sans mt-2">Check Your Email Inbox!</h2>
              <p className="text-sm text-zinc-600 leading-relaxed max-w-sm mx-auto">
                We've sent a verification link to <strong className="text-zinc-950 font-semibold">{registeredEmail}</strong>.
              </p>
            </div>
            
            <div className="bg-zinc-50 border border-zinc-150 p-5 rounded-2xl text-left text-xs text-zinc-600 space-y-3">
              <p className="font-bold text-zinc-900 font-mono uppercase text-[10px] tracking-wider">What happens next?</p>
              <ul className="list-disc pl-4 space-y-1.5 leading-relaxed font-sans">
                <li>Your professional <strong className="text-zinc-900 font-semibold">{registeredType === 'worker' ? 'Tradesman CV' : 'Contractor Profile'}</strong> has already been successfully created in our database using your authenticated user ID.</li>
                <li>Please open the confirmation email from Supabase and click the verification link to activate your login session.</li>
                <li>Once verified, you can sign in directly to access your live dashboard.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRegisteredEmail(null);
                  setView('signin');
                }}
                className="flex-1 py-3 bg-zinc-950 hover:bg-zinc-850 text-white font-mono text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs uppercase tracking-wider"
              >
                Go to Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegisteredEmail(null);
                  setView('landing');
                }}
                className="flex-1 py-3 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
              >
                Return Home
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* MAIN HIREUP LANDING PAGE CONTAINER */}
            {(view === 'landing' || view === 'signin') && (
          <div className="space-y-12 animate-fade-in w-full text-zinc-800">
            {/* 1. TOP NAVIGATION */}
            <nav className="border-b border-zinc-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 py-4">
              <div className="flex items-center justify-between">
                {/* Logo on Left */}
                <button
                  type="button"
                  className="w-36 h-14 flex items-center cursor-pointer"
                  onClick={() => setView('landing')}
                  aria-label="Return to HireUp home"
                >
                  <img
                    src={HIREUP_LOGO}
                    alt="HireUp"
                    className="w-full h-full object-contain object-left"
                  />
                </button>

                {/* Navigation links on Right */}
                <div className="flex items-center gap-5 sm:gap-8 text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
                  <button 
                    type="button" 
                    onClick={() => setShowAboutModal(true)} 
                    className="hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    About
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowHelpModal(true)} 
                    className="hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    Help
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowSignInModal(true)} 
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded-xl transition-all cursor-pointer shadow-xs uppercase font-mono text-[10px] font-black tracking-widest"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </nav>

            {/* HERO SECTION WITH LARGE FADED BACKGROUND IMAGE */}
            <div className="relative rounded-3xl overflow-hidden min-h-[380px] sm:min-h-[420px] bg-zinc-950 border border-zinc-200 flex flex-col justify-end p-6 sm:p-10 shadow-lg">
              {/* Background Image of UK tradesworkers (faded) */}
              <img 
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&auto=format&fit=crop&q=80" 
                alt="UK Construction Trades and Builders at work" 
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale-[20%] select-none pointer-events-none"
              />
              {/* Dark vignette gradient overlay to ensure text is fully readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20 pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-4 text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00F5A0]/20 text-emerald-300 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border border-[#00F5A0]/30">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Direct Trade Matchmaker
                </span>
                
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none uppercase font-sans">
                  Find Work Today. <br />
                  <span className="text-[#00F5A0]">Find Workers Tomorrow.</span>
                </h1>
                
                <div className="space-y-1">
                  <p className="text-sm sm:text-lg text-zinc-200 leading-relaxed font-sans max-w-2xl font-bold">
                    Built for the UK trades and construction industry.
                  </p>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans max-w-2xl font-medium">
                    Swipe, match and hire faster than traditional recruitment.
                  </p>
                </div>
              </div>
            </div>

            {/* MAIN ACTION CARDS - HIGH CONVERTING SPLIT-SCREEN CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              
              {/* WORKER CARD */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 sm:p-10 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all duration-300">
                <div className="space-y-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-xs border border-zinc-200/60">
                    👷
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest block">FOR SUBCONTRACT PROFESSIONAL</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 font-sans tracking-tight mt-1">
                      Find Work Today
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                    Find local jobs, temporary work, long-term contracts and immediate starts. Upload your CSCS or ECS card, specify your daily rate and claim shifts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setView('signup_worker')}
                  className="w-full py-4 px-6 bg-[#00F5A0] hover:bg-emerald-400 text-zinc-950 rounded-2xl font-mono text-xs font-black uppercase tracking-widest flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-[0.99] font-black"
                >
                  <span>Continue as Worker</span>
                  <ArrowRight className="w-4 h-4 text-zinc-950" />
                </button>
              </div>

              {/* CONTRACTOR CARD */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 sm:p-10 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all duration-300">
                <div className="space-y-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-xs border border-zinc-200/60">
                    🏗️
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest block">FOR SITE MANAGERS & CONTRACTORS</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 font-sans tracking-tight mt-1">
                      Need Workers Fast?
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                    Find available workers for tomorrow, emergency cover, short-term projects and permanent positions. Say goodbye to heavy agency markup rates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setView('signup_contractor')}
                  className="w-full py-4 px-6 bg-[#00F5A0] hover:bg-emerald-400 text-zinc-950 rounded-2xl font-mono text-xs font-black uppercase tracking-widest flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-[0.99] font-black"
                >
                  <span>Continue as Contractor</span>
                  <ArrowRight className="w-4 h-4 text-zinc-950" />
                </button>
              </div>

            </div>

            {/* EXISTING USER SECTION */}
            <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-6 text-center max-w-xl mx-auto w-full shadow-2xs">
              <p className="text-xs font-bold text-zinc-700 font-mono">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setShowSignInModal(true)}
                  className="text-emerald-600 hover:text-emerald-700 underline font-black ml-1.5 uppercase tracking-wide cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>

            {/* DYNAMIC UK STATS PROMPT ACCORDING TO USER FEELING FOR 5 SEC RESPONSE */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-b border-zinc-100 py-6">
              <div>
                <span className="block text-[9px] font-mono text-zinc-400 font-black uppercase tracking-wider">CAN WORKERS FIND WORK QUICKLY?</span>
                <span className="text-xs font-bold text-emerald-600">Yes • Under 15 Minutes</span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-zinc-400 font-black uppercase tracking-wider">CAN CONTRACTORS FIND RECRUITS?</span>
                <span className="text-xs font-bold text-emerald-600">Yes • Immediate Tomorrow Starts</span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-zinc-400 font-black uppercase tracking-wider">COMPLIANCE ASSURANCE</span>
                <span className="text-xs font-bold text-zinc-900 font-mono uppercase">CSCS Vetted</span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-zinc-400 font-black uppercase tracking-wider">UK WIDE COVERAGE</span>
                <span className="text-xs font-bold text-zinc-900 font-mono uppercase">Direct Match</span>
              </div>
            </div>

            {/* 1. SECURE SIGN IN MODAL */}
            {showSignInModal && (
              <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-fade-in text-left">
                  <button
                    type="button"
                    onClick={() => setShowSignInModal(false)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 font-bold font-mono text-xs uppercase cursor-pointer"
                  >
                    ✕ CLOSE
                  </button>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                      <Lock className="w-5 h-5 text-zinc-950" />
                      <div>
                        <h3 className="text-lg font-black text-zinc-950 tracking-tight">Secure Sign-In</h3>
                        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">HTTPS ENCRYPTED CONSOLE</p>
                      </div>
                    </div>

                    <form onSubmit={async (e) => {
                      await handleSignIn(e);
                    }} className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-black text-zinc-400 uppercase tracking-wider">EMAIL ADDRESS</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. dave@knyte.com"
                            className="w-full pl-10 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-black text-zinc-400 uppercase tracking-wider">SECURE PASSWORD</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-[#00F5A0] hover:bg-emerald-400 text-zinc-950 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-center cursor-pointer transition-all active:scale-[0.99] shadow-sm font-black"
                      >
                        Sign In with Credentials
                      </button>
                    </form>

                    <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl text-[10px] text-zinc-500 leading-normal font-mono">
                      <span className="font-bold text-zinc-700">Quick Test Credentials:</span>
                      <br />• Worker: <span className="font-bold">dave@knyte.com</span> (Password: <span className="font-bold">password</span>)
                      <br />• Contractor: <span className="font-bold">apex@build.com</span> (Password: <span className="font-bold">password</span>)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ABOUT US MODAL */}
            {showAboutModal && (
              <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-fade-in text-left max-h-[90vh] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setShowAboutModal(false)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 font-bold font-mono text-xs uppercase cursor-pointer"
                  >
                    ✕ CLOSE
                  </button>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-zinc-950 tracking-tight border-b border-zinc-150 pb-2">About HireUp</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                      HireUp is the UK's premier direct trade matchmaking platform. Designed explicitly for subcontractors, tradesmen, and principal site managers to connect immediately with zero middleman agencies or hidden markups.
                    </p>
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                      Our ecosystem features:
                    </p>
                    <ul className="text-xs text-zinc-600 list-disc pl-5 space-y-1.5 font-medium">
                      <li>Instant swipe matchmaking based on trade categories and site locations.</li>
                      <li>CITB and CSCS credentials checked and vetted.</li>
                      <li>Secure direct messenger with instant project dispatch logs.</li>
                      <li>Daily invoice index reporting standard day-rates for transparent CIS payroll.</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => setShowAboutModal(false)}
                      className="mt-2 w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                    >
                      Got it, thanks
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. HELP / FAQ MODAL */}
            {showHelpModal && (
              <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-fade-in text-left max-h-[90vh] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 font-bold font-mono text-xs uppercase cursor-pointer"
                  >
                    ✕ CLOSE
                  </button>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-zinc-950 tracking-tight border-b border-zinc-150 pb-2">Help & Frequently Asked Questions</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 font-mono uppercase">Q: How quickly can I get hired as a Worker?</h4>
                        <p className="text-xs text-zinc-600 mt-1">
                          Once your profile is active, contractors looking for your specific trade category in your area can match with you instantly. Many workers secure shifts for the very next morning.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 font-mono uppercase">Q: How do you verify CSCS or Gas Safe compliance?</h4>
                        <p className="text-xs text-zinc-600 mt-1">
                          When registering, workers upload their registration numbers. Our backend automatically cross-checks with CITB registers for up-to-date validation status.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 font-mono uppercase">Q: Are there any recruitment fees or commissions?</h4>
                        <p className="text-xs text-zinc-600 mt-1">
                          None! HireUp operates a direct subscription/credits model for contractors. Workers keep 100% of their negotiated day rates with direct CIS tax accounting.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowHelpModal(false)}
                      className="mt-2 w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                    >
                      Close FAQ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PRIVACY POLICY MODAL */}
            {showPrivacyModal && (
              <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-fade-in text-left max-h-[90vh] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(false)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 font-bold font-mono text-xs uppercase cursor-pointer"
                  >
                    ✕ CLOSE
                  </button>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-zinc-950 tracking-tight border-b border-zinc-150 pb-2">Privacy Policy</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      HireUp is committed to protecting your personal data. We comply with GDPR and UK Data Protection acts.
                    </p>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      We collect profile data (name, email, phone, trade category, location, CSCS registration file numbers) exclusively to enable instant site matching and worker vetting compliance checks. We never share your details with unapproved third parties.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(false)}
                      className="mt-2 w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                    >
                      Close Privacy Policy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. TERMS & CONDITIONS MODAL */}
            {showTermsModal && (
              <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-fade-in text-left max-h-[90vh] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(false)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 font-bold font-mono text-xs uppercase cursor-pointer"
                  >
                    ✕ CLOSE
                  </button>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-zinc-950 tracking-tight border-b border-zinc-150 pb-2">Terms & Conditions</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                      By registering on HireUp as a worker, subcontractor or contractor, you agree to:
                    </p>
                    <ul className="text-xs text-zinc-600 list-disc pl-5 space-y-1 font-medium">
                      <li>Provide accurate, genuine certifications, CSCS cards, and insurance records.</li>
                      <li>Operate in a professional, compliant manner following standard site CDM guidelines.</li>
                      <li>Handle direct CIS payments transparently through approved payroll.</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(false)}
                      className="mt-2 w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                    >
                      Close Terms
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. CONTACT US MODAL */}
            {showContactModal && (
              <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-fade-in text-left">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 font-bold font-mono text-xs uppercase cursor-pointer"
                  >
                    ✕ CLOSE
                  </button>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-zinc-950 tracking-tight border-b border-zinc-150 pb-2">Contact HireUp Support</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                      Got a query or need assistance with your site registration or profile vetting? Get in touch with our friendly London support desk:
                    </p>
                    <div className="space-y-2 text-xs font-mono text-zinc-700 bg-zinc-50 p-4 rounded-xl font-semibold">
                      <div>📞 Phone: <span className="font-bold text-zinc-900">020 7946 0192</span></div>
                      <div>✉ Email: <span className="font-bold text-zinc-900">support@hireup.co.uk</span></div>
                      <div>📍 Address: <span className="font-bold text-zinc-900">120 Blackfriars Rd, London SE1 8HW</span></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowContactModal(false)}
                      className="mt-2 w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SMALL FOOTER */}
            <footer className="border-t border-zinc-100 pt-8 pb-4 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  &copy; {new Date().getFullYear()} HireUp UK Ltd. All rights reserved.
                </div>
                <div className="flex items-center gap-6">
                  <button type="button" onClick={() => setShowAboutModal(true)} className="hover:text-zinc-950 cursor-pointer">About Us</button>
                  <button type="button" onClick={() => setShowPrivacyModal(true)} className="hover:text-zinc-950 cursor-pointer">Privacy Policy</button>
                  <button type="button" onClick={() => setShowTermsModal(true)} className="hover:text-zinc-950 cursor-pointer">Terms & Conditions</button>
                  <button type="button" onClick={() => setShowContactModal(true)} className="hover:text-zinc-950 cursor-pointer">Contact Us</button>
                </div>
              </div>
            </footer>

          </div>
        )}

        {/* WORKER SIGN UP SUB-VIEW */}
        {view === 'signup_worker' && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
              <div>
                <span className="px-2.5 py-1 bg-zinc-950 text-white rounded-lg text-[9px] font-mono font-black uppercase tracking-wider">Tradesman Desk</span>
                <h2 className="text-xl font-bold text-zinc-900 font-sans mt-2">Tradesman Digital CV Onboarding</h2>
              </div>
              <button
                onClick={() => setView('landing')}
                className="text-xs font-mono font-black text-zinc-400 hover:text-zinc-900 uppercase"
              >
                ← Back
              </button>
            </div>

            <form onSubmit={handleWorkerSignUp} className="space-y-6">
              
              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">FULL NAME</label>
                  <input
                    type="text"
                    required
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    placeholder="e.g. Liam Fletcher"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="liam@fletcher-trades.co.uk"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">CHOOSE PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">MOBILE PHONE</label>
                  <input
                    type="text"
                    value={workerPhone}
                    onChange={(e) => setWorkerPhone(e.target.value)}
                    placeholder="07711 900222"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">EXPECTED DAY RATE</label>
                  <input
                    type="text"
                    value={workerRate}
                    onChange={(e) => setWorkerRate(e.target.value)}
                    placeholder="£220"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">YEARS OF SITE EXPERIENCE</label>
                  <select
                    value={workerExp}
                    onChange={(e) => setWorkerExp(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] cursor-pointer"
                  >
                    <option value="2 Years">2 Years</option>
                    <option value="5 Years">5 Years</option>
                    <option value="8 Years">8 Years</option>
                    <option value="12 Years">12 Years</option>
                    <option value="15+ Years">15+ Years</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">PRIMARY TRADE CATEGORY</label>
                  <select
                    value={workerMainTrade}
                    onChange={(e) => {
                      const selectedMain = e.target.value;
                      setWorkerMainTrade(selectedMain);
                      const subcategories = TRADE_SUBCATEGORIES_MAP[selectedMain] || [];
                      if (subcategories.length > 0) {
                        setWorkerSubcategory(subcategories[0]);
                      } else {
                        setWorkerSubcategory('');
                      }
                    }}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] cursor-pointer"
                  >
                    {TRADES_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">TRADE SUBCATEGORY</label>
                  <select
                    value={workerSubcategory}
                    onChange={(e) => setWorkerSubcategory(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] cursor-pointer"
                  >
                    {(TRADE_SUBCATEGORIES_MAP[workerMainTrade] || []).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">AVAILABILITY STATUS</label>
                  <select
                    value={workerAvailability}
                    onChange={(e) => setWorkerAvailability(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] cursor-pointer"
                  >
                    <option value="Immediate">Immediate / Available Now</option>
                    <option value="In 1 Week">In 1 Week</option>
                    <option value="In 2 Weeks">In 2 Weeks</option>
                    <option value="In 1 Month">In 1 Month</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">WORK / EMPLOYMENT PREFERENCE</label>
                  <select
                    value={workerType}
                    onChange={(e) => setWorkerType(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] cursor-pointer"
                  >
                    <option value="CIS Subcontract">CIS Subcontract (Self-Employed)</option>
                    <option value="PAYE Agency">PAYE Agency (Timesheets)</option>
                    <option value="Permanent Contract">Permanent Contract</option>
                  </select>
                </div>
              </div>

              {/* Searchable Dropdowns using dataset lists */}
              <div className="space-y-4 border-t border-zinc-100 pt-5">
                <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-wider">CSV Dataset Dropdown Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SearchableDropdown
                    id="signup-worker-hometown"
                    label="Hometown / Location"
                    options={HOMETOWNS}
                    selected={workerLocation}
                    onChange={setWorkerLocation}
                    multiple={false}
                    placeholder="Select Hometown..."
                  />

                  <SearchableDropdown
                    id="signup-worker-quals"
                    label="Qualifications"
                    options={GRADES}
                    selected={workerQualifications}
                    onChange={setWorkerQualifications}
                    multiple={true}
                    placeholder="Search and select qualifications..."
                  />

                  <SearchableDropdown
                    id="signup-worker-licences"
                    label="Licences and Certifications"
                    options={LICENCES}
                    selected={workerLicences}
                    onChange={setWorkerLicences}
                    multiple={true}
                    placeholder="Search and select licences..."
                  />

                  <SearchableDropdown
                    id="signup-worker-prefs"
                    label="Employment Preferences & Position Length"
                    options={POSITION_LENGTHS}
                    selected={workerPrefs}
                    onChange={setWorkerPrefs}
                    multiple={true}
                    placeholder="Select preferred position types..."
                  />
                </div>

                {/* Checklist Tools transport */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">TOOLS AND TRANSPORT OPTIONS</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono font-bold">
                    {['Own Hand Tools', 'Full Power Tools', 'Own Commercial Van', 'UK Clean Driving Licence'].map((tool) => {
                      const isChecked = workerTools.includes(tool);
                      return (
                        <button
                          key={tool}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setWorkerTools(prev => prev.filter(t => t !== tool));
                            } else {
                              setWorkerTools(prev => [...prev, tool]);
                            }
                          }}
                          className={`p-3 border rounded-xl flex items-center justify-between gap-1.5 transition-all text-left cursor-pointer ${isChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
                        >
                          <span className="truncate">{tool}</span>
                          {isChecked ? <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> : <div className="w-3.5 h-3.5 rounded border border-zinc-300 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Optional Media Uploads */}
              <div className="space-y-4 border-t border-zinc-100 pt-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#34D399]" />
                  <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider">OPTIONAL MEDIA UPLOADS</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Picture */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">PROFILE PICTURE (RECOMMENDED)</label>
                    <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-all flex flex-col items-center justify-center gap-3 relative cursor-pointer min-h-[120px] group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSignupFileUpload(e, 'profile-pictures', 'avatar')} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      {workerProfilePhotoUrl ? (
                        <div className="flex items-center gap-3 z-20">
                          <img src={workerProfilePhotoUrl} alt="Signup Avatar Preview" className="w-12 h-12 rounded-full object-cover border border-zinc-200" referrerPolicy="no-referrer" />
                          <div className="text-left">
                            <p className="text-xs font-bold text-zinc-900">Picture Uploaded</p>
                            <span className="text-[10px] font-mono text-zinc-400">Click to replace photo</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-zinc-300 group-hover:text-emerald-500 transition-all" />
                          <div className="text-center">
                            <p className="text-xs font-bold text-zinc-750">Click to upload photo</p>
                            <span className="text-[10px] font-mono text-zinc-400">profile-pictures bucket</span>
                          </div>
                        </>
                      )}
                      {signupUploading === 'avatar' && (
                        <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center gap-2 font-mono text-xs font-bold text-emerald-600 z-30">
                          <Clock className="w-4 h-4 animate-spin" /> UPLOADING...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Work Gallery */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">WORK GALLERY (MULTIPLE)</label>
                    <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-all flex flex-col items-center justify-center gap-3 relative cursor-pointer min-h-[120px] group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSignupFileUpload(e, 'work-gallery', 'gallery')} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      <ImageIcon className="w-8 h-8 text-zinc-300 group-hover:text-emerald-500 transition-all" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-zinc-750">Click to add gallery image</p>
                        <span className="text-[10px] font-mono text-zinc-400">work-gallery bucket</span>
                      </div>
                      {signupUploading === 'gallery' && (
                        <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center gap-2 font-mono text-xs font-bold text-emerald-600 z-30">
                          <Clock className="w-4 h-4 animate-spin" /> UPLOADING...
                        </div>
                      )}
                    </div>
                    {workerGalleryImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {workerGalleryImages.map((img, i) => (
                          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-200">
                            <img src={img} alt="Gallery item" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveSignupFile(img, 'gallery')}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[10px] font-bold"
                            >
                              REMOVE
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {debugLogs.length > 0 && (
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl font-mono text-[11px] text-zinc-300 space-y-2 shadow-inner mt-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span>⚙️ Onboarding Process Console</span>
                      <span className="animate-pulse flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> LIVE STREAM
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin font-mono">
                      {debugLogs.map((log, i) => (
                        <div key={i} className={`flex items-start gap-1.5 leading-relaxed ${
                          log.status === 'success' ? 'text-emerald-400 font-bold' :
                          log.status === 'error' ? 'text-rose-400 font-bold' :
                          log.status === 'pending' ? 'text-amber-400' : 'text-zinc-400'
                        }`}>
                          <span className="flex-shrink-0">
                            {log.status === 'success' ? '✔' :
                             log.status === 'error' ? '✘' :
                             log.status === 'pending' ? '⏳' : 'ℹ'}
                          </span>
                          <p className="flex-1">{log.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {signupUploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-mono font-bold text-rose-600 flex items-center gap-2 mt-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {signupUploadError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-zinc-900 hover:bg-zinc-850 disabled:bg-zinc-400 text-white rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg mt-8"
              >
                {signupUploading === 'onboarding_files' ? (
                  <>UPLOADING SECURE PROFILE MEDIA... <Clock className="w-4 h-4 animate-spin text-[#34D399]" /></>
                ) : isSubmitting ? (
                  <>CREATING YOUR ACCOUNT... <Clock className="w-4 h-4 animate-spin" /></>
                ) : (
                  <>CREATE MY DIGITAL CV & LAUNCH <ArrowRight className="w-4 h-4 text-[#34D399]" /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* CONTRACTOR SIGN UP SUB-VIEW */}
        {view === 'signup_contractor' && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
              <div>
                <span className="px-2.5 py-1 bg-[#34D399] text-white rounded-lg text-[9px] font-mono font-black uppercase tracking-wider">Contractor Desk</span>
                <h2 className="text-xl font-bold text-zinc-900 font-sans mt-2">Employer Profile & Vacancy Onboarding</h2>
              </div>
              <button
                onClick={() => setView('landing')}
                className="text-xs font-mono font-black text-zinc-400 hover:text-zinc-900 uppercase"
              >
                ← Back
              </button>
            </div>

            <form onSubmit={handleContractorSignUp} className="space-y-6">
              
              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">COMPANY NAME</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Oakridge Joinery Ltd"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">PRIMARY RECRUITER NAME</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Richard Vance"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">RECRUITMENT EMAIL</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hiring@oakridge-joinery.co.uk"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">CHOOSE PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">TELEPHONE OFFICE</label>
                  <input
                    type="text"
                    value={contractorPhone}
                    onChange={(e) => setContractorPhone(e.target.value)}
                    placeholder="01273 900300"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">COMPANY SIZE</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] cursor-pointer"
                  >
                    <option value="1 - 10 Employees">1 - 10 Employees</option>
                    <option value="11 - 49 Employees">11 - 49 Employees</option>
                    <option value="50 - 99 Employees">50 - 99 Employees</option>
                    <option value="100 - 250 Employees">100 - 250 Employees</option>
                    <option value="250+ Employees">250+ Employees</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">COMPANY WEBSITE (OPTIONAL)</label>
                  <input
                    type="text"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="www.oakridge-joinery.co.uk"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">PUBLIC LIABILITY COVERAGE</label>
                  <select
                    value={companyInsurance}
                    onChange={(e) => setCompanyInsurance(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] cursor-pointer"
                  >
                    <option value="No insurance">No insurance</option>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map(amount => (
                      <option
                        key={amount}
                        value={`£${amount}M Public Liability`}
                      >
                        £{amount}M Public Liability Cover
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-black text-zinc-400 uppercase">COMPANY FOCUS / INDUSTRY</label>
                  <input
                    type="text"
                    value={companyIndustry}
                    onChange={(e) => setCompanyIndustry(e.target.value)}
                    placeholder="Commercial Joinery & Shopfitting"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                  />
                </div>
              </div>

              {/* Vacancy Auto-creator block */}
              <div className="bg-[#34D399]/5 border border-[#34D399]/15 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-1.5 border-b border-[#34D399]/10 pb-2.5">
                  <Sparkles className="w-4 h-4 text-[#10B981]" />
                  <h4 className="text-xs font-mono font-black text-zinc-800 uppercase">Initial Site Vacancy Auto-Creator</h4>
                </div>
                <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                  We use these details to instantly seed your company profile with an active, matched job listing:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">TRADE CATEGORY HIRING FOR</label>
                    <select
                      value={tradesHiring}
                      onChange={(e) => {
                        const selectedMain = e.target.value;
                        setTradesHiring(selectedMain);
                        const subcategories = TRADE_SUBCATEGORIES_MAP[selectedMain] || [];
                        if (subcategories.length > 0) {
                          setTradesHiringSubcategory(subcategories[0]);
                        } else {
                          setTradesHiringSubcategory('');
                        }
                      }}
                      className="w-full p-3 bg-white border border-zinc-250 rounded-xl text-sm font-medium focus:outline-none cursor-pointer"
                    >
                      {TRADES_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">SPECIFIC TRADE HIRING FOR</label>
                    <select
                      value={tradesHiringSubcategory}
                      onChange={(e) => setTradesHiringSubcategory(e.target.value)}
                      className="w-full p-3 bg-white border border-zinc-250 rounded-xl text-sm font-medium focus:outline-none cursor-pointer"
                    >
                      {(TRADE_SUBCATEGORIES_MAP[tradesHiring] || []).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <SearchableDropdown
                      id="signup-contractor-job-loc"
                      label="Job Site Location"
                      options={HOMETOWNS}
                      selected={jobLocation}
                      onChange={setJobLocation}
                      multiple={false}
                      placeholder="Select Job Town..."
                    />
                  </div>
                </div>
              </div>

              {/* Searchable Dropdowns using dataset lists */}
              <div className="space-y-4 border-t border-zinc-100 pt-5">
                <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-wider">CSV Dataset Dropdown Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SearchableDropdown
                    id="signup-contractor-hq"
                    label="Headquarters Location"
                    options={HOMETOWNS}
                    selected={companyHQ}
                    onChange={setCompanyHQ}
                    multiple={false}
                    placeholder="Select Head Office..."
                  />

                  <SearchableDropdown
                    id="signup-contractor-requirements"
                    label="Company Hiring & Compliance Requirements"
                    options={REQUIREMENTS}
                    selected={companyRequirements}
                    onChange={setCompanyRequirements}
                    multiple={true}
                    placeholder="Search and select compliance rules..."
                  />

                  <SearchableDropdown
                    id="signup-contractor-quals"
                    label="Required Grades & Qualifications"
                    options={GRADES}
                    selected={requiredQuals}
                    onChange={setRequiredQuals}
                    multiple={true}
                    placeholder="Select required qualifications..."
                  />

                  <SearchableDropdown
                    id="signup-contractor-licences"
                    label="Required Licences"
                    options={LICENCES}
                    selected={requiredLics}
                    onChange={setRequiredLics}
                    multiple={true}
                    placeholder="Select required clearances..."
                  />

                  <div className="md:col-span-2">
                    <SearchableDropdown
                      id="signup-contractor-position-lengths"
                      label="Employment Contract Types Offered"
                      options={POSITION_LENGTHS}
                      selected={hiringPositionLengths}
                      onChange={setHiringPositionLengths}
                      multiple={true}
                      placeholder="Select contract structures..."
                    />
                  </div>
                </div>
              </div>

              {/* Optional Media Uploads */}
              <div className="space-y-4 border-t border-zinc-100 pt-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#34D399]" />
                  <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider">OPTIONAL COMPANY MEDIA UPLOADS</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Logo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">COMPANY LOGO (RECOMMENDED)</label>
                    <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-all flex flex-col items-center justify-center gap-3 relative cursor-pointer min-h-[120px] group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSignupFileUpload(e, 'company-logos', 'logo')} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      {contractorCompanyLogoUrl ? (
                        <div className="flex items-center gap-3 z-20">
                          <img src={contractorCompanyLogoUrl} alt="Signup Logo Preview" className="w-12 h-12 rounded-xl object-cover border border-zinc-200" referrerPolicy="no-referrer" />
                          <div className="text-left">
                            <p className="text-xs font-bold text-zinc-900">Logo Uploaded</p>
                            <span className="text-[10px] font-mono text-zinc-400">Click to replace logo</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-zinc-300 group-hover:text-emerald-500 transition-all" />
                          <div className="text-center">
                            <p className="text-xs font-bold text-zinc-750">Click to upload logo</p>
                            <span className="text-[10px] font-mono text-zinc-400">company-logos bucket</span>
                          </div>
                        </>
                      )}
                      {signupUploading === 'logo' && (
                        <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center gap-2 font-mono text-xs font-bold text-emerald-600 z-30">
                          <Clock className="w-4 h-4 animate-spin" /> UPLOADING...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Gallery */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">COMPANY SCHEME GALLERY (MULTIPLE)</label>
                    <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-all flex flex-col items-center justify-center gap-3 relative cursor-pointer min-h-[120px] group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSignupFileUpload(e, 'company-gallery', 'company_gallery')} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      <ImageIcon className="w-8 h-8 text-zinc-300 group-hover:text-emerald-500 transition-all" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-zinc-750">Click to add gallery image</p>
                        <span className="text-[10px] font-mono text-zinc-400">company-gallery bucket</span>
                      </div>
                      {signupUploading === 'company_gallery' && (
                        <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center gap-2 font-mono text-xs font-bold text-emerald-600 z-30">
                          <Clock className="w-4 h-4 animate-spin" /> UPLOADING...
                        </div>
                      )}
                    </div>
                    {contractorCompanyGalleryImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {contractorCompanyGalleryImages.map((img, i) => (
                          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-200">
                            <img src={img} alt="Gallery item" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveSignupFile(img, 'company_gallery')}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[10px] font-bold"
                            >
                              REMOVE
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {debugLogs.length > 0 && (
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl font-mono text-[11px] text-zinc-300 space-y-2 shadow-inner mt-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span>⚙️ Onboarding Process Console</span>
                      <span className="animate-pulse flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> LIVE STREAM
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin font-mono">
                      {debugLogs.map((log, i) => (
                        <div key={i} className={`flex items-start gap-1.5 leading-relaxed ${
                          log.status === 'success' ? 'text-emerald-400 font-bold' :
                          log.status === 'error' ? 'text-rose-400 font-bold' :
                          log.status === 'pending' ? 'text-amber-400' : 'text-zinc-400'
                        }`}>
                          <span className="flex-shrink-0">
                            {log.status === 'success' ? '✔' :
                             log.status === 'error' ? '✘' :
                             log.status === 'pending' ? '⏳' : 'ℹ'}
                          </span>
                          <p className="flex-1">{log.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {signupUploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-mono font-bold text-rose-600 flex items-center gap-2 mt-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {signupUploadError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#34D399] hover:bg-[#10B981] disabled:bg-zinc-400 text-white rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#34D399]/25 mt-8"
              >
                {signupUploading === 'onboarding_files' ? (
                  <>UPLOADING COMPANY LOGO & GALLERIES... <Clock className="w-4 h-4 animate-spin text-white" /></>
                ) : isSubmitting ? (
                  <>CREATING CONTRACTOR ACCOUNT... <Clock className="w-4 h-4 animate-spin" /></>
                ) : (
                  <>ONBOARD CONTRACTOR COMPANY PROFILE & POST VACANCY <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        )}
          </>
        )}

      </div>
    </div>
  );
}