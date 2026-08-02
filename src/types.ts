/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserType = 'worker' | 'employer';

export interface WorkHistoryItem {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface ReviewItem {
  id: string;
  reviewer: string;
  role: string;
  rating: number;
  text: string;
  date: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  position: string;
  contact: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  trade: string;
  subcategory?: string;
  experience: string; // e.g. "12 Years"
  qualifications: string[]; // e.g. ["CSCS Gold Card", "NVQ Level 3", "NICEIC Certified"]
  location: string; // e.g. "Manchester"
  availability: string; // e.g. "Immediate", "In 1 Week"
  payRate: string; // e.g. "£220/day"
  rating: number | null;
  reviewsCount: number;
  verified: boolean;
  verifiedBadges: string[]; // e.g. ["Checkatrade Approved", "CSCS Verified"]
  portfolio: string[]; // titles or image references
  workHistory: WorkHistoryItem[];
  toolsAndTransport: string[]; // e.g. ["Own Van", "Full Hand Tools", "Power Tools"]
  about: string;
  reviews: ReviewItem[];
  references: ReferenceItem[];
  phone: string;
  email: string;
  avatar: string; // visual representation identifier
  coverImage: string; // visual cover banner style
  licences?: string[];
  positionLengths?: string[];
  profilePhotoUrl?: string;
  galleryImages?: string[];
  cvUrl?: string;
  certificateFiles?: string[];
  licenceImages?: string[];
}

export interface CompanyStats {
  projects: number;
  workers: number;
  rating: number | null;
}

export interface CompanyProfile {
  id: string;
  name: string;
  logo: string;
  coverImage: string;
  description: string;
  openVacanciesCount: number;
  benefits: string[];
  reviews: ReviewItem[];
  stats: CompanyStats;
  verified: boolean;
  location: string;
  requirements?: string[];
  website?: string;
  industry?: string;
  companySize?: string;
  companyHouseNumber?: string;
  vatNumber?: string;
  insuranceStatus?: string;
  phone?: string;
  companyLogoUrl?: string;
  companyGalleryImages?: string[];
  verificationDocuments?: string[];
  publicLiabilityInsurance?: string;
  employersLiabilityInsurance?: string;
  businessAddress?: string;
  postcode?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface JobProfile {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  companyCover: string;
  title: string;
  trade: string;
  subcategory?: string;
  payRate: string; // e.g. "£250/day" or "£28/hour"
  location: string;
  startDate: string;
  duration: string; // e.g. "3 Months", "Ongoing"
  employmentType: string; // e.g. "Subcontractor", "CIS Contract", "Full-Time"
  qualifications: string[];
  verified: boolean;
  description: string;
  benefits: string[];
  requirements: string[];
  companyStats: CompanyStats;
}

export interface Match {
  id: string;
  workerId: string;
  jobId: string;
  matchedAt: string;
  lastMessageText?: string;
  lastMessageTime?: string;
  status?: string;
  contractorId?: string;
}

export interface Message {
  id: string;
  matchId: string;
  sender: 'worker' | 'employer';
  text: string;
  timestamp: string;
  isRead: boolean;
  attachmentType?: 'image' | 'document' | 'voice';
  attachmentName?: string;
}

export interface Interview {
  id: string;
  workerId: string;
  jobId: string;
  date: string;
  time: string;
  location: string;
  status: 'pending' | 'confirmed' | 'completed' | 'declined';
  ppeRequired: string[]; // e.g. ["Hard Hat", "Hi-Vis", "Steel Toe Boots"]
  notes: string;
}
