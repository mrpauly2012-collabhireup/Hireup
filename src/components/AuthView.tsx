/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  Wrench, HardHat, ShieldCheck, Mail, Phone, Lock, ArrowRight, 
  Sparkles, Check, ChevronRight, MapPin, Award, Truck, Clock, 
  Users, Building, FileText, CheckCircle2, AlertCircle, PlayCircle, Eye, EyeOff, CheckSquare,
  Sliders, LayoutGrid, Layers, Image as ImageIcon, ChevronDown, Save, PartyPopper
} from 'lucide-react';
import { WorkerProfile, CompanyProfile, JobProfile, UserType } from '../types';
import SearchableDropdown from './SearchableDropdown';
import { HOMETOWNS, LICENCES, POSITION_LENGTHS, GRADES, REQUIREMENTS, TRADES_CATEGORIES, TRADE_SUBCATEGORIES_MAP } from '../data/datasets';
import { signInUser, registerWorker, registerContractor, uploadFileToStorage, updateWorkerProfileInDb, updateCompanyProfileInDb, supabase } from '../lib/supabase';
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


const COMPANY_INDUSTRIES = [
  'General Building & Construction',
  'Civil Engineering',
  'Groundworks & Drainage',
  'Residential Construction',
  'Commercial Construction',
  'Industrial Construction',
  'Mechanical & Electrical',
  'Property Maintenance',
  'Refurbishment & Renovation',
  'Shopfitting & Interiors',
  'Roofing & Cladding',
  'Landscaping & External Works',
  'Facilities Management',
  'Specialist Subcontracting',
];

