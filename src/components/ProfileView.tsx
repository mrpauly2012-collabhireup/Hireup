/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Award, ShieldCheck, MapPin, Star, Calendar, Users, Briefcase, 
  Wrench, Hammer, Phone, Mail, Clock, Plus, Check, Edit2, X, Image as ImageIcon,
  Truck, Building, Globe, Heart, ExternalLink, ArrowRight, Send, UserCheck, 
  FileCheck, ShieldAlert, Sparkles, CheckCircle2, AlertCircle, Bookmark, ClipboardCheck,
  Flag, Trash2, Loader2, Upload, FileText
} from 'lucide-react';
import { WorkerProfile, CompanyProfile, UserType, JobProfile } from '../types';
import SearchableDropdown from './SearchableDropdown';
import { uploadFileToStorage } from '../lib/supabase';
import { HOMETOWNS, LICENCES, POSITION_LENGTHS, GRADES, REQUIREMENTS, TRADES_CATEGORIES } from '../data/datasets';

interface ProfileViewProps {
  userType: UserType;
  workerProfile: WorkerProfile | null;
  companyProfile: CompanyProfile | null;
  jobs: JobProfile[];
  reviews?: any[];
  interviews?: any[];
  currentUserId?: string;
  onUpdateWorker: (updated: WorkerProfile) => void;
  onUpdateCompany: (updated: CompanyProfile) => void;
  onReportReview?: (reviewId: string, reason: string) => void;
  onModerateReview?: (reviewId: string, action: 'approve' | 'delete') => void;
}

const EMPTY_WORKER_PROFILE = {
  id: '',
  name: '',
  trade: '',
  subcategory: '',
  experience: '',
  qualifications: [],
  location: '',
  availability: '',
  payRate: '',
  rating: 0,
  reviewsCount: 0,
  verified: false,
  verifiedBadges: [],
  portfolio: [],
  workHistory: [],
  toolsAndTransport: [],
  about: '',
  reviews: [],
  references: [],
  phone: '',
  email: '',
  avatar: '',
  coverImage: '',
  licences: [],
  positionLengths: [],
  profilePhotoUrl: '',
  galleryImages: [],
  cvUrl: '',
  certificateFiles: [],
  licenceImages: []
} as WorkerProfile;

const EMPTY_COMPANY_PROFILE = {
  id: '',
  name: '',
  logo: '',
  coverImage: '',
  description: '',
  openVacanciesCount: 0,
  benefits: [],
  verified: false,
  location: '',
  stats: { projects: 0, workers: 0, rating: 0 },
  reviews: [],
  requirements: [],
  website: '',
  industry: '',
  companySize: '',
  companyHouseNumber: '',
  vatNumber: '',
  insuranceStatus: '',
  phone: '',
  companyLogoUrl: '',
  companyGalleryImages: [],
  verificationDocuments: [],
  publicLiabilityInsurance: '',
  employersLiabilityInsurance: '',
  businessAddress: '',
  postcode: '',
  contactName: '',
  contactPhone: '',
  contactEmail: ''
} as CompanyProfile;

