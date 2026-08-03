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
  experience: string;
  qualifications: string[];
  location: string;
  availability: string;
  payRate: string;
  rating: number | null;
  reviewsCount: number;
  verified: boolean;
  verifiedBadges: string[];
  portfolio: string[];
  workHistory: WorkHistoryItem[];
  toolsAndTransport: string[];
  about: string;
  reviews: ReviewItem[];
  references: ReferenceItem[];
  phone: string;
  email: string;
  avatar: string;
  coverImage: string;
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
  payRate: string;
  location: string;
  postcode?: string;
  startDate: string;
  duration: string;
  employmentType: string;
  qualifications: string[];
  verified: boolean;
  featured?: boolean;
  urgent?: boolean;
  createdAt?: string;
  description: string;
  benefits: string[];
  requirements: string[];
  companyStats: CompanyStats;
}

export type ApplicationStatus =
  | 'applied'
  | 'viewed'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export interface JobApplication {
  id: string;
  workerId: string;
  contractorId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  viewedAt?: string;
  withdrawnAt?: string;
  note?: string;
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
  ppeRequired: string[];
  notes: string;
}