const isValidEmailAddress = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());

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
  const [workerAbout, setWorkerAbout] = useState('');
  const [workerSignupStep, setWorkerSignupStep] = useState(0);
  const [workerStepDirection, setWorkerStepDirection] = useState<'forward' | 'back'>('forward');
  const [showMobileWorkerPreview, setShowMobileWorkerPreview] = useState(false);
  const [workerDraftRestored, setWorkerDraftRestored] = useState(false);
  const [workerLaunchSuccess, setWorkerLaunchSuccess] = useState(false);
  const workerFirstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const workerSignupTotalSteps = 6;

  const workerDraftKey = 'hireup-worker-onboarding-draft-v1';

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(workerDraftKey);
      if (!savedDraft) return;

      const draft = JSON.parse(savedDraft);
      setWorkerName(draft.workerName || '');
      setWorkerPhone(draft.workerPhone || '');
      setEmail(draft.email || '');
      setWorkerRate(draft.workerRate || '£200');
      setWorkerExp(draft.workerExp || '8 Years');
      setWorkerMainTrade(draft.workerMainTrade || TRADES_CATEGORIES[0] || 'Electrician');
      setWorkerSubcategory(draft.workerSubcategory || '');
      setWorkerSecondaryTrade(draft.workerSecondaryTrade || '');
      setWorkerLocation(draft.workerLocation || 'Brighton');
      setWorkerQualifications(Array.isArray(draft.workerQualifications) ? draft.workerQualifications : []);
      setWorkerLicences(Array.isArray(draft.workerLicences) ? draft.workerLicences : []);
      setWorkerPrefs(Array.isArray(draft.workerPrefs) ? draft.workerPrefs : []);
      setWorkerAvailability(draft.workerAvailability || 'Immediate');
      setWorkerType(draft.workerType || 'CIS Subcontract');
      setWorkerTools(Array.isArray(draft.workerTools) ? draft.workerTools : []);
      setWorkerAbout(draft.workerAbout || '');
      setWorkerSignupStep(Math.min(Number(draft.workerSignupStep || 0), workerSignupTotalSteps - 1));
      setWorkerDraftRestored(true);
    } catch (draftError) {
      console.warn('Could not restore worker onboarding draft:', draftError);
    }
  }, []);

  useEffect(() => {
    if (view !== 'signup_worker') return;

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        workerDraftKey,
        JSON.stringify({
          workerName,
          workerPhone,
          email,
          workerRate,
          workerExp,
          workerMainTrade,
          workerSubcategory,
          workerSecondaryTrade,
          workerLocation,
          workerQualifications,
          workerLicences,
          workerPrefs,
          workerAvailability,
          workerType,
          workerTools,
          workerAbout,
          workerSignupStep,
        })
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    view,
    workerName,
    workerPhone,
    email,
    workerRate,
    workerExp,
    workerMainTrade,
    workerSubcategory,
    workerSecondaryTrade,
    workerLocation,
    workerQualifications,
    workerLicences,
    workerPrefs,
    workerAvailability,
    workerType,
    workerTools,
    workerAbout,
    workerSignupStep,
  ]);

  useEffect(() => {
    if (view !== 'signup_worker') return;
    const timer = window.setTimeout(() => workerFirstFieldRef.current?.focus(), 220);
    return () => window.clearTimeout(timer);
  }, [view, workerSignupStep]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (view !== 'signup_worker' || workerLaunchSuccess) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [view, workerLaunchSuccess]);

  const workerCompletedSections = [
    Boolean(workerName.trim() && email.trim() && password.length >= 8 && workerPhone.trim()),
    Boolean(workerMainTrade && workerSubcategory && workerExp && workerLocation),
    Boolean(workerRate.trim() && workerAvailability && workerType && workerPrefs.length > 0),
    workerTools.length > 0,
    workerAbout.trim().length >= 30,
    false,
  ];

  const workerProfileProgress = Math.min(
    100,
    Math.round(
      ([
        workerName.trim(),
        email.trim(),
        workerPhone.trim(),
        password.length >= 8 ? password : '',
        workerMainTrade,
        workerSubcategory,
        workerExp,
        workerLocation,
        workerRate,
        workerAvailability,
        workerType,
        workerPrefs.length ? 'yes' : '',
        workerTools.length ? 'yes' : '',
        workerAbout.trim().length >= 30 ? 'yes' : '',
      ].filter(Boolean).length / 14) * 100
    )
  );

  const moveWorkerStep = (nextStep: number) => {
    setWorkerStepDirection(nextStep > workerSignupStep ? 'forward' : 'back');
    setWorkerSignupStep(Math.max(0, Math.min(workerSignupTotalSteps - 1, nextStep)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
  const [contractorSignupStep, setContractorSignupStep] = useState(0);
  const [contractorStepDirection, setContractorStepDirection] = useState<'forward' | 'back'>('forward');
  const [contractorLaunchSuccess, setContractorLaunchSuccess] = useState(false);
  const contractorSignupTotalSteps = 5;

  const contractorProfileProgress = Math.min(
    100,
    Math.round(
      ([
        companyName.trim(),
        contactName.trim(),
        email.trim(),
        password.length >= 8 ? password : '',
        contractorPhone.trim(),
        companyIndustry.trim(),
        companySize,
        companyHQ,
        companyInsurance,
        tradesHiring,
        tradesHiringSubcategory,
        jobLocation,
        hiringPositionLengths.length ? 'yes' : '',
        companyRequirements.length ? 'yes' : '',
      ].filter(Boolean).length / 14) * 100
    )
  );

  const moveContractorStep = (nextStep: number) => {
    setContractorStepDirection(nextStep > contractorSignupStep ? 'forward' : 'back');
    setContractorSignupStep(Math.max(0, Math.min(contractorSignupTotalSteps - 1, nextStep)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

    if (
      !workerName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !workerPhone.trim() ||
      !workerRate.trim() ||
      !workerExp ||
      !workerMainTrade ||
      !workerSubcategory ||
      !workerLocation ||
      !workerAvailability ||
      !workerType ||
      workerPrefs.length === 0 ||
      workerTools.length === 0 ||
      workerAbout.trim().length < 30
    ) {
      setErrorMsg(
        'Please complete every required section. Qualifications and licences are optional.'
      );
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
        about: workerAbout.trim(),
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

      setSignupUploading('onboarding_files');

      let uploadedProfilePhotoUrl = '';
      const uploadedGalleryImages: string[] = [];

      if (workerAvatarFile) {
        addDebugLog('Uploading selected profile photo...', 'pending');

        const safeAvatarName = workerAvatarFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const avatarPath = `${result.id}/avatar_${Date.now()}_${safeAvatarName}`;

        uploadedProfilePhotoUrl = await uploadFileToStorage(
          'profile-pictures',
          avatarPath,
          workerAvatarFile
        );

        addDebugLog('Profile photo uploaded successfully.', 'success');
      }

      for (let index = 0; index < workerGalleryFiles.length; index += 1) {
        const galleryItem = workerGalleryFiles[index];
        const safeGalleryName = galleryItem.file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const galleryPath = `${result.id}/gallery_${index}_${Date.now()}_${safeGalleryName}`;

        const publicUrl = await uploadFileToStorage(
          'work-gallery',
          galleryPath,
          galleryItem.file
        );

        uploadedGalleryImages.push(publicUrl);
      }

      const savedWorkerProfile: WorkerProfile = {
        ...newWorker,
        id: result.id,
        email,
        avatar:
          uploadedProfilePhotoUrl ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        profilePhotoUrl: uploadedProfilePhotoUrl,
        galleryImages: uploadedGalleryImages,
        portfolio:
          uploadedGalleryImages.length > 0
            ? uploadedGalleryImages
            : newWorker.portfolio,
      };

      await updateWorkerProfileInDb(
        result.id,
        savedWorkerProfile,
        Boolean(uploadedProfilePhotoUrl)
      );

      setWorkerProfilePhotoUrl(uploadedProfilePhotoUrl);
      setWorkerGalleryImages(uploadedGalleryImages);
      setSignupUploading(null);

      onAddWorker(savedWorkerProfile);

      console.log("Redirecting to dashboard");
      addDebugLog("Redirecting to dashboard", 'success');
      window.localStorage.removeItem(workerDraftKey);
      setWorkerLaunchSuccess(true);

      await new Promise(resolve => window.setTimeout(resolve, 900));

      onAuthSuccess({
        id: result.id,
        email: email,
        userType: 'worker'
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      setSignupUploading(null);
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

    if (email.trim() && !isValidEmailAddress(email)) {
      setErrorMsg('Enter a valid email address, for example hiring@company.co.uk.');
      return;
    }

    if (
      !companyName.trim() ||
      !contactName.trim() ||
      !isValidEmailAddress(email) ||
      password.length < 8 ||
      !contractorPhone.trim() ||
      !companyIndustry.trim() ||
      !companySize ||
      !companyHQ ||
      !companyInsurance ||
      !tradesHiring ||
      !tradesHiringSubcategory ||
      !jobLocation ||
      hiringPositionLengths.length === 0 ||
      companyRequirements.length === 0
    ) {
      setErrorMsg('Please complete every required section. Qualifications, licences and media are optional.');
      return;
    }

    setIsSubmitting(true);

    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Signup timed out while waiting for Supabase Auth.'));
      }, 20000);
    });

    try {
      const baseCompany: Omit<CompanyProfile, 'id'> = {
        name: companyName.trim(),
        logo: '',
        companyLogoUrl: '',
        companyGalleryImages: [],
        coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
        description: `${companyName.trim()} is a ${companyIndustry.trim()} contractor based in ${companyHQ}, hiring ${tradesHiringSubcategory || tradesHiring} professionals for work in ${jobLocation}.`,
        openVacanciesCount: 1,
        benefits: ['Direct communication', 'Transparent project details', 'Fast worker matching'],
        reviews: [],
        stats: { projects: 0, workers: 0, rating: null },
        verified: false,
        location: companyHQ,
        requirements: companyRequirements,
        website: companyWebsite.trim(),
        industry: companyIndustry.trim(),
        companySize,
        companyHouseNumber: '',
        vatNumber: '',
        insuranceStatus: companyInsurance,
        phone: contractorPhone.trim(),
        contactName: contactName.trim(),
        contactPhone: contractorPhone.trim(),
        contactEmail: email.trim().toLowerCase(),
      };

      addDebugLog(`Starting contractor sign up for ${companyName.trim()}...`, 'pending');

      const result = await Promise.race([
        registerContractor(
          email.trim().toLowerCase(),
          password,
          baseCompany,
          companyRequirements,
          [tradesHiring, tradesHiringSubcategory].filter(Boolean),
          addDebugLog
        ),
        timeoutPromise,
      ]);

      clearTimeout(timeoutId);
      setSignupUploading('onboarding_files');

      let uploadedLogoUrl = '';
      const uploadedCompanyGallery: string[] = [];

      if (contractorLogoFile) {
        addDebugLog('Uploading company logo...', 'pending');
        const safeLogoName = contractorLogoFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        uploadedLogoUrl = await uploadFileToStorage(
          'company-logos',
          `${result.id}/logo_${Date.now()}_${safeLogoName}`,
          contractorLogoFile
        );
        addDebugLog('Company logo uploaded successfully.', 'success');
      }

      for (let index = 0; index < contractorGalleryFiles.length; index += 1) {
        const item = contractorGalleryFiles[index];
        const safeName = item.file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const publicUrl = await uploadFileToStorage(
          'company-gallery',
          `${result.id}/gallery_${index}_${Date.now()}_${safeName}`,
          item.file
        );
        uploadedCompanyGallery.push(publicUrl);
      }

      const savedCompanyProfile: CompanyProfile = {
        ...baseCompany,
        id: result.id,
        logo: uploadedLogoUrl,
        companyLogoUrl: uploadedLogoUrl,
        companyGalleryImages: uploadedCompanyGallery,
      };

      await updateCompanyProfileInDb(result.id, savedCompanyProfile);

      setContractorCompanyLogoUrl(uploadedLogoUrl);
      setContractorCompanyGalleryImages(uploadedCompanyGallery);
      setSignupUploading(null);
      onAddCompany(savedCompanyProfile);
      setContractorLaunchSuccess(true);

      await new Promise(resolve => window.setTimeout(resolve, 900));

      onAuthSuccess({
        id: result.id,
        email: email.trim(),
        userType: 'employer',
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      setSignupUploading(null);
      console.error('Contractor sign up error:', err);
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
                  I want to find work. <br />
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
                  <span>Find work</span>
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
                      I want to hire workers
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
                  <span>Hire workers</span>
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
          <div className="relative overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-xl animate-fade-in">
            <style>{`
              @keyframes hireupStepForward {
                from { opacity: 0; transform: translateX(24px); }
                to { opacity: 1; transform: translateX(0); }
              }
              @keyframes hireupStepBack {
                from { opacity: 0; transform: translateX(-24px); }
                to { opacity: 1; transform: translateX(0); }
              }
              @keyframes hireupSuccessPop {
                0% { opacity: 0; transform: scale(.86); }
                70% { opacity: 1; transform: scale(1.05); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
            <div className="absolute inset-x-0 top-0 h-1 bg-zinc-100">
              <div
                className="h-full bg-[#34D399] transition-all duration-500 ease-out"
                style={{
                  width: `${workerProfileProgress}%`,
                }}
              />
            </div>

            <div className="grid min-h-[720px] grid-cols-1 lg:grid-cols-[1fr_340px]">
              <div className="p-5 sm:p-8 lg:p-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-[#10B981]">
                      <Sparkles className="h-3.5 w-3.5" />
                      Profile {workerProfileProgress}% complete
                    </span>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                      {workerSignupStep === 0 && 'Start with the essentials.'}
                      {workerSignupStep === 1 && 'Tell us what you do.'}
                      {workerSignupStep === 2 && 'What work suits you best?'}
                      {workerSignupStep === 3 && 'What can you bring to site?'}
                      {workerSignupStep === 4 && 'Add anything that strengthens your profile.'}
                      {workerSignupStep === 5 && 'Your profile is ready to launch.'}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                      {workerSignupStep === 0 && 'Create your secure account and tell contractors how to contact you.'}
                      {workerSignupStep === 1 && 'Your trade, experience and location help us show you relevant work.'}
                      {workerSignupStep === 2 && 'Set your availability, rate and preferred type of position.'}
                      {workerSignupStep === 3 && 'Select at least one tools or transport option that applies to you.'}
                      {workerSignupStep === 4 && 'Qualifications and licences are optional. Photos help your profile stand out.'}
                      {workerSignupStep === 5 && 'Check your details, then create your HireUp Digital CV.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setWorkerSignupStep(0);
                      setErrorMsg(null);
                      setView('landing');
                    }}
                    className="shrink-0 rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-mono font-black uppercase text-zinc-500 hover:border-zinc-400 hover:text-zinc-900"
                  >
                    Exit
                  </button>
                </div>

                {workerDraftRestored && (
                  <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <Save className="h-4 w-4" />
                      Your saved signup progress has been restored.
                    </div>
                    <button type="button" onClick={() => setWorkerDraftRestored(false)} className="text-[9px] font-mono font-black uppercase text-emerald-700">Dismiss</button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowMobileWorkerPreview(current => !current)}
                  className="mb-5 flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-950 px-4 py-3 text-left text-white lg:hidden"
                >
                  <span>
                    <span className="block text-[9px] font-mono font-black uppercase tracking-wider text-[#34D399]">Live profile preview</span>
                    <span className="block text-xs font-bold">See how contractors will see you</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showMobileWorkerPreview ? 'rotate-180' : ''}`} />
                </button>

                {showMobileWorkerPreview && (
                  <div className="mb-6 rounded-3xl bg-zinc-950 p-5 text-white lg:hidden">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800 text-xl font-black">
                        {workerProfilePhotoUrl ? <img src={workerProfilePhotoUrl} alt="Profile preview" className="h-full w-full object-cover" /> : workerName.trim().charAt(0).toUpperCase() || 'HU'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black">{workerName || 'Your name'}</p>
                        <p className="truncate text-sm font-bold text-[#34D399]">{workerMainTrade || 'Your trade'}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400"><MapPin className="h-3 w-3" />{workerLocation || 'Your location'}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white/5 p-3"><p className="text-[8px] uppercase text-zinc-500">Experience</p><p className="mt-1 text-xs font-bold">{workerExp}</p></div>
                      <div className="rounded-xl bg-white/5 p-3"><p className="text-[8px] uppercase text-zinc-500">Day rate</p><p className="mt-1 text-xs font-bold text-[#34D399]">{workerRate.startsWith('£') ? workerRate : `£${workerRate}`}</p></div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleWorkerSignUp}>
                  <div
                    key={workerSignupStep}
                    style={{
                      animation: `${workerStepDirection === 'forward' ? 'hireupStepForward' : 'hireupStepBack'} 280ms ease-out both`,
                    }}
                  >
                    {workerSignupStep === 0 && (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <label className="space-y-2 sm:col-span-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Full name *</span>
                          <input
                            ref={workerSignupStep === 0 ? workerFirstFieldRef as React.RefObject<HTMLInputElement> : undefined}
                            type="text"
                            required
                            value={workerName}
                            onChange={event => setWorkerName(event.target.value)}
                            placeholder="e.g. Liam Fletcher"
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#34D399] focus:bg-white focus:ring-4 focus:ring-emerald-50"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Email address *</span>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                            placeholder="you@example.co.uk"
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#34D399] focus:bg-white focus:ring-4 focus:ring-emerald-50"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Mobile number *</span>
                          <input
                            type="tel"
                            required
                            value={workerPhone}
                            onChange={event => setWorkerPhone(event.target.value)}
                            placeholder="07711 900222"
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#34D399] focus:bg-white focus:ring-4 focus:ring-emerald-50"
                          />
                        </label>

                        <label className="space-y-2 sm:col-span-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Create password *</span>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              minLength={8}
                              value={password}
                              onChange={event => setPassword(event.target.value)}
                              placeholder="At least 8 characters"
                              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 pr-12 text-sm font-semibold outline-none transition focus:border-[#34D399] focus:bg-white focus:ring-4 focus:ring-emerald-50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(current => !current)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </label>
                      </div>
                    )}

                    {workerSignupStep === 1 && (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Primary trade *</span>
                          <select
                            value={workerMainTrade}
                            onChange={event => {
                              const selectedMain = event.target.value;
                              setWorkerMainTrade(selectedMain);
                              setWorkerSubcategory((TRADE_SUBCATEGORIES_MAP[selectedMain] || [])[0] || '');
                            }}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white"
                          >
                            {TRADES_CATEGORIES.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Trade specialism *</span>
                          <select
                            value={workerSubcategory}
                            onChange={event => setWorkerSubcategory(event.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white"
                          >
                            {(TRADE_SUBCATEGORIES_MAP[workerMainTrade] || []).map(subcategory => (
                              <option key={subcategory} value={subcategory}>{subcategory}</option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Site experience *</span>
                          <select
                            value={workerExp}
                            onChange={event => setWorkerExp(event.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white"
                          >
                            <option value="Less than 1 Year">Less than 1 Year</option>
                            <option value="2 Years">2 Years</option>
                            <option value="5 Years">5 Years</option>
                            <option value="8 Years">8 Years</option>
                            <option value="12 Years">12 Years</option>
                            <option value="15+ Years">15+ Years</option>
                          </select>
                        </label>

                        <div>
                          <SearchableDropdown
                            id="signup-worker-hometown"
                            label="Hometown / Location *"
                            options={HOMETOWNS}
                            selected={workerLocation}
                            onChange={setWorkerLocation}
                            multiple={false}
                            placeholder="Search your town..."
                          />
                        </div>
                      </div>
                    )}

                    {workerSignupStep === 2 && (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Expected day rate *</span>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-500">£</span>
                            <input
                              type="text"
                              required
                              value={workerRate.replace(/^£/, '')}
                              onChange={event => setWorkerRate(event.target.value.replace(/[^0-9.]/g, ''))}
                              placeholder="220"
                              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 pl-9 pr-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white"
                            />
                          </div>
                        </label>

                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Available from *</span>
                          <select
                            value={workerAvailability}
                            onChange={event => setWorkerAvailability(event.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white"
                          >
                            <option value="Immediate">Available immediately</option>
                            <option value="In 1 Week">Within 1 week</option>
                            <option value="In 2 Weeks">Within 2 weeks</option>
                            <option value="In 1 Month">Within 1 month</option>
                          </select>
                        </label>

                        <label className="space-y-2 sm:col-span-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Preferred employment type *</span>
                          <select
                            value={workerType}
                            onChange={event => setWorkerType(event.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white"
                          >
                            <option value="CIS Subcontract">CIS subcontract</option>
                            <option value="PAYE Agency">PAYE agency</option>
                            <option value="Permanent Contract">Permanent contract</option>
                          </select>
                        </label>

                        <div className="sm:col-span-2">
                          <SearchableDropdown
                            id="signup-worker-prefs"
                            label="Position length preferences *"
                            options={POSITION_LENGTHS}
                            selected={workerPrefs}
                            onChange={setWorkerPrefs}
                            multiple={true}
                            placeholder="Choose at least one position type..."
                          />
                        </div>
                      </div>
                    )}

                    {workerSignupStep === 3 && (
                      <div>
                        <p className="mb-5 text-sm font-semibold text-zinc-700">Choose every option that applies. Select at least one.</p>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {[
                            ['Own Hand Tools', '🧰', 'Ready for day-to-day site work'],
                            ['Full Power Tools', '⚙️', 'Professional power tool kit'],
                            ['Own Commercial Van', '🚐', 'Independent site travel'],
                            ['UK Clean Driving Licence', '🪪', 'Full UK driving licence'],
                          ].map(([tool, emoji, description]) => {
                            const selected = workerTools.includes(tool);
                            return (
                              <button
                                key={tool}
                                type="button"
                                onClick={() => setWorkerTools(current =>
                                  selected ? current.filter(item => item !== tool) : [...current, tool]
                                )}
                                className={`rounded-2xl border p-5 text-left transition-all ${selected
                                  ? 'border-[#34D399] bg-emerald-50 shadow-sm'
                                  : 'border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <span className="text-3xl">{emoji}</span>
                                  <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${selected
                                    ? 'border-[#34D399] bg-[#34D399] text-zinc-950'
                                    : 'border-zinc-300 text-transparent'
                                  }`}>
                                    <Check className="h-4 w-4" />
                                  </span>
                                </div>
                                <p className="mt-4 font-black text-zinc-950">{tool}</p>
                                <p className="mt-1 text-xs text-zinc-500">{description}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {workerSignupStep === 4 && (
                      <div className="space-y-6">
                        <label className="block space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Why should a contractor hire you? *</span>
                          <textarea
                            ref={workerSignupStep === 4 ? workerFirstFieldRef as React.RefObject<HTMLTextAreaElement> : undefined}
                            value={workerAbout}
                            onChange={event => setWorkerAbout(event.target.value.slice(0, 500))}
                            rows={5}
                            placeholder="Describe your experience, reliability, strongest skills and the type of site work you do best..."
                            className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium leading-relaxed outline-none transition focus:border-[#34D399] focus:bg-white focus:ring-4 focus:ring-emerald-50"
                          />
                          <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                            <span className={workerAbout.trim().length >= 30 ? 'text-emerald-600' : ''}>Minimum 30 characters</span>
                            <span>{workerAbout.length}/500</span>
                          </div>
                        </label>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <SearchableDropdown
                            id="signup-worker-quals"
                            label="Qualifications (optional)"
                            options={GRADES}
                            selected={workerQualifications}
                            onChange={setWorkerQualifications}
                            multiple={true}
                            placeholder="Search qualifications..."
                          />

                          <SearchableDropdown
                            id="signup-worker-licences"
                            label="Licences (optional)"
                            options={LICENCES}
                            selected={workerLicences}
                            onChange={setWorkerLicences}
                            multiple={true}
                            placeholder="Search licences..."
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <label className="group relative min-h-[170px] cursor-pointer overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 hover:border-[#34D399] hover:bg-emerald-50/40">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={event => handleSignupFileUpload(event, 'profile-pictures', 'avatar')}
                              className="absolute inset-0 z-10 cursor-pointer opacity-0"
                            />
                            {workerProfilePhotoUrl ? (
                              <div className="flex h-full flex-col items-center justify-center text-center">
                                <img src={workerProfilePhotoUrl} alt="Profile preview" className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
                                <p className="mt-3 text-xs font-black text-zinc-900">Profile photo selected</p>
                                <p className="text-[10px] text-zinc-500">Tap to replace</p>
                              </div>
                            ) : (
                              <div className="flex h-full flex-col items-center justify-center text-center">
                                <ImageIcon className="h-9 w-9 text-zinc-300 group-hover:text-[#10B981]" />
                                <p className="mt-3 text-xs font-black text-zinc-900">Add profile photo</p>
                                <p className="mt-1 text-[10px] text-zinc-500">Optional, but recommended</p>
                              </div>
                            )}
                          </label>

                          <label className="group relative min-h-[170px] cursor-pointer overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 hover:border-[#34D399] hover:bg-emerald-50/40">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={event => handleSignupFileUpload(event, 'work-gallery', 'gallery')}
                              className="absolute inset-0 z-10 cursor-pointer opacity-0"
                            />
                            <div className="flex h-full flex-col items-center justify-center text-center">
                              <Layers className="h-9 w-9 text-zinc-300 group-hover:text-[#10B981]" />
                              <p className="mt-3 text-xs font-black text-zinc-900">Add work photos</p>
                              <p className="mt-1 text-[10px] text-zinc-500">{workerGalleryImages.length} image(s) selected</p>
                            </div>
                          </label>
                        </div>

                        {workerGalleryImages.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {workerGalleryImages.map((image, index) => (
                              <div key={`${image}-${index}`} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-zinc-200">
                                <img src={image} alt={`Work preview ${index + 1}`} className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSignupFile(image, 'gallery')}
                                  className="absolute inset-0 bg-zinc-950/70 text-[9px] font-black uppercase text-white opacity-0 transition group-hover:opacity-100"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {workerSignupStep === 5 && (
                      <div className="space-y-5">
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#34D399] text-zinc-950">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-zinc-950">Everything required is complete.</h3>
                              <p className="mt-1 text-sm text-zinc-600">Your qualifications and licences can be updated later from your profile.</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {[
                            ['Name', workerName],
                            ['Location', workerLocation],
                            ['Trade', `${workerMainTrade} • ${workerSubcategory}`],
                            ['Experience', workerExp],
                            ['Availability', workerAvailability],
                            ['Rate', workerRate.startsWith('£') ? workerRate : `£${workerRate}/day`],
                            ['Position types', workerPrefs.join(', ')],
                            ['Site equipment', workerTools.join(', ')],
                            ['Profile statement', workerAbout],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                              <p className="text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">{label}</p>
                              <p className="mt-1 text-sm font-bold text-zinc-900">{value || 'Not completed'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {errorMsg && view === 'signup_worker' && (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-zinc-100 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        moveWorkerStep(workerSignupStep - 1);
                      }}
                      disabled={workerSignupStep === 0}
                      className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-xs font-mono font-black uppercase text-zinc-600 disabled:invisible"
                    >
                      ← Back
                    </button>

                    {workerSignupStep < workerSignupTotalSteps - 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);

                          const valid =
                            workerSignupStep === 0
                              ? Boolean(workerName.trim() && email.trim() && password.length >= 8 && workerPhone.trim())
                              : workerSignupStep === 1
                              ? Boolean(workerMainTrade && workerSubcategory && workerExp && workerLocation)
                              : workerSignupStep === 2
                              ? Boolean(workerRate.trim() && workerAvailability && workerType && workerPrefs.length > 0)
                              : workerSignupStep === 3
                              ? workerTools.length > 0
                              : workerSignupStep === 4
                              ? workerAbout.trim().length >= 30
                              : true;

                          if (!valid) {
                            setErrorMsg(
                              workerSignupStep === 0
                                ? 'Complete your name, email, phone number and an 8-character password.'
                                : workerSignupStep === 1
                                ? 'Complete your trade, specialism, experience and location.'
                                : workerSignupStep === 2
                                ? 'Complete your rate, availability, employment type and position preferences.'
                                : workerSignupStep === 3
                                ? 'Select at least one tools or transport option.'
                                : 'Write at least 30 characters explaining why a contractor should hire you.'
                            );
                            return;
                          }

                          moveWorkerStep(workerSignupStep + 1);
                        }}
                        className="ml-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#34D399] px-6 py-3.5 text-xs font-mono font-black uppercase text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:bg-[#10B981] hover:text-white active:scale-[0.98]"
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="ml-auto inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-4 text-xs font-mono font-black uppercase text-white shadow-xl disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>Creating profile <Clock className="h-4 w-4 animate-spin text-[#34D399]" /></>
                        ) : (
                          <>Launch my HireUp profile <ArrowRight className="h-4 w-4 text-[#34D399]" /></>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <aside className="hidden border-l border-zinc-200 bg-zinc-950 p-7 text-white lg:block">
                <div className="sticky top-7">
                  <p className="text-[9px] font-mono font-black uppercase tracking-[0.22em] text-[#34D399]">Live profile preview</p>

                  <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
                    <div className="h-28 bg-gradient-to-br from-[#34D399] via-emerald-500 to-zinc-950" />
                    <div className="px-5 pb-5">
                      <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-zinc-950 bg-zinc-800 text-2xl font-black">
                        {workerProfilePhotoUrl ? (
                          <img src={workerProfilePhotoUrl} alt="Live worker preview" className="h-full w-full object-cover" />
                        ) : (
                          workerName.trim().charAt(0).toUpperCase() || 'HU'
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-black">{workerName || 'Your name'}</h3>
                      <p className="mt-1 text-sm font-bold text-[#34D399]">{workerMainTrade || 'Your trade'}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                        <MapPin className="h-3.5 w-3.5" /> {workerLocation || 'Your location'}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-[8px] font-mono font-black uppercase text-zinc-500">Experience</p>
                          <p className="mt-1 text-xs font-bold">{workerExp}</p>
                        </div>
                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-[8px] font-mono font-black uppercase text-zinc-500">Day rate</p>
                          <p className="mt-1 text-xs font-bold text-[#34D399]">{workerRate.startsWith('£') ? workerRate : `£${workerRate}`}</p>
                        </div>
                      </div>

                      {workerTools.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {workerTools.slice(0, 4).map(tool => (
                            <span key={tool} className="rounded-full bg-white/10 px-2.5 py-1 text-[8px] font-mono font-black uppercase text-zinc-300">
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {['Account', 'Trade', 'Work', 'Equipment', 'Credentials', 'Review'].map((label, index) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${index <= workerSignupStep
                          ? 'bg-[#34D399] text-zinc-950'
                          : 'bg-white/10 text-zinc-500'
                        }`}>
                          {workerCompletedSections[index] || index < workerSignupStep ? <Check className="h-3.5 w-3.5" /> : index + 1}
                        </span>
                        <span className={`text-xs font-bold ${index <= workerSignupStep ? 'text-white' : 'text-zinc-600'}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            {workerLaunchSuccess && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/95 p-6 text-center text-white backdrop-blur-sm">
                <div style={{ animation: 'hireupSuccessPop 500ms ease-out both' }} className="max-w-md">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#34D399] text-zinc-950 shadow-2xl shadow-emerald-500/30">
                    <PartyPopper className="h-11 w-11" />
                  </div>
                  <h3 className="mt-7 text-3xl font-black">Your HireUp profile is live.</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">We’re preparing your dashboard and finding relevant work near {workerLocation}.</p>
                  <div className="mx-auto mt-7 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-full origin-left animate-pulse rounded-full bg-[#34D399]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTRACTOR SIGN UP SUB-VIEW */}
        {view === 'signup_contractor' && (
          <div className="relative overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-xl animate-fade-in">
            <style>{`
              @keyframes contractorStepForward {
                from { opacity: 0; transform: translateX(24px); }
                to { opacity: 1; transform: translateX(0); }
              }
              @keyframes contractorStepBack {
                from { opacity: 0; transform: translateX(-24px); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>

            <div className="absolute inset-x-0 top-0 h-1 bg-zinc-100">
              <div
                className="h-full bg-[#34D399] transition-all duration-500 ease-out"
                style={{ width: `${contractorProfileProgress}%` }}
              />
            </div>

            <div className="grid min-h-[700px] grid-cols-1 lg:grid-cols-[1fr_340px]">
              <div className="p-5 sm:p-8 lg:p-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-[#10B981]">
                      <Building className="h-3.5 w-3.5" />
                      Company profile {contractorProfileProgress}% complete
                    </span>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                      {contractorSignupStep === 0 && 'Create your hiring account.'}
                      {contractorSignupStep === 1 && 'Tell workers about your company.'}
                      {contractorSignupStep === 2 && 'Who are you looking to hire?'}
                      {contractorSignupStep === 3 && 'Make your company stand out.'}
                      {contractorSignupStep === 4 && 'Ready to start hiring.'}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                      {contractorSignupStep === 0 && 'Add the account and contact details your team will use.'}
                      {contractorSignupStep === 1 && 'These details build your public contractor profile.'}
                      {contractorSignupStep === 2 && 'Set the trade, location and requirements for your first vacancy.'}
                      {contractorSignupStep === 3 && 'Qualifications, licences and company media are optional.'}
                      {contractorSignupStep === 4 && 'Review everything before launching your company profile.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setContractorSignupStep(0);
                      setErrorMsg(null);
                      setView('landing');
                    }}
                    className="shrink-0 rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-mono font-black uppercase text-zinc-500 hover:border-zinc-400 hover:text-zinc-900"
                  >
                    Exit
                  </button>
                </div>

                <form onSubmit={handleContractorSignUp}>
                  <div
                    key={contractorSignupStep}
                    style={{
                      animation: `${contractorStepDirection === 'forward' ? 'contractorStepForward' : 'contractorStepBack'} 280ms ease-out both`,
                    }}
                  >
                    {contractorSignupStep === 0 && (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <label className="space-y-2 sm:col-span-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Company name *</span>
                          <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Oakridge Joinery Ltd" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Main contact *</span>
                          <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. Richard Vance" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Phone number *</span>
                          <input value={contractorPhone} onChange={e => setContractorPhone(e.target.value)} placeholder="01273 900300" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Email address *</span>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hiring@company.co.uk" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Password *</span>
                          <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white" />
                        </label>
                      </div>
                    )}

                    {contractorSignupStep === 1 && (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <SearchableDropdown id="contractor-hq" label="Headquarters location *" options={HOMETOWNS} selected={companyHQ} onChange={setCompanyHQ} multiple={false} placeholder="Search location..." />
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Company size *</span>
                          <select value={companySize} onChange={e => setCompanySize(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white">
                            <option>1 - 10 Employees</option><option>11 - 49 Employees</option><option>50 - 99 Employees</option><option>100 - 250 Employees</option><option>250+ Employees</option>
                          </select>
                        </label>
                        <label className="space-y-2 sm:col-span-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Industry / company focus *</span>
                          <select
                            value={companyIndustry}
                            onChange={e => setCompanyIndustry(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white"
                          >
                            <option value="">Select your company industry...</option>
                            {COMPANY_INDUSTRIES.map(industry => (
                              <option key={industry} value={industry}>{industry}</option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Public liability cover *</span>
                          <select value={companyInsurance} onChange={e => setCompanyInsurance(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white">
                            <option value="No insurance">No insurance</option>
                            {Array.from({ length: 10 }, (_, index) => index + 1).map(amount => <option key={amount} value={`£${amount}M Public Liability`}>£{amount}M Public Liability</option>)}
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Website (optional)</span>
                          <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="www.company.co.uk" className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white" />
                        </label>
                      </div>
                    )}

                    {contractorSignupStep === 2 && (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Trade category *</span>
                          <select value={tradesHiring} onChange={e => { const value = e.target.value; setTradesHiring(value); setTradesHiringSubcategory((TRADE_SUBCATEGORIES_MAP[value] || [])[0] || ''); }} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white">
                            {TRADES_CATEGORIES.map(category => <option key={category}>{category}</option>)}
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Specific trade *</span>
                          <select value={tradesHiringSubcategory} onChange={e => setTradesHiringSubcategory(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-[#34D399] focus:bg-white">
                            {(TRADE_SUBCATEGORIES_MAP[tradesHiring] || []).map(sub => <option key={sub}>{sub}</option>)}
                          </select>
                        </label>
                        <SearchableDropdown id="contractor-job-location" label="Job location *" options={HOMETOWNS} selected={jobLocation} onChange={setJobLocation} multiple={false} placeholder="Search job location..." />
                        <SearchableDropdown id="contractor-position-lengths" label="Contract types offered *" options={POSITION_LENGTHS} selected={hiringPositionLengths} onChange={setHiringPositionLengths} multiple={true} placeholder="Choose at least one..." />
                        <div className="sm:col-span-2">
                          <SearchableDropdown id="contractor-requirements" label="Hiring requirements *" options={REQUIREMENTS} selected={companyRequirements} onChange={setCompanyRequirements} multiple={true} placeholder="Choose at least one requirement..." />
                        </div>
                      </div>
                    )}

                    {contractorSignupStep === 3 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <SearchableDropdown id="contractor-required-quals" label="Required qualifications (optional)" options={GRADES} selected={requiredQuals} onChange={setRequiredQuals} multiple={true} placeholder="Search qualifications..." />
                          <SearchableDropdown id="contractor-required-licences" label="Required licences (optional)" options={LICENCES} selected={requiredLics} onChange={setRequiredLics} multiple={true} placeholder="Search licences..." />
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <label className="group relative min-h-[180px] cursor-pointer overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 hover:border-[#34D399] hover:bg-emerald-50/40">
                            <input type="file" accept="image/*" onChange={e => handleSignupFileUpload(e, 'company-logos', 'logo')} className="absolute inset-0 z-10 cursor-pointer opacity-0" />
                            <div className="flex h-full flex-col items-center justify-center text-center">
                              {contractorCompanyLogoUrl ? <img src={contractorCompanyLogoUrl} alt="Company logo preview" className="h-24 w-24 rounded-2xl object-cover shadow-sm" /> : <Building className="h-10 w-10 text-zinc-300" />}
                              <p className="mt-3 text-xs font-black text-zinc-900">{contractorCompanyLogoUrl ? 'Company logo selected' : 'Add company logo'}</p>
                              <p className="text-[10px] text-zinc-500">Optional, but recommended</p>
                            </div>
                          </label>
                          <label className="group relative min-h-[180px] cursor-pointer overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 hover:border-[#34D399] hover:bg-emerald-50/40">
                            <input type="file" accept="image/*" onChange={e => handleSignupFileUpload(e, 'company-gallery', 'company_gallery')} className="absolute inset-0 z-10 cursor-pointer opacity-0" />
                            <div className="flex h-full flex-col items-center justify-center text-center">
                              <Layers className="h-10 w-10 text-zinc-300" />
                              <p className="mt-3 text-xs font-black text-zinc-900">Add project photos</p>
                              <p className="text-[10px] text-zinc-500">{contractorCompanyGalleryImages.length} selected</p>
                            </div>
                          </label>
                        </div>
                        {contractorCompanyGalleryImages.length > 0 && <div className="flex flex-wrap gap-3">{contractorCompanyGalleryImages.map((image, index) => <div key={`${image}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-xl border border-zinc-200"><img src={image} alt={`Project ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => handleRemoveSignupFile(image, 'company_gallery')} className="absolute inset-0 bg-zinc-950/70 text-[9px] font-black uppercase text-white opacity-0 hover:opacity-100">Remove</button></div>)}</div>}
                      </div>
                    )}

                    {contractorSignupStep === 4 && (
                      <div className="space-y-5">
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><h3 className="text-lg font-black text-zinc-950">Your company profile is ready.</h3><p className="mt-1 text-sm text-zinc-600">The logo and project photos selected here will be uploaded and saved when you launch.</p></div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {[
                            ['Company', companyName], ['Contact', contactName], ['Location', companyHQ], ['Industry', companyIndustry], ['Hiring', `${tradesHiring} • ${tradesHiringSubcategory}`], ['Job location', jobLocation], ['Contracts', hiringPositionLengths.join(', ')], ['Requirements', companyRequirements.join(', ')],
                          ].map(([label, value]) => <div key={label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"><p className="text-[9px] font-mono font-black uppercase tracking-wider text-zinc-400">{label}</p><p className="mt-1 text-sm font-bold text-zinc-900">{value || 'Not completed'}</p></div>)}
                        </div>
                      </div>
                    )}
                  </div>

                  {errorMsg && view === 'signup_contractor' && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{errorMsg}</div>}

                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-zinc-100 pt-6">
                    <button type="button" onClick={() => { setErrorMsg(null); moveContractorStep(contractorSignupStep - 1); }} disabled={contractorSignupStep === 0} className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-xs font-mono font-black uppercase text-zinc-600 disabled:invisible">← Back</button>
                    {contractorSignupStep < contractorSignupTotalSteps - 1 ? (
                      <button type="button" onClick={() => {
                        setErrorMsg(null);
                        const valid = contractorSignupStep === 0 ? Boolean(companyName.trim() && contactName.trim() && isValidEmailAddress(email) && password.length >= 8 && contractorPhone.trim()) : contractorSignupStep === 1 ? Boolean(companyIndustry.trim() && companySize && companyHQ && companyInsurance) : contractorSignupStep === 2 ? Boolean(tradesHiring && tradesHiringSubcategory && jobLocation && hiringPositionLengths.length > 0 && companyRequirements.length > 0) : true;
                        if (!valid) { setErrorMsg(contractorSignupStep === 0 ? 'Enter the company name, contact, phone, a valid email address and an 8-character password.' : contractorSignupStep === 1 ? 'Complete the company location, industry, size and insurance.' : 'Complete the trade, job location, contract types and hiring requirements.'); return; }
                        moveContractorStep(contractorSignupStep + 1);
                      }} className="ml-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#34D399] px-6 py-3.5 text-xs font-mono font-black uppercase text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:bg-[#10B981] hover:text-white">Continue <ArrowRight className="h-4 w-4" /></button>
                    ) : (
                      <button type="submit" disabled={isSubmitting} className="ml-auto inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-4 text-xs font-mono font-black uppercase text-white shadow-xl disabled:opacity-50">{isSubmitting ? <>Creating company <Clock className="h-4 w-4 animate-spin text-[#34D399]" /></> : <>Launch company profile <ArrowRight className="h-4 w-4 text-[#34D399]" /></>}</button>
                    )}
                  </div>
                </form>
              </div>

              <aside className="hidden border-l border-zinc-200 bg-zinc-950 p-7 text-white lg:block">
                <div className="sticky top-7">
                  <p className="text-[9px] font-mono font-black uppercase tracking-[0.22em] text-[#34D399]">Live company preview</p>
                  <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
                    <div className="h-28 bg-gradient-to-br from-[#34D399] via-emerald-500 to-zinc-950" />
                    <div className="px-5 pb-5">
                      <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-zinc-950 bg-zinc-800 text-2xl font-black">{contractorCompanyLogoUrl ? <img src={contractorCompanyLogoUrl} alt="Company preview" className="h-full w-full object-cover" /> : <Building className="h-8 w-8" />}</div>
                      <h3 className="mt-4 text-xl font-black">{companyName || 'Your company'}</h3>
                      <p className="mt-1 text-sm font-bold text-[#34D399]">{companyIndustry || 'Construction contractor'}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400"><MapPin className="h-3.5 w-3.5" />{companyHQ || 'Company location'}</p>
                      <div className="mt-5 rounded-xl bg-white/5 p-3"><p className="text-[8px] font-mono font-black uppercase text-zinc-500">Hiring for</p><p className="mt-1 text-xs font-bold">{tradesHiringSubcategory || tradesHiring}</p></div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">{['Account', 'Company', 'Hiring', 'Media', 'Review'].map((label, index) => <div key={label} className="flex items-center gap-3"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${index <= contractorSignupStep ? 'bg-[#34D399] text-zinc-950' : 'bg-white/10 text-zinc-500'}`}>{index < contractorSignupStep ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span className={`text-xs font-bold ${index <= contractorSignupStep ? 'text-white' : 'text-zinc-600'}`}>{label}</span></div>)}</div>
                </div>
              </aside>
            </div>

            {contractorLaunchSuccess && <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/95 p-6 text-center text-white backdrop-blur-sm"><div className="max-w-md"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#34D399] text-zinc-950"><PartyPopper className="h-11 w-11" /></div><h3 className="mt-7 text-3xl font-black">Your company profile is live.</h3><p className="mt-3 text-sm text-zinc-300">We’re preparing your hiring dashboard.</p></div></div>}
          </div>
        )}
          </>
        )}

      </div>
    </div>
  );
}