export default function ProfileView({
  userType,
  workerProfile: providedWorkerProfile,
  companyProfile: providedCompanyProfile,
  jobs,
  reviews = [],
  interviews = [],
  currentUserId,
  onUpdateWorker,
  onUpdateCompany,
  onReportReview,
  onModerateReview
}: ProfileViewProps) {
  const workerProfile = providedWorkerProfile ?? EMPTY_WORKER_PROFILE;
  const companyProfile = providedCompanyProfile ?? EMPTY_COMPANY_PROFILE;

  const profileId = userType === 'worker' ? workerProfile.id : companyProfile.id;

  // Tabs toggle inside profile: 'live' (Digital CV public view) vs 'edit' (Update settings form)
  const [profileMode, setProfileMode] = useState<'live' | 'edit'>('live');

  // Lightbox for gallery photos
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Real-time toast notifications
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'info' | 'error'>('success');

  // Edit fields for worker
  const [workerName, setWorkerName] = useState(workerProfile.name);
  const [workerPhone, setWorkerPhone] = useState(workerProfile.phone || '');
  const [workerTrade, setWorkerTrade] = useState(workerProfile.trade);
  const [workerSubcategory, setWorkerSubcategory] = useState(workerProfile.subcategory || '');
  const [workerLocation, setWorkerLocation] = useState(workerProfile.location);
  const [workerAbout, setWorkerAbout] = useState(workerProfile.about || '');
  const [workerExperience, setWorkerExperience] = useState(workerProfile.experience || '8 Years');
  const [workerQualifications, setWorkerQualifications] = useState<string[]>(workerProfile.qualifications || []);
  const [workerLicences, setWorkerLicences] = useState<string[]>(workerProfile.licences || []);
  const [workerPositionLengths, setWorkerPositionLengths] = useState<string[]>(workerProfile.positionLengths || []);

  const [workerHourlyRate, setWorkerHourlyRate] = useState(() => {
    if (!workerProfile.payRate) return '£25/hr';
    const parts = workerProfile.payRate.split(' - ');
    return parts[0] || '£25/hr';
  });
  const [workerDayRate, setWorkerDayRate] = useState(() => {
    if (!workerProfile.payRate) return '£200/day';
    const parts = workerProfile.payRate.split(' - ');
    return parts[1] || parts[0] || '£200/day';
  });

  const [ownTools, setOwnTools] = useState(() => {
    return workerProfile.toolsAndTransport?.some(t => t.toLowerCase().includes('tool')) ?? false;
  });
  const [ownVan, setOwnVan] = useState(() => {
    return workerProfile.toolsAndTransport?.some(t => t.toLowerCase().includes('van')) ?? false;
  });

  // Edit fields for company
  const [companyName, setCompanyName] = useState(companyProfile.name);
  const [companyDesc, setCompanyDesc] = useState(companyProfile.description || '');
  const [companyLoc, setCompanyLoc] = useState(companyProfile.location || '');
  const [companyWebsite, setCompanyWebsite] = useState(companyProfile.website || '');
  const [companyIndustry, setCompanyIndustry] = useState(companyProfile.industry || '');
  const [companySize, setCompanySize] = useState(companyProfile.companySize || '');
  const [companyHouseNumber, setCompanyHouseNumber] = useState(companyProfile.companyHouseNumber || '');
  const [companyVatNumber, setCompanyVatNumber] = useState(companyProfile.vatNumber || '');
  const [companyInsuranceStatus, setCompanyInsuranceStatus] = useState(companyProfile.insuranceStatus || '');
  const [companyRequirements, setCompanyRequirements] = useState<string[]>(companyProfile.requirements || []);
  const [companyBenefits, setCompanyBenefits] = useState<string[]>(companyProfile.benefits || []);

  const [publicLiabilityInsurance, setPublicLiabilityInsurance] = useState(companyProfile.publicLiabilityInsurance || '');
  const [employersLiabilityInsurance, setEmployersLiabilityInsurance] = useState(companyProfile.employersLiabilityInsurance || '');
  const [businessAddress, setBusinessAddress] = useState(companyProfile.businessAddress || '');
  const [postcode, setPostcode] = useState(companyProfile.postcode || '');
  const [contactName, setContactName] = useState(companyProfile.contactName || '');
  const [contactPhone, setContactPhone] = useState(companyProfile.contactPhone || '');
  const [contactEmail, setContactEmail] = useState(companyProfile.contactEmail || '');

  // Storage / Uploading / Preview States
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [workerAvatar, setWorkerAvatar] = useState(workerProfile.avatar);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(workerProfile.profilePhotoUrl || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(workerProfile.galleryImages || workerProfile.portfolio || []);
  const [cvUrl, setCvUrl] = useState(workerProfile.cvUrl || '');
  const [certificateFiles, setCertificateFiles] = useState<string[]>(workerProfile.certificateFiles || []);
  const [licenceImages, setLicenceImages] = useState<string[]>(workerProfile.licenceImages || []);

  const [companyLogo, setCompanyLogo] = useState(companyProfile.logo);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(companyProfile.companyLogoUrl || companyProfile.logo || '');
  const [companyGalleryImages, setCompanyGalleryImages] = useState<string[]>(companyProfile.companyGalleryImages || []);
  const [verificationDocuments, setVerificationDocuments] = useState<string[]>(companyProfile.verificationDocuments || []);

  // Synchronize state with profile props when changed/re-fetched
  React.useEffect(() => {
    setWorkerName(workerProfile.name);
    setWorkerPhone(workerProfile.phone || '');
    setWorkerTrade(workerProfile.trade);
    setWorkerSubcategory(workerProfile.subcategory || '');
    setWorkerLocation(workerProfile.location);
    setWorkerAbout(workerProfile.about || '');
    setWorkerExperience(workerProfile.experience || '8 Years');
    setWorkerQualifications(workerProfile.qualifications || []);
    setWorkerLicences(workerProfile.licences || []);
    setWorkerPositionLengths(workerProfile.positionLengths || []);
    setWorkerAvatar(workerProfile.avatar);
    setProfilePhotoUrl(workerProfile.profilePhotoUrl || '');
    setGalleryImages(workerProfile.galleryImages || workerProfile.portfolio || []);
    setCvUrl(workerProfile.cvUrl || '');
    setCertificateFiles(workerProfile.certificateFiles || []);
    setLicenceImages(workerProfile.licenceImages || []);

    setOwnTools(workerProfile.toolsAndTransport?.some(t => t.toLowerCase().includes('tool')) ?? false);
    setOwnVan(workerProfile.toolsAndTransport?.some(t => t.toLowerCase().includes('van')) ?? false);

    if (workerProfile.payRate) {
      const parts = workerProfile.payRate.split(' - ');
      setWorkerHourlyRate(parts[0] || '£25/hr');
      setWorkerDayRate(parts[1] || parts[0] || '£200/day');
    }
  }, [workerProfile]);

  React.useEffect(() => {
    setCompanyName(companyProfile.name);
    setCompanyDesc(companyProfile.description || '');
    setCompanyLoc(companyProfile.location || '');
    setCompanyWebsite(companyProfile.website || '');
    setCompanyIndustry(companyProfile.industry || '');
    setCompanySize(companyProfile.companySize || '');
    setCompanyHouseNumber(companyProfile.companyHouseNumber || '');
    setCompanyVatNumber(companyProfile.vatNumber || '');
    setCompanyInsuranceStatus(companyProfile.insuranceStatus || '');
    setCompanyRequirements(companyProfile.requirements || []);
    setCompanyBenefits(companyProfile.benefits || []);
    setCompanyLogo(companyProfile.logo);
    setCompanyLogoUrl(companyProfile.companyLogoUrl || companyProfile.logo || '');
    setCompanyGalleryImages(companyProfile.companyGalleryImages || []);
    setVerificationDocuments(companyProfile.verificationDocuments || []);
    setPublicLiabilityInsurance(companyProfile.publicLiabilityInsurance || '');
    setEmployersLiabilityInsurance(companyProfile.employersLiabilityInsurance || '');
    setBusinessAddress(companyProfile.businessAddress || '');
    setPostcode(companyProfile.postcode || '');
    setContactName(companyProfile.contactName || '');
    setContactPhone(companyProfile.contactPhone || '');
    setContactEmail(companyProfile.contactEmail || '');
  }, [companyProfile]);

  // Toast notifier helper
  const triggerAlert = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  // Keep the editor synchronised after the saved worker profile is refreshed.
  useEffect(() => {
    setWorkerName(workerProfile.name || '');
    setWorkerPhone(workerProfile.phone || '');
    setWorkerTrade(workerProfile.trade || '');
    setWorkerSubcategory(workerProfile.subcategory || '');
    setWorkerLocation(workerProfile.location || '');
    setWorkerAbout(workerProfile.about || '');
    setWorkerExperience(workerProfile.experience || '');
    setWorkerQualifications(workerProfile.qualifications || []);
    setWorkerLicences(workerProfile.licences || []);
    setWorkerPositionLengths(workerProfile.positionLengths || []);
  }, [
    workerProfile.id,
    workerProfile.name,
    workerProfile.phone,
    workerProfile.trade,
    workerProfile.subcategory,
    workerProfile.location,
    workerProfile.about,
    workerProfile.experience,
    workerProfile.qualifications,
    workerProfile.licences,
    workerProfile.positionLengths,
  ]);

  // Helper helper to generate current full worker record for saving
  const getCurrentWorkerProfile = (extra: Partial<WorkerProfile> = {}): WorkerProfile => {
    const listTools: string[] = [];
    if (ownTools) listTools.push('Own Hand & Power Tools');
    if (ownVan) listTools.push('Own Commercial Van');

    return {
      ...workerProfile,
      name: workerName,
      phone: workerPhone,
      trade: workerTrade,
      subcategory: workerSubcategory,
      payRate: `${workerHourlyRate} - ${workerDayRate}`,
      location: workerLocation,
      about: workerAbout,
      experience: workerExperience,
      qualifications: workerQualifications,
      licences: workerLicences,
      positionLengths: workerPositionLengths,
      toolsAndTransport: listTools,
      avatar: workerAvatar,
      profilePhotoUrl: profilePhotoUrl,
      galleryImages: galleryImages,
      cvUrl: cvUrl,
      certificateFiles: certificateFiles,
      licenceImages: licenceImages,
      portfolio: galleryImages,
      ...extra
    };
  };

  // Helper helper to generate current full company record for saving
  const getCurrentCompanyProfile = (extra: Partial<CompanyProfile> = {}): CompanyProfile => {
    return {
      ...companyProfile,
      name: companyName,
      description: companyDesc,
      location: companyLoc,
      website: companyWebsite,
      industry: companyIndustry,
      companySize: companySize,
      companyHouseNumber: companyHouseNumber,
      vatNumber: companyVatNumber,
      insuranceStatus: companyInsuranceStatus,
      requirements: companyRequirements,
      benefits: companyBenefits,
      logo: companyLogo,
      companyLogoUrl: companyLogoUrl,
      companyGalleryImages: companyGalleryImages,
      verificationDocuments: verificationDocuments,
      publicLiabilityInsurance: publicLiabilityInsurance,
      employersLiabilityInsurance: employersLiabilityInsurance,
      businessAddress: businessAddress,
      postcode: postcode,
      contactName: contactName,
      contactPhone: contactPhone,
      contactEmail: contactEmail,
      ...extra
    };
  };

  // Global upload single file engine (handles immediate preview, upload, column write, re-fetch)
  const handleUploadSingleFile = async (
    file: File,
    bucket: string,
    type: 'avatar' | 'gallery' | 'cv' | 'certificates' | 'licences' | 'logo' | 'company_gallery' | 'company_docs'
  ) => {
    setIsUploading(type);
    
    // Immediate preview for photos
    const localPreviewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setProfilePhotoUrl(localPreviewUrl);
    } else if (type === 'logo') {
      setCompanyLogoUrl(localPreviewUrl);
    }
    
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const targetId = userType === 'worker' ? workerProfile.id : companyProfile.id;
      const filePath = `${targetId}/${type}_${Date.now()}_${sanitizedName}`;
      
      const publicUrl = await uploadFileToStorage(bucket, filePath, file);
      
      // Revoke the temporary local preview URL
      URL.revokeObjectURL(localPreviewUrl);
      
      if (type === 'avatar') {
        setProfilePhotoUrl(publicUrl);
        setWorkerAvatar(publicUrl);
        const updated = getCurrentWorkerProfile({ profilePhotoUrl: publicUrl, avatar: publicUrl });
        await onUpdateWorker(updated);
        triggerAlert('Profile photo uploaded and saved successfully!', 'success');
      } else if (type === 'logo') {
        setCompanyLogoUrl(publicUrl);
        setCompanyLogo(publicUrl);
        const updated = getCurrentCompanyProfile({ companyLogoUrl: publicUrl, logo: publicUrl });
        await onUpdateCompany(updated);
        triggerAlert('Company logo uploaded and saved successfully!', 'success');
      } else if (type === 'cv') {
        setCvUrl(publicUrl);
        const updated = getCurrentWorkerProfile({ cvUrl: publicUrl });
        await onUpdateWorker(updated);
        triggerAlert('CV file uploaded and saved successfully!', 'success');
      } else if (type === 'gallery') {
        setGalleryImages(prev => {
          const next = [...prev, publicUrl];
          const updated = getCurrentWorkerProfile({ galleryImages: next, portfolio: next });
          onUpdateWorker(updated);
          return next;
        });
        triggerAlert('Gallery image added and saved successfully!', 'success');
      } else if (type === 'company_gallery') {
        setCompanyGalleryImages(prev => {
          const next = [...prev, publicUrl];
          const updated = getCurrentCompanyProfile({ companyGalleryImages: next });
          onUpdateCompany(updated);
          return next;
        });
        triggerAlert('Company project image added and saved successfully!', 'success');
      } else if (type === 'certificates') {
        const next = [...certificateFiles, publicUrl];
        setCertificateFiles(next);
        const updated = getCurrentWorkerProfile({ certificateFiles: next });
        await onUpdateWorker(updated);
        triggerAlert('Certificate file uploaded and saved successfully!', 'success');
      } else if (type === 'licences') {
        const next = [...licenceImages, publicUrl];
        setLicenceImages(next);
        const updated = getCurrentWorkerProfile({ licenceImages: next });
        await onUpdateWorker(updated);
        triggerAlert('Licence image uploaded and saved successfully!', 'success');
      } else if (type === 'company_docs') {
        const next = [...verificationDocuments, publicUrl];
        setVerificationDocuments(next);
        const updated = getCurrentCompanyProfile({ verificationDocuments: next });
        await onUpdateCompany(updated);
        triggerAlert('Verification document uploaded and saved successfully!', 'success');
      }
    } catch (err: any) {
      console.error("Single upload error details:", err);
      // Revert preview on failure
      if (type === 'avatar') {
        setProfilePhotoUrl(workerProfile.profilePhotoUrl || workerProfile.avatar || '');
      } else if (type === 'logo') {
        setCompanyLogoUrl(companyProfile.companyLogoUrl || companyProfile.logo || '');
      }
      triggerAlert(`Upload failed: ${err.message || err}`, 'error');
    } finally {
      setIsUploading(null);
    }
  };

  // Replace existing gallery images helper
  const handleReplaceGalleryImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: string,
    type: 'gallery' | 'company_gallery',
    idx: number
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(type);
    const file = files[0];
    
    // Immediate preview
    const localUrl = URL.createObjectURL(file);
    if (type === 'gallery') {
      const next = [...galleryImages];
      next[idx] = localUrl;
      setGalleryImages(next);
    } else {
      const next = [...companyGalleryImages];
      next[idx] = localUrl;
      setCompanyGalleryImages(next);
    }

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const targetId = userType === 'worker' ? workerProfile.id : companyProfile.id;
      const filePath = `${targetId}/${type}_replace_${idx}_${Date.now()}_${sanitizedName}`;
      
      const publicUrl = await uploadFileToStorage(bucket, filePath, file);
      
      URL.revokeObjectURL(localUrl);

      if (type === 'gallery') {
        const next = [...galleryImages];
        next[idx] = publicUrl;
        setGalleryImages(next);
        const updated = getCurrentWorkerProfile({ galleryImages: next, portfolio: next });
        await onUpdateWorker(updated);
        triggerAlert('Gallery image replaced successfully!', 'success');
      } else {
        const next = [...companyGalleryImages];
        next[idx] = publicUrl;
        setCompanyGalleryImages(next);
        const updated = getCurrentCompanyProfile({ companyGalleryImages: next });
        await onUpdateCompany(updated);
        triggerAlert('Company image replaced successfully!', 'success');
      }
    } catch (err: any) {
      console.error("Replacement error:", err);
      // Revert on failure
      if (type === 'gallery') {
        setGalleryImages(workerProfile.galleryImages || workerProfile.portfolio || []);
      } else {
        setCompanyGalleryImages(companyProfile.companyGalleryImages || []);
      }
      triggerAlert(`Replacement failed: ${err.message || err}`, 'error');
    } finally {
      setIsUploading(null);
    }
  };

  // Remove individual files
  const handleRemoveFile = async (
    urlToRemove: string,
    type: 'gallery' | 'certificates' | 'licences' | 'company_gallery' | 'company_docs'
  ) => {
    if (type === 'gallery') {
      const next = galleryImages.filter(url => url !== urlToRemove);
      setGalleryImages(next);
      const updated = getCurrentWorkerProfile({ galleryImages: next, portfolio: next });
      await onUpdateWorker(updated);
    } else if (type === 'company_gallery') {
      const next = companyGalleryImages.filter(url => url !== urlToRemove);
      setCompanyGalleryImages(next);
      const updated = getCurrentCompanyProfile({ companyGalleryImages: next });
      await onUpdateCompany(updated);
    } else if (type === 'certificates') {
      const next = certificateFiles.filter(url => url !== urlToRemove);
      setCertificateFiles(next);
      const updated = getCurrentWorkerProfile({ certificateFiles: next });
      await onUpdateWorker(updated);
    } else if (type === 'licences') {
      const next = licenceImages.filter(url => url !== urlToRemove);
      setLicenceImages(next);
      const updated = getCurrentWorkerProfile({ licenceImages: next });
      await onUpdateWorker(updated);
    } else if (type === 'company_docs') {
      const next = verificationDocuments.filter(url => url !== urlToRemove);
      setVerificationDocuments(next);
      const updated = getCurrentCompanyProfile({ verificationDocuments: next });
      await onUpdateCompany(updated);
    }
    triggerAlert('Image removed and saved successfully!', 'info');
  };

  // Explicit remove buttons for avatar/logo
  const handleRemovePhoto = async () => {
    setProfilePhotoUrl('');
    setWorkerAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80');
    const updated = getCurrentWorkerProfile({ profilePhotoUrl: '', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' });
    await onUpdateWorker(updated);
    triggerAlert('Profile photo removed successfully.', 'info');
  };

  const handleRemoveLogo = async () => {
    setCompanyLogoUrl('');
    setCompanyLogo('https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=200&auto=format&fit=crop&q=80');
    const updated = getCurrentCompanyProfile({ companyLogoUrl: '', logo: 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=200&auto=format&fit=crop&q=80' });
    await onUpdateCompany(updated);
    triggerAlert('Company logo removed successfully.', 'info');
  };

  // Form submission saves
  const handleSaveWorker = async () => {
    try {
      if (!workerTrade.trim()) {
        triggerAlert('Please select a main trade before saving.', 'error');
        return;
      }

      const updated = getCurrentWorkerProfile({
        trade: workerTrade.trim(),
        subcategory: workerSubcategory.trim(),
      });
      await onUpdateWorker(updated);
      triggerAlert('Your worker profile has been updated and saved!', 'success');
    } catch (err: any) {
      triggerAlert(`Save failed: ${err.message || err}`, 'error');
    }
  };

  const handleSaveCompany = async () => {
    try {
      const updated = getCurrentCompanyProfile();
      await onUpdateCompany(updated);
      triggerAlert('Your contractor profile has been updated and saved!', 'success');
    } catch (err: any) {
      triggerAlert(`Save failed: ${err.message || err}`, 'error');
    }
  };

  // Calculate live completion percentages
  const calculateWorkerCompletion = () => {
    let filled = 0;
    let total = 0;

    const fields = [
      workerName,
      workerPhone,
      workerLocation,
      workerTrade,
      workerAbout,
      workerExperience,
      profilePhotoUrl
    ];
    total += fields.length;
    filled += fields.filter(f => !!f).length;

    total += 3; // lists
    if (workerQualifications && workerQualifications.length > 0) filled++;
    if (workerLicences && workerLicences.length > 0) filled++;
    if (ownTools || ownVan) filled++;

    total += 1; // gallery
    if (galleryImages && galleryImages.length > 0) filled++;

    return Math.round((filled / total) * 100);
  };

  const calculateCompanyCompletion = () => {
    let filled = 0;
    let total = 0;

    const fields = [
      companyName,
      contactName,
      contactPhone,
      contactEmail,
      companyLoc,
      companyIndustry,
      companyDesc,
      companyLogoUrl,
      companyWebsite,
      companyHouseNumber,
      companyVatNumber
    ];
    total += fields.length;
    filled += fields.filter(f => !!f).length;

    total += 1; // gallery
    if (companyGalleryImages && companyGalleryImages.length > 0) filled++;

    return Math.round((filled / total) * 100);
  };

  const completionPct = userType === 'worker' ? calculateWorkerCompletion() : calculateCompanyCompletion();

  // Dynamic Statistics computed from live DB / lists
  const workerCompletedJobsCount = interviews.filter(i => i.workerId === workerProfile.id && i.status === 'completed').length;
  const companyCompletedHiresCount = interviews.filter(i => i.status === 'completed' && jobs.find(j => j.id === i.jobId)?.companyId === companyProfile.id).length;

  const profileReviews = reviews.filter(r => r.reviewedUserId === profileId && !r.moderated);
  const averageRating = profileReviews.length > 0 
    ? (profileReviews.reduce((sum, r) => sum + r.rating, 0) / profileReviews.length).toFixed(1) 
    : 'No rating yet';

  // Dynamic Reputation score out of 100 based on completion, average rating, and completed jobs
  const calculateReputationScore = () => {
    let ratingVal = profileReviews.length > 0 
      ? profileReviews.reduce((sum, r) => sum + r.rating, 0) / profileReviews.length 
      : 5.0;
    const ratingWeight = ratingVal * 12; // up to 60 pts
    const completionWeight = completionPct * 0.25; // up to 25 pts
    const jobsWeight = Math.min((userType === 'worker' ? workerCompletedJobsCount : companyCompletedHiresCount) * 5, 15); // up to 15 pts
    return Math.round(ratingWeight + completionWeight + jobsWeight);
  };
  const reputationScore = calculateReputationScore();

  const getCategoryAverages = () => {
    const cats = ['reliability', 'quality_of_work', 'communication', 'professionalism', 'timekeeping'];
    const averages: Record<string, number> = {};
    cats.forEach(cat => {
      let sum = 0;
      let count = 0;
      profileReviews.forEach(r => {
        if (r.categories && typeof r.categories[cat] === 'number') {
          sum += r.categories[cat];
          count++;
        }
      });
      averages[cat] = count > 0 ? Number((sum / count).toFixed(1)) : 5.0;
    });
    return averages;
  };
  const categoryAverages = getCategoryAverages();

  return (
    <div id="profile-management-container" className="space-y-6 pb-24 font-sans animate-fade-in relative max-w-7xl mx-auto px-4">
      
      {/* Toast Alert Notice */}
      {alertMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border transition-all duration-300 transform scale-100 ${
          alertType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          alertType === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {alertType === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <div>
            <p className="text-xs font-mono font-black uppercase tracking-wider">{alertType === 'success' ? 'Success' : 'Notice'}</p>
            <p className="text-xs font-semibold">{alertMessage}</p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Profile Avatar Frame & Basic description */}
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left w-full lg:w-auto">
          
          {/* Avatar frame */}
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-50 relative group flex items-center justify-center flex-shrink-0 shadow-inner">
            <img 
              src={userType === 'worker' 
                ? (profilePhotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80') 
                : (companyLogoUrl || 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=200&auto=format&fit=crop&q=80')
              } 
              alt="Profile avatar" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            
            {/* Uploading loading overlay */}
            {(isUploading === 'avatar' || isUploading === 'logo') && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                <span className="text-[10px] font-mono font-bold text-emerald-700 mt-1 uppercase">Uploading...</span>
              </div>
            )}
          </div>

          {/* Details column */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-black font-sans text-zinc-900 tracking-tight">
                {userType === 'worker' ? workerName : companyName}
              </h2>
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-[#10B981] rounded-lg text-[10px] font-mono font-bold uppercase tracking-wide">
                {userType === 'worker' ? 'Worker Profile' : 'Contractor Profile'}
              </span>
              {(userType === 'worker' ? workerProfile.verified : companyProfile.verified) && (
                <span className="px-2 py-1 bg-zinc-900 text-[#34D399] rounded-lg text-[9px] font-mono font-bold uppercase tracking-wide flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> PLATINUM VERIFIED
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-zinc-500">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                {userType === 'worker' ? (workerTrade || 'No Trade Specified') : (companyIndustry || 'Construction Industry')}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                {userType === 'worker' ? (workerLocation || 'UK') : (companyLoc || 'UK')}
              </span>
            </div>

            {/* Profile Completion Meter */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 font-bold mb-1">
                <span>PROFILE STRENGTH</span>
                <span className="text-[#10B981]">{completionPct}% COMPLETE</span>
              </div>
              <div className="h-2 w-48 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel Buttons inside Header */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto md:justify-center">
          
          {/* Change Avatar Button */}
          <div className="relative flex-1 sm:flex-initial">
            <button 
              type="button" 
              className="w-full sm:w-auto px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 border border-zinc-200"
            >
              <Upload className="w-3.5 h-3.5" /> {userType === 'worker' ? 'Change Photo' : 'Change Logo'}
            </button>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadSingleFile(file, userType === 'worker' ? 'profile-pictures' : 'company-logos', userType === 'worker' ? 'avatar' : 'logo');
              }}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </div>

          {/* Remove Avatar Button */}
          <button 
            type="button" 
            onClick={userType === 'worker' ? handleRemovePhoto : handleRemoveLogo}
            disabled={userType === 'worker' ? !profilePhotoUrl : !companyLogoUrl}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-mono font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" /> Remove
          </button>

          {/* Save Profile Button */}
          <button 
            type="button" 
            onClick={userType === 'worker' ? handleSaveWorker : handleSaveCompany}
            className="px-6 py-2.5 bg-[#34D399] hover:bg-[#10B981] text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-[#34D399]/10"
          >
            <Check className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>

      {/* VIEW / EDIT MODE TOGGLE */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm max-w-sm">
        <button
          type="button"
          onClick={() => setProfileMode('live')}
          className={`flex-1 py-2 px-4 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            profileMode === 'live'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-[#34D399]" /> Live CV View
        </button>
        <button
          type="button"
          onClick={() => setProfileMode('edit')}
          className={`flex-1 py-2 px-4 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            profileMode === 'edit'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
          }`}
        >
          <Edit2 className="w-3.5 h-3.5 text-[#34D399]" /> Edit Details
        </button>
      </div>

      {/* MAIN TWO COLUMN CONTENT AREA */}
      {profileMode === 'live' ? (
        /* LIVE PUBLIC CV / CARD VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* LEFT COLUMN - STATS, BIO, TIMELINE, REVIEWS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* OVERVIEW BENTO STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Jobs Completed Card */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-5 flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-emerald-50 rounded-2xl text-[#10B981]">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Jobs Completed</p>
                  <p className="text-lg font-black text-zinc-900 mt-0.5">
                    {userType === 'worker' ? (
                      workerCompletedJobsCount > 0 ? `${workerCompletedJobsCount} Worked` : '0 Jobs Completed'
                    ) : (
                      companyCompletedHiresCount > 0 ? `${companyCompletedHiresCount} Hired` : 'No completed jobs yet'
                    )}
                  </p>
                </div>
              </div>

              {/* Experience / Sizing Card */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-5 flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-[#34D399]/10 text-[#10B981] rounded-2xl">
                  {userType === 'worker' ? <Clock className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    {userType === 'worker' ? 'Years Active' : 'Corporate Size'}
                  </p>
                  <p className="text-lg font-black text-zinc-900 mt-0.5">
                    {userType === 'worker' ? (workerExperience || 'New Profile') : (companySize || '1-10 Employees')}
                  </p>
                </div>
              </div>

              {/* Trust Score / Reputation Meter Card */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-5 flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-zinc-900 rounded-2xl text-[#34D399]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Reputation Score</p>
                  <p className="text-lg font-black text-zinc-900 mt-0.5 flex items-center gap-1.5">
                    {reputationScore}% <span className="text-xs text-emerald-500 font-bold">Excellent</span>
                  </p>
                </div>
              </div>
            </div>

            {/* PROFESSIONAL BIOGRAPHY */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                <FileText className="w-4 h-4 text-[#10B981]" />
                {userType === 'worker' ? 'Professional Statement' : 'Corporate Profile'}
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed font-sans whitespace-pre-line">
                {(userType === 'worker' ? workerAbout : companyDesc) || (
                  <span className="italic text-zinc-400">Biography pending update. Click "Edit Details" to tell people about your skills, on-site values, and general background.</span>
                )}
              </p>
            </div>

            {/* WORKER SPECIFIC: QUALIFICATIONS, Timeline, LICENCES */}
            {userType === 'worker' && (
              <>
                {/* Qualifications & Cards */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Award className="w-4 h-4 text-[#10B981]" />
                    Mandated Qualifications & Trade Cards
                  </h3>
                  {workerQualifications.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {workerQualifications.map((qual, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-3 bg-zinc-50 border border-zinc-150 rounded-xl">
                          <CheckCircle2 className="w-4.5 h-4.5 text-[#10B981] flex-shrink-0" />
                          <span className="text-xs font-bold text-zinc-800">{qual}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                      <Award className="w-8 h-8 mx-auto text-zinc-300 mb-1" />
                      <p className="text-xs font-mono font-bold uppercase">No qualifications added yet</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Add City & Guilds, NVQ levels, or CSCS cards in the editor.</p>
                    </div>
                  )}
                </div>

                {/* Scanned Licences & Certifications Previews */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <FileCheck className="w-4 h-4 text-[#10B981]" />
                    Verified License Badges & Scans
                  </h3>
                  
                  {workerLicences.length > 0 || certificateFiles.length > 0 || licenceImages.length > 0 ? (
                    <div className="space-y-4">
                      {/* List tags */}
                      {workerLicences.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {workerLicences.map((lic, i) => (
                            <span key={i} className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-lg text-[10px] font-mono font-bold uppercase">
                              🪪 {lic}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Clickable docs */}
                      {(certificateFiles.length > 0 || licenceImages.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {certificateFiles.map((url, i) => (
                            <a 
                              key={`cert-${i}`} 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-medium transition-all group"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <FileCheck className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                                <span className="truncate">Accredited Certificate #{i + 1}</span>
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ))}
                          {licenceImages.map((url, i) => (
                            <div 
                              key={`lic-img-${i}`}
                              onClick={() => setLightboxImage(url)}
                              className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl flex items-center justify-between text-xs text-zinc-700 font-medium transition-all cursor-pointer group"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <ImageIcon className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                                <span className="truncate">Scanned Licence Badge #{i + 1}</span>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono group-hover:text-[#10B981]">ZOOM</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                      <FileCheck className="w-8 h-8 mx-auto text-zinc-300 mb-1" />
                      <p className="text-xs font-mono font-bold uppercase">No licences or certifications added yet</p>
                    </div>
                  )}
                </div>

                {/* Chronological Work History */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-5">
                  <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Calendar className="w-4 h-4 text-[#10B981]" />
                    Chronological On-site History
                  </h3>
                  {workerProfile.workHistory && workerProfile.workHistory.length > 0 ? (
                    <div className="border-l-2 border-zinc-200 ml-3 pl-6 space-y-6">
                      {workerProfile.workHistory.map((hist) => (
                        <div key={hist.id} className="relative">
                          <span className="absolute -left-[31px] top-1 bg-[#34D399] w-4.5 h-4.5 rounded-full border-4 border-white shadow-xs" />
                          <div>
                            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">{hist.duration}</span>
                            <h4 className="text-sm font-bold text-zinc-900 mt-0.5">{hist.role}</h4>
                            <p className="text-[11px] font-mono text-[#10B981] font-bold uppercase mt-0.5">{hist.company}</p>
                            <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">{hist.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No historical on-site projects logged. Head over to Edit Settings to add your previous work history.</p>
                  )}
                </div>
              </>
            )}

            {/* CONTRACTOR SPECIFIC: VACANCIES & COMPLIANCE */}
            {userType === 'employer' && (
              <>
                {/* Corporate compliance: Companies House, VAT, PLI */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                    Corporate Compliance & Insurances
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Companies House Registration</span>
                      <p className="text-xs font-bold text-zinc-800">{companyHouseNumber || "Not Registered"}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">VAT Number</span>
                      <p className="text-xs font-bold text-zinc-800">{companyVatNumber || "Not VAT Registered"}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Public Liability Insurance</span>
                      <p className="text-xs font-bold text-zinc-800">{publicLiabilityInsurance || companyInsuranceStatus || "Liability Insured"}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Employers Liability Insurance</span>
                      <p className="text-xs font-bold text-zinc-800">{employersLiabilityInsurance || "Employers Insured"}</p>
                    </div>
                  </div>
                </div>

                {/* Active Vacancies */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Briefcase className="w-4 h-4 text-[#10B981]" />
                    Active Site Vacancies at this Firm
                  </h3>
                  {jobs.filter(j => j.companyId === companyProfile.id).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {jobs.filter(j => j.companyId === companyProfile.id).map((job) => (
                        <div key={job.id} className="p-4 bg-zinc-50 border border-zinc-250 hover:border-emerald-500 rounded-2xl transition-all">
                          <span className="px-2 py-0.5 bg-zinc-900 text-[#34D399] rounded text-[8px] font-mono font-bold uppercase">{job.trade}</span>
                          <h4 className="text-sm font-bold text-zinc-900 mt-2">{job.title}</h4>
                          <p className="text-xs text-zinc-500 font-medium mt-1">{job.location} • {job.duration}</p>
                          <div className="flex items-center justify-between border-t border-zinc-200 pt-3 mt-3">
                            <span className="text-xs font-bold font-mono text-[#10B981]">{job.payRate}</span>
                            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">{job.employmentType}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No active contracts posted. Go to Settings or Dashboard to deploy a new job advert.</p>
                  )}
                </div>
              </>
            )}

            {/* REVIEWS & RATINGS */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Site Review Log & Walkthrough Ratings
                </h3>
                <span className="text-xs font-mono text-zinc-400 font-bold uppercase">{profileReviews.length} Reviews</span>
              </div>

              {/* Reviews score panel */}
              {profileReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Rating display */}
                  <div className="md:col-span-4 text-center space-y-1 bg-zinc-50 border border-zinc-150 p-5 rounded-2xl">
                    <p className="text-4xl font-black text-zinc-900 font-sans">{averageRating}</p>
                    <div className="flex justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? 'text-amber-500 fill-amber-500' : 'text-zinc-200'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">AVERAGE COMPLIANCE</p>
                  </div>

                  {/* Categories breakdown */}
                  <div className="md:col-span-8 space-y-2 text-xs">
                    {Object.entries(categoryAverages).map(([category, rating]) => (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between font-mono font-bold text-zinc-500 text-[10px] uppercase">
                          <span>{category.replace(/_/g, ' ')}</span>
                          <span className="text-zinc-900">{rating} / 5.0</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${(rating / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Individual Review list */}
                  <div className="md:col-span-12 divide-y divide-zinc-100 pt-2">
                    {profileReviews.map((rev) => (
                      <div key={rev.id} className="py-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{rev.reviewerName}</p>
                            <p className="text-[10px] text-zinc-400 font-mono uppercase">{rev.reviewerRole}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-200'}`} />
                              ))}
                            </div>
                            <span className="text-[9px] font-mono text-zinc-400 font-bold block mt-0.5">
                              {new Date(rev.createdAt).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-600 font-sans italic">"{rev.reviewText}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="text-center py-10 border border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                  <Star className="w-8 h-8 mx-auto text-zinc-300 mb-1" />
                  <p className="text-xs font-mono font-bold uppercase text-zinc-500">No reviews yet</p>
                  <p className="text-[10px] text-zinc-400 leading-normal max-w-xs mx-auto mt-1">
                    Once you complete a scheduled walkthrough call, employers or workers can publish feedback logs on your CV page.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR COLUMN - GALLERY, PREFERENCES, TOOLS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* WORKER TOOLS / CONTRACTOR BENEFITS */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                {userType === 'worker' ? <Wrench className="w-4 h-4 text-[#10B981]" /> : <Award className="w-4 h-4 text-[#10B981]" />}
                {userType === 'worker' ? 'Active Tools & Transport' : 'Corporate Perks & Offerings'}
              </h3>
              {userType === 'worker' ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {ownTools && (
                      <span className="px-2.5 py-1 bg-zinc-900 text-[#34D399] border border-zinc-800 rounded-lg text-[10px] font-mono font-bold uppercase">
                        🛠 OWN POWER TOOLS
                      </span>
                    )}
                    {ownVan && (
                      <span className="px-2.5 py-1 bg-zinc-900 text-[#34D399] border border-zinc-800 rounded-lg text-[10px] font-mono font-bold uppercase">
                        🚚 OWN COMMERCIAL VAN
                      </span>
                    )}
                  </div>
                  {workerProfile.toolsAndTransport && workerProfile.toolsAndTransport.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {workerProfile.toolsAndTransport.map((tool, i) => (
                        <span key={i} className="px-2 py-1 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-lg text-[10px] font-mono font-bold uppercase">
                          {tool}
                        </span>
                      ))}
                    </div>
                  ) : (
                    (!ownTools && !ownVan) && <p className="text-[11px] text-zinc-400 italic">No tools or vehicle items declared yet.</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {companyBenefits && companyBenefits.length > 0 ? (
                    companyBenefits.map((perk, i) => (
                      <span key={i} className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-[10px] font-mono font-bold uppercase">
                        🎁 {perk}
                      </span>
                    ))
                  ) : (
                    <p className="text-[11px] text-zinc-400 italic">No corporate benefits configured.</p>
                  )}
                </div>
              )}
            </div>

            {/* PORTFOLIO / SITE PROJECT GALLERY */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                <ImageIcon className="w-4 h-4 text-[#10B981]" />
                {userType === 'worker' ? 'Work Portfolio Gallery' : 'Company Project Gallery'}
              </h3>
              
              {(userType === 'worker' ? galleryImages : companyGalleryImages).length > 0 ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {(userType === 'worker' ? galleryImages : companyGalleryImages).map((url, i) => (
                    <div 
                      key={i} 
                      onClick={() => setLightboxImage(url)}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50 shadow-xs cursor-pointer group"
                    >
                      <img 
                        src={url} 
                        alt="Portfolio" 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-mono font-bold uppercase">
                        ZOOM
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                  <ImageIcon className="w-8 h-8 mx-auto text-zinc-300 mb-1" />
                  <p className="text-xs font-mono font-bold uppercase text-zinc-500">No portfolio uploaded yet</p>
                </div>
              )}
            </div>

            {/* PREFERENCES / MAIN CONTACTS */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Phone className="w-4 h-4 text-[#10B981]" />
                {userType === 'worker' ? 'Employment preferences' : 'Corporate Contact Details'}
              </h3>
              <div className="space-y-3.5 text-xs text-zinc-700">
                {userType === 'worker' ? (
                  <>
                    <div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
                      <span className="font-mono text-zinc-400 font-bold uppercase text-[10px]">Wage Expectation:</span>
                      <span className="font-bold text-zinc-800">{workerHourlyRate} - {workerDayRate}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
                      <span className="font-mono text-zinc-400 font-bold uppercase text-[10px]">Preferred Models:</span>
                      <span className="font-bold text-zinc-800 text-right max-w-[150px] truncate">{workerPositionLengths.slice(0, 2).join(', ') || "Full Time, Contract"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
                      <span className="font-mono text-zinc-400 font-bold uppercase text-[10px]">Hometown:</span>
                      <span className="font-bold text-zinc-800">{workerLocation}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
                      <span className="font-mono text-zinc-400 font-bold uppercase text-[10px]">HQ Address:</span>
                      <span className="font-bold text-zinc-800 text-right">{businessAddress || companyLoc || "Not Configured"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
                      <span className="font-mono text-zinc-400 font-bold uppercase text-[10px]">Contact Person:</span>
                      <span className="font-bold text-zinc-800">{contactName || "Main Office"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
                      <span className="font-mono text-zinc-400 font-bold uppercase text-[10px]">Contact Phone:</span>
                      <span className="font-bold text-zinc-800">{contactPhone || companyProfile.phone || "None"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* EDIT PROFILE / DOCUMENT SETTINGS FORM (Existing original functional layout) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* LEFT COLUMN - BASIC & WORK DETAILS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SECTION 2: BASIC DETAILS CARD */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Building className="w-5 h-5 text-emerald-500" />
                <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider">
                  Basic Account Information
                </h3>
              </div>

              {userType === 'worker' ? (
                // Worker basic fields
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">FULL NAME</label>
                    <input 
                      type="text" 
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      placeholder="Enter full name..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">PHONE NUMBER</label>
                    <input 
                      type="text" 
                      value={workerPhone}
                      onChange={(e) => setWorkerPhone(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      placeholder="Enter phone number..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <SearchableDropdown
                      id="worker-hometown"
                      label="Hometown / Base Location"
                      options={HOMETOWNS}
                      selected={workerLocation}
                      onChange={setWorkerLocation}
                      multiple={false}
                      placeholder="Select Hometown..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">MAIN TRADE</label>
                    <select
                      value={workerTrade}
                      onChange={(e) => setWorkerTrade(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                    >
                      <option value="">Select Main Trade...</option>
                      {TRADES_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">ADDITIONAL TRADES / SUBCATEGORIES</label>
                    <input 
                      type="text" 
                      value={workerSubcategory}
                      onChange={(e) => setWorkerSubcategory(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      placeholder="e.g. Solar Fitter, Domestic Cabling, Alarm specialist..."
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">PROFESSIONAL BIOGRAPHY</label>
                    <textarea 
                      value={workerAbout}
                      onChange={(e) => setWorkerAbout(e.target.value)}
                      rows={4}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all resize-none"
                      placeholder="Tell contractors about your professional experience, work ethics, and on-site background..."
                    />
                  </div>
                </div>
              ) : (
                // Contractor / Company basic fields
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">COMPANY NAME</label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">CONTACT PERSON NAME</label>
                    <input 
                      type="text" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      placeholder="Contact Name..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">CONTACT PHONE</label>
                    <input 
                      type="text" 
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <SearchableDropdown
                      id="company-hometown"
                      label="Headquarters Location"
                      options={HOMETOWNS}
                      selected={companyLoc}
                      onChange={setCompanyLoc}
                      multiple={false}
                      placeholder="Select HQ..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">INDUSTRY SECTOR</label>
                    <input 
                      type="text" 
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      placeholder="e.g. Civil Engineering, Residential Construction..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">COMPANY SIZING (EMPLOYEES)</label>
                    <input 
                      type="text" 
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">WEBSITE ADDRESS</label>
                    <input 
                      type="text" 
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      placeholder="e.g. https://apexbuild.co.uk"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">CONTACT EMAIL</label>
                    <input 
                      type="text" 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      placeholder="e.g. mail@firm.com"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">HEAD OFFICE REGISTERED ADDRESS</label>
                    <input 
                      type="text" 
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      placeholder="Full mailing address..."
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-mono font-black text-zinc-400 uppercase">COMPANY DESCRIPTION / MISSION</label>
                    <textarea 
                      value={companyDesc}
                      onChange={(e) => setCompanyDesc(e.target.value)}
                      rows={4}
                      className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all resize-none"
                      placeholder="Tell candidates about your ongoing construction developments, site values, and corporate focus..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: WORK DETAILS CARD */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Wrench className="w-5 h-5 text-emerald-500" />
                <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider">
                  Professional On-site Settings
                </h3>
              </div>

              {userType === 'worker' ? (
                // Worker active work detail fields
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-black text-zinc-400 uppercase">HOURLY WAGE EXPECTED</label>
                      <input 
                        type="text" 
                        value={workerHourlyRate}
                        onChange={(e) => setWorkerHourlyRate(e.target.value)}
                        className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-black text-zinc-400 uppercase">DAY WAGE RATE</label>
                      <input 
                        type="text" 
                        value={workerDayRate}
                        onChange={(e) => setWorkerDayRate(e.target.value)}
                        className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-black text-zinc-400 uppercase">YEARS OF EXPERIENCE</label>
                      <select
                        value={workerExperience}
                        onChange={(e) => setWorkerExperience(e.target.value)}
                        className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      >
                        <option value="1 Year">1 Year</option>
                        <option value="2 Years">2 Years</option>
                        <option value="3-5 Years">3-5 Years</option>
                        <option value="5-8 Years">5-8 Years</option>
                        <option value="8-12 Years">8-12 Years</option>
                        <option value="12+ Years">12+ Years</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-mono font-black text-zinc-400 uppercase">MANDATORY TOOLS & SITE VEHICLE STATUS</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Own tools check */}
                      <label className="flex items-center gap-3 p-4 border border-zinc-200 hover:border-[#34D399]/45 rounded-2xl bg-zinc-50 cursor-pointer select-none transition-all">
                        <input 
                          type="checkbox" 
                          checked={ownTools}
                          onChange={(e) => setOwnTools(e.target.checked)}
                          className="w-5 h-5 accent-[#34D399] rounded"
                        />
                        <div>
                          <p className="text-xs font-bold text-zinc-900">Own Full Kit & Power Tools</p>
                          <p className="text-[10px] text-zinc-400">Arrive on-site fully equipped for first/second fix tasks</p>
                        </div>
                      </label>

                      {/* Own van check */}
                      <label className="flex items-center gap-3 p-4 border border-zinc-200 hover:border-[#34D399]/45 rounded-2xl bg-zinc-50 cursor-pointer select-none transition-all">
                        <input 
                          type="checkbox" 
                          checked={ownVan}
                          onChange={(e) => setOwnVan(e.target.checked)}
                          className="w-5 h-5 accent-[#34D399] rounded"
                        />
                        <div>
                          <p className="text-xs font-bold text-zinc-900">Own Transport (Commercial Van)</p>
                          <p className="text-[10px] text-zinc-400">Equipped with reliable commercial van to haul materials</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Dropdown lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <SearchableDropdown
                        id="worker-qualifications"
                        label="CSCS / ECS Accreditations (Qualifications)"
                        options={GRADES}
                        selected={workerQualifications}
                        onChange={setWorkerQualifications}
                        multiple={true}
                        placeholder="Select Cards..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <SearchableDropdown
                        id="worker-licences"
                        label="Plant & Active Drive Licences"
                        options={LICENCES}
                        selected={workerLicences}
                        onChange={setWorkerLicences}
                        multiple={true}
                        placeholder="Select Licences..."
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <SearchableDropdown
                        id="worker-employment-models"
                        label="Preferred Employment Models"
                        options={POSITION_LENGTHS}
                        selected={workerPositionLengths}
                        onChange={setWorkerPositionLengths}
                        multiple={true}
                        placeholder="Select Models..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Contractor / Company job detail preferences
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-black text-[#10B981] uppercase">Companies House Registration</label>
                      <input 
                        type="text" 
                        value={companyHouseNumber}
                        onChange={(e) => setCompanyHouseNumber(e.target.value)}
                        placeholder="e.g. 08123456"
                        className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-black text-[#10B981] uppercase">VAT Registration Number</label>
                      <input 
                        type="text" 
                        value={companyVatNumber}
                        onChange={(e) => setCompanyVatNumber(e.target.value)}
                        placeholder="e.g. GB 123 4567 89"
                        className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-black text-zinc-400 uppercase">Public Liability Insurance Status</label>
                      <input 
                        type="text" 
                        value={companyInsuranceStatus}
                        onChange={(e) => setCompanyInsuranceStatus(e.target.value)}
                        placeholder="e.g. £10M Public Liability"
                        className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-black text-zinc-400 uppercase">Public Liability Doc Ref / Limit</label>
                      <input 
                        type="text" 
                        value={publicLiabilityInsurance}
                        onChange={(e) => setPublicLiabilityInsurance(e.target.value)}
                        placeholder="e.g. £5,000,000 Cover"
                        className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-black text-zinc-400 uppercase">Employers Liability Doc Ref / Limit</label>
                      <input 
                        type="text" 
                        value={employersLiabilityInsurance}
                        onChange={(e) => setEmployersLiabilityInsurance(e.target.value)}
                        placeholder="e.g. £10,000,000 Cover"
                        className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-black text-zinc-400 uppercase">Head Office Postcode</label>
                      <input 
                        type="text" 
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        placeholder="e.g. SW1A 1AA"
                        className="w-full p-3 bg-zinc-50 focus:bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#34D399] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <SearchableDropdown
                        id="company-site-requirements"
                        label="Mandatory Site Compliance Checks"
                        options={REQUIREMENTS}
                        selected={companyRequirements}
                        onChange={setCompanyRequirements}
                        multiple={true}
                        placeholder="Select compliance checklists..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <SearchableDropdown
                        id="company-benefits"
                        label="Corporate Perks & Offerings"
                        options={POSITION_LENGTHS}
                        selected={companyBenefits}
                        onChange={setCompanyBenefits}
                        multiple={true}
                        placeholder="Select offered employment models..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - PORTFOLIO GALLERY & FILES */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* SECTION 4: GALLERY SECTION CARD */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider">
                    {userType === 'worker' ? 'Work Portfolio Gallery' : 'Company Project Gallery'}
                  </h3>
                </div>
                
                {/* Add files in gallery via button */}
                <div className="relative">
                  <button 
                    type="button"
                    className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-[#10B981] rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Images
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      for (let i = 0; i < files.length; i++) {
                        await handleUploadSingleFile(files[i], userType === 'worker' ? 'work-gallery' : 'company-gallery', userType === 'worker' ? 'gallery' : 'company_gallery');
                      }
                    }} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>
              </div>

              {/* Gallery Images Rendering */}
              <div className="space-y-4">
                
                {/* Main Grid */}
                {(userType === 'worker' ? galleryImages : companyGalleryImages).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(userType === 'worker' ? galleryImages : companyGalleryImages).map((imgUrl, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-zinc-100 bg-zinc-50 shadow-xs">
                        <img 
                          src={imgUrl} 
                          alt="Gallery work sample" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          
                          {/* Replace image helper inside overlay */}
                          <div className="relative w-full">
                            <button 
                              type="button"
                              className="w-full py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Replace
                            </button>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleReplaceGalleryImage(e, userType === 'worker' ? 'work-gallery' : 'company-gallery', userType === 'worker' ? 'gallery' : 'company_gallery', idx)} 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                            />
                          </div>

                          {/* Remove image helper */}
                          <button 
                            type="button"
                            onClick={() => handleRemoveFile(imgUrl, userType === 'worker' ? 'gallery' : 'company_gallery')}
                            className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Clean Empty State */
                  <div className="border-2 border-dashed border-zinc-200 rounded-3xl p-8 text-center text-zinc-400 space-y-2">
                    <ImageIcon className="w-10 h-10 text-zinc-300 mx-auto" />
                    <p className="text-xs font-mono font-bold uppercase text-zinc-500">No gallery images uploaded yet</p>
                    <p className="text-[10px] text-zinc-400 leading-normal max-w-xs mx-auto">
                      Upload photos of your active trade work sites, before/after portfolios, or machinery setup to increase your hire rating!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5: LEGAL & SCAN UPLOADS */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider">
                  Verified Legal Document Desk
                </h3>
              </div>

              {userType === 'worker' ? (
                // Worker documentation list
                <div className="space-y-3 text-xs font-medium text-zinc-600">
                  
                  {/* CV Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800">Primary Trades Resume (CV)</span>
                      <div className="relative">
                        <button type="button" className="text-[11px] font-mono font-bold text-[#10B981] uppercase tracking-wider hover:underline cursor-pointer">
                          Upload CV
                        </button>
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadSingleFile(file, 'cvs', 'cv');
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </div>
                    </div>
                    {cvUrl ? (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <a href={cvUrl} target="_blank" rel="noreferrer" className="text-[#10B981] font-bold underline truncate flex-1 text-[11px] font-mono">
                          📄 Tradesman_CV.pdf
                        </a>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400">No primary resume loaded yet.</p>
                    )}
                  </div>

                  {/* Certs scans */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800">CSCS/ECS Qualification Files</span>
                      <div className="relative">
                        <button type="button" className="text-[11px] font-mono font-bold text-[#10B981] uppercase tracking-wider hover:underline cursor-pointer">
                          Add Certificate
                        </button>
                        <input 
                          type="file" 
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadSingleFile(file, 'documents', 'certificates');
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </div>
                    </div>
                    {certificateFiles.length > 0 ? (
                      <div className="space-y-1.5">
                        {certificateFiles.map((certUrl, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                            <a href={certUrl} target="_blank" rel="noreferrer" className="text-[#10B981] underline truncate flex-1 text-[11px] font-mono">
                              Certificate #{i + 1}
                            </a>
                            <button 
                              type="button"
                              onClick={() => handleRemoveFile(certUrl, 'certificates')}
                              className="text-rose-600 hover:text-rose-800 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400">No trade certificates uploaded.</p>
                    )}
                  </div>

                  {/* Licences scan upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800">Scanned Licence Badges</span>
                      <div className="relative">
                        <button type="button" className="text-[11px] font-mono font-bold text-[#10B981] uppercase tracking-wider hover:underline cursor-pointer">
                          Add Licence Scan
                        </button>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadSingleFile(file, 'documents', 'licences');
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </div>
                    </div>
                    {licenceImages.length > 0 ? (
                      <div className="space-y-1.5">
                        {licenceImages.map((licUrl, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                            <a href={licUrl} target="_blank" rel="noreferrer" className="text-[#10B981] underline truncate flex-1 text-[11px] font-mono">
                              Licence Scan #{i + 1}
                            </a>
                            <button 
                              type="button"
                              onClick={() => handleRemoveFile(licUrl, 'licences')}
                              className="text-rose-600 hover:text-rose-800 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400">No licence scans uploaded yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                // Contractor documentation list
                <div className="space-y-3 text-xs font-medium text-zinc-600">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800">Verification & Legal documents</span>
                      <div className="relative">
                        <button type="button" className="text-[11px] font-mono font-bold text-[#10B981] uppercase tracking-wider hover:underline cursor-pointer">
                          Add Document
                        </button>
                        <input 
                          type="file" 
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadSingleFile(file, 'documents', 'company_docs');
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </div>
                    </div>
                    {verificationDocuments.length > 0 ? (
                      <div className="space-y-1.5">
                        {verificationDocuments.map((docUrl, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                            <a href={docUrl} target="_blank" rel="noreferrer" className="text-[#10B981] underline truncate flex-1 text-[11px] font-mono">
                              Verification Doc #{i + 1}
                            </a>
                            <button 
                              type="button"
                              onClick={() => handleRemoveFile(docUrl, 'company_docs')}
                              className="text-rose-600 hover:text-rose-800 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400">No corporate verification files loaded yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX ZOOM MODAL OVERLAY */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button 
            type="button" 
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={lightboxImage} 
            alt="Expanded visual sample" 
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
}