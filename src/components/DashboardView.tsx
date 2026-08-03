/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Briefcase, MapPin, Calendar, Award, MessageSquare, 
  ChevronRight, Activity, Clock, ShieldCheck, Eye, 
  CheckCircle2, Sparkles, User, Users, Heart, Plus, X, Star
} from 'lucide-react';
import { WorkerProfile, JobProfile, CompanyProfile, Match, Message, Interview, UserType } from '../types';
import {
  bestWorkerMatchAcrossJobs,
  rankJobsForWorker,
  scoreWorkerForJob,
} from '../lib/matching';

const normaliseTradeCategory = (value?: string | null): string => {
  const trade = (value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    trade.includes('paint') ||
    trade.includes('decorat')
  ) {
    return 'painter and decorator';
  }

  if (trade.includes('carpenter') || trade.includes('joiner')) {
    return 'carpenter and joiner';
  }

  if (trade.includes('labourer') || trade.includes('laborer')) {
    return 'general labourer';
  }

  if (trade.includes('heating') || trade.includes('gas engineer')) {
    return 'heating engineer';
  }

  if (trade.includes('window') && trade.includes('fit')) {
    return 'window fitter';
  }

  return trade;
};

const isSameTradeCategory = (
  workerTrade?: string | null,
  jobTrade?: string | null
): boolean => {
  const workerCategory = normaliseTradeCategory(workerTrade);
  const jobCategory = normaliseTradeCategory(jobTrade);

  return Boolean(workerCategory && jobCategory && workerCategory === jobCategory);
};

interface DashboardViewProps {
  userType: UserType;
  workers: WorkerProfile[];
  jobs: JobProfile[];
  interviews: Interview[];
  matches: Match[];
  messages: Message[];
  companies: CompanyProfile[];
  currentUser: { id: string; email: string; userType: UserType } | null;
  onNavigate: (view: string) => void;
  onSelectWorker: (worker: WorkerProfile) => void;
  onSelectJob: (job: JobProfile) => void;
  onUpdateWorker: (updated: WorkerProfile) => void;
  onUpdateCompany: (updated: CompanyProfile) => void;
  onCreateJob: (job: Omit<JobProfile, 'id'>) => Promise<void>;
}

export default function DashboardView({
  userType,
  workers,
  jobs,
  interviews,
  matches,
  messages,
  companies,
  currentUser,
  onNavigate,
  onSelectWorker,
  onSelectJob,
  onUpdateWorker,
  onUpdateCompany,
  onCreateJob
}: DashboardViewProps) {
  // Local notification for availability status update
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Live contractor vacancy creation
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [postingJob, setPostingJob] = useState(false);
  const [jobError, setJobError] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobTrade, setJobTrade] = useState('');
  const [jobSubcategory, setJobSubcategory] = useState('');
  const [jobPayRate, setJobPayRate] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobStartDate, setJobStartDate] = useState('');
  const [jobDuration, setJobDuration] = useState('Ongoing');
  const [jobEmploymentType, setJobEmploymentType] = useState('CIS Contract');
  const [jobDescription, setJobDescription] = useState('');
  const [jobQualifications, setJobQualifications] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [jobBenefits, setJobBenefits] = useState('');

  // Resolved profiles for logged-in users
  const loggedInWorker = workers.find(w => w.id === currentUser?.id) || workers[0] || {
    id: currentUser?.id || 'w_temp',
    name: 'Loading Profile...',
    trade: 'General Laborer',
    subcategory: '',
    experience: '1 Year',
    qualifications: [],
    location: 'London',
    availability: 'Immediate',
    payRate: '£150/day',
    rating: 5.0,
    reviewsCount: 0,
    verified: false,
    verifiedBadges: [],
    portfolio: [],
    workHistory: [],
    toolsAndTransport: [],
    about: 'Loading your profile...',
    reviews: [],
    references: [],
    phone: '',
    email: currentUser?.email || '',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80',
    licences: [],
    positionLengths: []
  };

  const loggedInCompany = companies.find(c => c.id === currentUser?.id) || companies[0] || {
    id: currentUser?.id || 'c_temp',
    name: 'Loading Company...',
    logo: 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    description: 'Loading details...',
    openVacanciesCount: 0,
    benefits: [],
    verified: false,
    location: '',
    stats: { projects: 0, workers: 0, rating: 5.0 },
    reviews: [],
    requirements: [],
    website: '',
    industry: 'Construction',
    companySize: '1-10 Employees',
    companyHouseNumber: '',
    vatNumber: '',
    insuranceStatus: ''
  };

  // Calculate profile completion steps for worker
  const getProfileCompletion = (worker: WorkerProfile) => {
    let score = 50; // Base score
    const steps = [
      { label: 'Basic profile details completed', completed: true },
      { label: 'City & Guilds/CSCS certification card added', completed: worker.qualifications.length > 0 },
      { label: 'Hourly/Daily rates configured', completed: !!worker.payRate },
      { label: 'Tools & transport checklist completed', completed: worker.toolsAndTransport.length > 0 },
      { label: 'Work history and reference verified', completed: worker.workHistory.length > 0 },
    ];
    
    const completedCount = steps.filter(s => s.completed).length;
    const percentage = Math.round((completedCount / steps.length) * 100);
    return { percentage, steps };
  };

  const { percentage: workerPercentage, steps: workerSteps } = getProfileCompletion(loggedInWorker);

  // Workers only see jobs from their own main trade category.
  const workerTradeJobs = jobs.filter(job =>
    isSameTradeCategory(loggedInWorker.trade, job.trade)
  );

  // Filters and helpers for Worker Dashboard
  const rankedWorkerJobs = rankJobsForWorker(loggedInWorker, workerTradeJobs);
  const resolvedRecJobs = rankedWorkerJobs.slice(0, 3).map(result => result.item);
  const workerJobMatch = (job: JobProfile) =>
    scoreWorkerForJob(loggedInWorker, job);
  const topWorkerMatch = rankedWorkerJobs[0]?.match;

  // Jobs promoted from the Admin Dashboard.
  // The cast keeps this compatible if `featured` has not yet been added
  // to the shared JobProfile TypeScript interface.
  const featuredJobs = rankedWorkerJobs
    .filter(({ item }) =>
      Boolean((item as JobProfile & { featured?: boolean }).featured)
    )
    .slice(0, 4)
    .map(({ item }) => item);

  const workerMatches = matches.filter(m => m.workerId === loggedInWorker.id);
  
  // Resolve matched jobs for matches widget
  const workerMatchedJobs = workerMatches.map(m => {
    const job = jobs.find(j => j.id === m.jobId);
    return {
      match: m,
      job
    };
  }).filter(item => item.job).slice(0, 3);

  // Resolve recent messages for the worker's match chat threads
  const workerChatMessages = messages.filter(msg => 
    workerMatches.some(m => m.id === msg.matchId)
  ).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 3);

  // Upcoming interviews for worker
  const workerInterviews = interviews.filter(i => 
    i.workerId === loggedInWorker.id && (i.status === 'confirmed' || i.status === 'pending')
  ).slice(0, 3);

  // Filters and helpers for Contractor Dashboard
  // Active vacancies posted by this company
  const activeVacancies = jobs.filter(j => j.companyId === loggedInCompany.id);

  // Recommended workers matching active vacancies trades
  const recommendedWorkers = [...workers]
    .sort(
      (a, b) =>
        bestWorkerMatchAcrossJobs(b, activeVacancies).score -
        bestWorkerMatchAcrossJobs(a, activeVacancies).score
    )
    .slice(0, 3);

  const contractorWorkerMatch = (worker: WorkerProfile) =>
    bestWorkerMatchAcrossJobs(worker, activeVacancies);

  // Resolve all matches belonging to this contractor, including direct matches
  // that were created before a specific vacancy was attached.
  const contractorMatches = matches.filter(match => {
    if (match.contractorId === loggedInCompany.id) return true;

    const matchedJob = jobs.find(job => job.id === match.jobId);
    return matchedJob?.companyId === loggedInCompany.id;
  });

  const contractorChatMessages = messages.filter(msg => 
    contractorMatches.some(m => m.id === msg.matchId)
  ).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 3);

  // Upcoming interviews for Contractor
  const contractorInterviews = interviews.filter(i => 
    activeVacancies.some(v => v.id === i.jobId)
  ).slice(0, 3);

  // Recent applicants (matches waiting/active for this contractor's jobs)
  const recentApplicants = contractorMatches.map(m => {
    const worker = workers.find(w => w.id === m.workerId);
    const job = jobs.find(j => j.id === m.jobId);
    return {
      match: m,
      worker,
      job
    };
  }).filter(item => item.worker && item.job).slice(0, 3);


  // Live dashboard analytics
  const workerMessageCount = messages.filter(message =>
    workerMatches.some(match => match.id === message.matchId)
  ).length;

  const workerInterviewCount = interviews.filter(
    interview => interview.workerId === loggedInWorker.id
  ).length;

  const contractorMessageCount = messages.filter(message =>
    contractorMatches.some(match => match.id === message.matchId)
  ).length;

  const contractorInterviewCount = interviews.filter(interview => {
    const interviewJob = jobs.find(job => job.id === interview.jobId);
    return interviewJob?.companyId === loggedInCompany.id;
  }).length;

  const workerRating =
    loggedInWorker.rating !== null && loggedInWorker.rating !== undefined
      ? Number(loggedInWorker.rating).toFixed(1)
      : 'New';

  const contractorRating =
    loggedInCompany.stats?.rating !== null &&
    loggedInCompany.stats?.rating !== undefined
      ? Number(loggedInCompany.stats.rating).toFixed(1)
      : 'New';

  const handleUpdateAvailability = (val: string) => {
    const updated = { ...loggedInWorker, availability: val };
    onUpdateWorker(updated);
    setShowNotification(`Availability status changed to "${val}"`);
    setTimeout(() => setShowNotification(null), 3500);
  };

  const resetJobForm = () => {
    setJobTitle('');
    setJobTrade('');
    setJobSubcategory('');
    setJobPayRate('');
    setJobLocation('');
    setJobStartDate('');
    setJobDuration('Ongoing');
    setJobEmploymentType('CIS Contract');
    setJobDescription('');
    setJobQualifications('');
    setJobRequirements('');
    setJobBenefits('');
    setJobError('');
  };

  const splitCommaList = (value: string) =>
    value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

  const handlePostJob = async (event: React.FormEvent) => {
    event.preventDefault();
    setJobError('');

    if (!currentUser || userType !== 'employer') {
      setJobError('You must be signed in as a contractor to post a vacancy.');
      return;
    }

    if (!jobTitle.trim() || !jobTrade.trim() || !jobPayRate.trim() || !jobLocation.trim()) {
      setJobError('Job title, trade, pay rate, and location are required.');
      return;
    }

    setPostingJob(true);

    try {
      await onCreateJob({
        companyId: loggedInCompany.id,
        companyName: loggedInCompany.name,
        companyLogo: loggedInCompany.companyLogoUrl || loggedInCompany.logo || '',
        companyCover: loggedInCompany.coverImage || '',
        title: jobTitle.trim(),
        trade: jobTrade.trim(),
        subcategory: jobSubcategory.trim(),
        payRate: jobPayRate.trim(),
        location: jobLocation.trim(),
        startDate: jobStartDate,
        duration: jobDuration.trim() || 'Ongoing',
        employmentType: jobEmploymentType,
        qualifications: splitCommaList(jobQualifications),
        verified: loggedInCompany.verified,
        description: jobDescription.trim(),
        benefits: splitCommaList(jobBenefits),
        requirements: splitCommaList(jobRequirements),
        companyStats: loggedInCompany.stats || {
          projects: 0,
          workers: 0,
          rating: null
        }
      });

      resetJobForm();
      setShowPostJobModal(false);
      setShowNotification('Vacancy posted successfully');
      setTimeout(() => setShowNotification(null), 3500);
    } catch (error: any) {
      setJobError(error?.message || 'Could not post the vacancy.');
    } finally {
      setPostingJob(false);
    }
  };

  return (
    <div id="dashboard_view" className="space-y-10 pb-16 px-1 max-w-6xl mx-auto font-sans">
      
      {/* Interactive Micro Notification */}
      {showNotification && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-950 text-white text-xs font-mono font-bold tracking-wider uppercase px-4 py-3 rounded-lg shadow-lg border border-emerald-500/30 flex items-center gap-2 animate-fade-in animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[#34D399]"></span>
          {showNotification}
        </div>
      )}

      {/* 1. Welcome Message */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-10 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-wider">
            <Activity className="w-3 h-3 text-[#34D399]" />
            Active Platform Connection
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-950">
            Welcome back, {userType === 'employer' ? loggedInCompany.name : loggedInWorker.name}
          </h1>
          <p className="text-zinc-700 text-sm md:text-base leading-relaxed">
            {userType === 'employer' 
              ? `You have ${activeVacancies.length} live site openings currently listed on HireUp. Find skilled, local, CSCS-certified tradesmen within minutes.`
              : `Your electrical & mechanical profile is active and visible. We've matched your qualifications with ${resolvedRecJobs.length} local London contractor vacancies today.`}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button 
              onClick={() => onNavigate('swipe')}
              className="px-5 py-2.5 text-xs bg-[#34D399] hover:bg-[#10B981] text-zinc-950 hover:text-white font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-zinc-950 group-hover:text-white" />
              {userType === 'employer' ? 'Match With Tradesmen' : 'Match With Contractors'}
            </button>
            {userType === 'employer' && (
              <button
                onClick={() => setShowPostJobModal(true)}
                className="px-5 py-2.5 text-xs bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#34D399]" />
                Post a Job
              </button>
            )}
            <button 
              onClick={() => onNavigate('profile')}
              className="px-5 py-2.5 text-xs bg-white hover:bg-zinc-50 text-zinc-950 border border-zinc-200 font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-4 h-4 text-[#10B981]" />
              Manage Profile
            </button>
          </div>
        </div>
      </div>

      <section className="bg-gradient-to-r from-zinc-950 to-zinc-900 text-white rounded-2xl p-5 md:p-6 border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#34D399]/15 text-[#34D399] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <p className="text-[9px] font-mono font-black text-[#34D399] uppercase tracking-wider">
              HireUp Smart Matching
            </p>
            <h2 className="text-xl font-black mt-1">
              {userType === 'worker'
                ? topWorkerMatch
                  ? `${topWorkerMatch.score}% ${topWorkerMatch.label}`
                  : `${resolvedRecJobs.length} recommended opportunities found`
                : `${recommendedWorkers.length} recommended workers found`}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {userType === 'worker'
                ? 'Your jobs are ranked using your trade, qualifications, location, availability and pay.'
                : 'Workers are ranked against your active vacancies and their requirements.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('swipe')}
            className="px-4 py-2.5 bg-[#34D399] text-zinc-950 rounded-xl text-[10px] font-mono font-black uppercase whitespace-nowrap"
          >
            View Smart Matches
          </button>
        </div>
      </section>

      {/* Live Analytics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {userType === 'worker' ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate('matches')}
              className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-xl p-4 md:p-5 text-left transition-all hover:shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#10B981] transition-colors" />
              </div>
              <p className="text-2xl font-black text-zinc-950 mt-4">{workerMatches.length}</p>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Matches
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('messages')}
              className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-xl p-4 md:p-5 text-left transition-all hover:shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#10B981] transition-colors" />
              </div>
              <p className="text-2xl font-black text-zinc-950 mt-4">{workerMessageCount}</p>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Messages
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('interviews')}
              className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-xl p-4 md:p-5 text-left transition-all hover:shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#10B981] transition-colors" />
              </div>
              <p className="text-2xl font-black text-zinc-950 mt-4">{workerInterviewCount}</p>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Interviews
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-xl p-4 md:p-5 text-left transition-all hover:shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-current" />
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#10B981] transition-colors" />
              </div>
              <p className="text-2xl font-black text-zinc-950 mt-4">{workerRating}</p>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Rating · {loggedInWorker.reviewsCount} Reviews
              </p>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowPostJobModal(true)}
              className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-xl p-4 md:p-5 text-left transition-all hover:shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </span>
                <Plus className="w-4 h-4 text-zinc-300 group-hover:text-[#10B981] transition-colors" />
              </div>
              <p className="text-2xl font-black text-zinc-950 mt-4">{activeVacancies.length}</p>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Live Jobs
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('matches')}
              className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-xl p-4 md:p-5 text-left transition-all hover:shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#10B981] transition-colors" />
              </div>
              <p className="text-2xl font-black text-zinc-950 mt-4">{contractorMatches.length}</p>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Active Matches
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('interviews')}
              className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-xl p-4 md:p-5 text-left transition-all hover:shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#10B981] transition-colors" />
              </div>
              <p className="text-2xl font-black text-zinc-950 mt-4">{contractorInterviewCount}</p>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Interviews
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-xl p-4 md:p-5 text-left transition-all hover:shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-current" />
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#10B981] transition-colors" />
              </div>
              <p className="text-2xl font-black text-zinc-950 mt-4">{contractorRating}</p>
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Rating · {loggedInCompany.reviews.length} Reviews
              </p>
            </button>
          </>
        )}
      </div>

      {/* ================= WORKER DASHBOARD ================= */}
      {userType === 'worker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left / Main Column */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 2. Featured Jobs */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-zinc-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-black tracking-tight uppercase">
                        Featured Jobs
                      </h2>
                      <p className="text-xs text-black">
                        Jobs selected and promoted by the HireUp admin team
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('swipe')}
                  className="text-xs font-mono font-black text-black hover:text-[#10B981] tracking-wider uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  View All Jobs <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {featuredJobs.length === 0 ? (
                <div className="bg-white border border-zinc-200 border-dashed rounded-2xl p-8 text-center">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="text-sm font-black text-black mt-3">
                    No featured jobs currently available
                  </h3>
                  <p className="text-xs text-black mt-1">
                    Jobs marked as featured from the Admin Dashboard will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('swipe')}
                    className="mt-4 px-4 py-2.5 bg-[#34D399] text-black rounded-xl text-[10px] font-mono font-black uppercase"
                  >
                    Browse all jobs
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredJobs.map(job => {
                    const match = workerJobMatch(job);

                    return (
                      <article
                        key={job.id}
                        className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-[#34D399] hover:shadow-md transition-all"
                      >
                        <div className="h-1.5 bg-[#34D399]" />

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 p-1.5 flex-shrink-0 flex items-center justify-center">
                                {job.companyLogo ? (
                                  <img
                                    src={job.companyLogo}
                                    alt={job.companyName}
                                    className="max-w-full max-h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Briefcase className="w-5 h-5 text-black" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 text-black rounded-full text-[8px] font-mono font-black uppercase">
                                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                                    Featured
                                  </span>

                                  {job.verified && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 text-black rounded-full text-[8px] font-mono font-black uppercase">
                                      <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                                      Verified contractor
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-base font-black text-black mt-2 leading-tight">
                                  {job.title}
                                </h3>
                                <p className="text-xs font-bold text-black mt-1">
                                  {job.companyName}
                                </p>
                              </div>
                            </div>

                            <div className="bg-zinc-100 border border-zinc-200 rounded-xl px-2.5 py-2 text-center flex-shrink-0">
                              <p className="text-[7px] font-mono font-black text-black uppercase">
                                AI match
                              </p>
                              <p className="text-lg font-black text-black leading-none mt-1">
                                {match.score}%
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-5">
                            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                              <p className="text-[8px] font-mono font-black text-black uppercase">
                                Pay
                              </p>
                              <p className="text-sm font-black text-black mt-1">
                                {job.payRate}
                              </p>
                            </div>

                            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                              <p className="text-[8px] font-mono font-black text-black uppercase">
                                Start date
                              </p>
                              <p className="text-xs font-black text-black mt-1">
                                {job.startDate || 'Immediate'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-black">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-black" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-black" />
                              {job.duration || 'Ongoing'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-black" />
                              {job.employmentType}
                            </span>
                          </div>

                          {match.reasons[0] && (
                            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                              <p className="text-[9px] font-mono font-black text-black uppercase">
                                Why it matches
                              </p>
                              <p className="text-xs text-black mt-1">
                                {match.reasons[0]}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-zinc-200">
                            <button
                              type="button"
                              onClick={() => onSelectJob(job)}
                              className="py-2.5 border border-zinc-300 text-black rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-1.5 hover:bg-zinc-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View job
                            </button>

                            <button
                              type="button"
                              onClick={() => onSelectJob(job)}
                              className="py-2.5 bg-[#34D399] text-black rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-1.5 hover:bg-[#10B981]"
                            >
                              <Briefcase className="w-3.5 h-3.5" />
                              Apply
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Recent Matches */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 tracking-tight uppercase">Recent Matches</h2>
                  <p className="text-xs text-zinc-500">Contractor partnerships unlocked by Mutual Right-Swipes</p>
                </div>
                <button 
                  onClick={() => onNavigate('matches')}
                  className="text-xs font-mono font-black text-[#10B981] hover:text-[#34D399] tracking-wider uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {workerMatchedJobs.length === 0 ? (
                <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-8 text-center text-zinc-500 text-xs">
                  No matches found yet. Head to the matching swipe screen to find commercial trades positions.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {workerMatchedJobs.map(({ match, job }) => job && (
                    <div key={match.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col justify-between hover:border-[#34D399] transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-zinc-50 p-1 border border-zinc-100 flex-shrink-0 flex items-center justify-center">
                            <img src={job.companyLogo} alt={job.companyName} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-zinc-950 text-xs truncate">{job.companyName}</h4>
                            <p className="text-[10px] text-zinc-500 font-mono truncate uppercase">{job.location}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-zinc-950 truncate">{job.title}</p>
                          <span className="inline-block text-[9px] font-mono font-bold text-[#10B981] uppercase">Matched at {new Date(match.matchedAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-100 mt-3 flex justify-between items-center">
                        <button 
                          onClick={() => onNavigate('messages')}
                          className="text-[10px] font-mono font-bold text-zinc-500 hover:text-[#10B981] uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 text-[#34D399]" /> Send Message
                        </button>
                        <button 
                          onClick={() => onSelectJob(job)}
                          className="p-1 text-zinc-400 hover:text-zinc-950 rounded cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Messages preview */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 tracking-tight uppercase">Recent Messages</h2>
                  <p className="text-xs text-zinc-500">Unread notes and dialogue updates from construction managers</p>
                </div>
                <button 
                  onClick={() => onNavigate('messages')}
                  className="text-xs font-mono font-black text-[#10B981] hover:text-[#34D399] tracking-wider uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  Open Inbox <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {workerChatMessages.length === 0 ? (
                <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-6 text-center text-zinc-500 text-xs">
                  No messages. Keep matching with sites to unlock chats.
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 overflow-hidden">
                  {workerChatMessages.map((msg) => {
                    const matchedItem = workerMatchedJobs.find(item => item.match.id === msg.matchId);
                    return (
                      <div 
                        key={msg.id} 
                        onClick={() => onNavigate('messages')}
                        className="p-4 hover:bg-zinc-50/50 transition-all cursor-pointer flex gap-4 items-start"
                      >
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 p-1 flex-shrink-0 flex items-center justify-center border border-zinc-200">
                          <img 
                            src={matchedItem?.job?.companyLogo || loggedInCompany.logo} 
                            alt="avatar" 
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-zinc-950">{matchedItem?.job?.companyName || 'Contractor Partner'}</span>
                            <span className="text-[10px] font-mono text-zinc-400">{msg.timestamp}</span>
                          </div>
                          <p className="text-xs text-zinc-600 truncate leading-relaxed">
                            <span className="font-mono font-bold uppercase text-[#10B981] mr-1">
                              {msg.sender === 'worker' ? 'You:' : 'Manager:'}
                            </span>
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column / Widgets */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* 5. Profile Completion Percentage */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Verification Level</span>
                <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">Profile Strength</h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline font-mono text-xs">
                  <span className="font-bold text-zinc-600">Completion</span>
                  <span className="font-black text-[#10B981] text-lg">{workerPercentage}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#34D399] h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${workerPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-[11px] text-zinc-600 font-medium">To reach 100% and unlock direct recruiter invites, complete the pending items below:</p>
                <div className="space-y-2">
                  {workerSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-xs text-zinc-700">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${step.completed ? 'text-[#10B981]' : 'text-zinc-200'}`} />
                      <span className={step.completed ? 'line-through text-zinc-400' : 'font-medium'}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. Availability Status Toggle */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Site Availability</h3>
                <p className="text-xs text-zinc-700 font-medium mt-1">Recruiters filtered search results by active availability states.</p>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 space-y-1">
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">Current Status</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse"></span>
                  <span className="text-sm font-bold text-zinc-950 uppercase tracking-wide">{loggedInWorker.availability}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Change Status:</span>
                <div className="grid grid-cols-2 gap-2">
                  {['Immediate', 'In 1 Week', 'In 2 Weeks', 'Unavailable'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleUpdateAvailability(opt)}
                      className={`py-2 px-3 text-[11px] font-mono font-black uppercase rounded-lg border tracking-wider transition-all cursor-pointer text-center ${
                        loggedInWorker.availability === opt
                          ? 'bg-[#34D399] text-zinc-950 border-[#34D399] font-bold shadow-xs'
                          : 'bg-white hover:bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-zinc-950'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 7. Upcoming Interviews */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">Upcoming Meets</h3>
                <span className="text-[10px] font-mono font-bold bg-[#E6FBF3] text-[#10B981] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {workerInterviews.length} Booked
                </span>
              </div>

              {workerInterviews.length === 0 ? (
                <div className="text-xs text-zinc-500 text-center py-4 border border-zinc-100 border-dashed rounded-lg">
                  No site interviews scheduled. Mutual matches can propose and schedule interviews.
                </div>
              ) : (
                <div className="space-y-3">
                  {workerInterviews.map((int) => {
                    const job = jobs.find(j => j.id === int.jobId);
                    return (
                      <div key={int.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-black text-zinc-950">{job?.title || 'Site Walkthrough'}</p>
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                            int.status === 'confirmed' ? 'bg-[#E6FBF3] text-[#10B981]' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {int.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-zinc-700">
                          <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-400" /> {int.date} at {int.time}</p>
                          <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-zinc-400" /> {int.location}</p>
                        </div>
                        {int.ppeRequired.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {int.ppeRequired.map((ppe, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-zinc-200 rounded text-[9px] font-mono font-bold text-zinc-600 uppercase">
                                {ppe}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => onNavigate('interviews')}
                    className="w-full text-center text-xs font-mono font-black text-[#10B981] hover:text-[#34D399] uppercase pt-2"
                  >
                    View All Scheduled Meets
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}


      {/* ================= CONTRACTOR DASHBOARD ================= */}
      {userType === 'employer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column / Primary Content */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 2. Active Vacancies */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 tracking-tight uppercase">Active Vacancies</h2>
                  <p className="text-xs text-zinc-500">Live positions actively displayed on the swiper feeds</p>
                </div>
                <button 
                  onClick={() => setShowPostJobModal(true)}
                  className="text-xs font-mono font-black text-[#10B981] hover:text-[#34D399] tracking-wider uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  Post a Job <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeVacancies.length === 0 ? (
                <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-8 text-center text-zinc-500 text-xs">
                  No active vacancies yet. Click Post a Job to publish your first live position.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeVacancies.slice(0, 4).map((job) => {
                    const matchCount = matches.filter(m => m.jobId === job.id).length;
                    return (
                      <div key={job.id} className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-[#34D399] transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-mono font-black bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded uppercase">{job.employmentType}</span>
                            <span className="text-xs font-mono font-black text-[#10B981]">{job.payRate}</span>
                          </div>
                          <h3 className="font-bold text-zinc-950 text-sm truncate">{job.title}</h3>
                          <p className="text-xs text-zinc-500 font-mono flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</p>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                          <span className="text-xs font-mono text-zinc-500 font-bold uppercase">{matchCount} Active Matches</span>
                          <button 
                            onClick={() => onSelectJob(job)}
                            className="text-xs font-mono font-bold text-[#10B981] hover:text-[#34D399] uppercase"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Recommended Workers */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 tracking-tight uppercase">Recommended Workers</h2>
                  <p className="text-xs text-zinc-500">Highest matching certified tradespeople local to your sites</p>
                </div>
                <button 
                  onClick={() => onNavigate('swipe')}
                  className="text-xs font-mono font-black text-[#10B981] hover:text-[#34D399] tracking-wider uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                {recommendedWorkers.map((worker) => (
                  <div 
                    key={worker.id} 
                    className="bg-white border border-zinc-200 p-5 rounded-xl hover:border-[#34D399] transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
                  >
                    <div className="w-full sm:w-auto">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-mono font-black uppercase">
                        <Sparkles className="w-3 h-3" />
                        {contractorWorkerMatch(worker).score}% match
                      </span>
                      <p className="text-[9px] text-zinc-400 mt-1">
                        {contractorWorkerMatch(worker).reasons[0]}
                      </p>
                    </div>
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 p-0.5 border border-zinc-200 flex-shrink-0">
                        <img 
                          src={worker.avatar} 
                          alt={worker.name} 
                          className="w-full h-full object-cover rounded"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-zinc-950 text-sm">{worker.name}</h3>
                          {worker.verified && <ShieldCheck className="w-4 h-4 text-[#10B981]" />}
                        </div>
                        <p className="text-xs text-zinc-500 font-mono font-bold">{worker.trade} &bull; {worker.experience} Exp</p>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-zinc-600">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-zinc-400" /> {worker.location}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-400" /> Available {worker.availability}</span>
                          <div className="flex gap-1">
                            {worker.qualifications.slice(0, 2).map((q, idx) => (
                              <span key={idx} className="px-1 py-0.2 bg-zinc-100 text-[9px] font-mono font-black text-zinc-600 rounded uppercase border border-zinc-200">{q}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 gap-2">
                      <span className="text-sm font-mono font-black text-[#10B981] bg-[#E6FBF3] px-2.5 py-1 rounded">{worker.payRate}</span>
                      <button 
                        onClick={() => onSelectWorker(worker)}
                        className="px-3 py-1.5 text-[10px] bg-zinc-100 hover:bg-[#34D399] text-zinc-700 hover:text-zinc-950 font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Messages preview */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 tracking-tight uppercase">Recent Messages</h2>
                  <p className="text-xs text-zinc-500">Dialogue channels with matched candidates</p>
                </div>
                <button 
                  onClick={() => onNavigate('messages')}
                  className="text-xs font-mono font-black text-[#10B981] hover:text-[#34D399] tracking-wider uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  Open Inbox <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {contractorChatMessages.length === 0 ? (
                <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-6 text-center text-zinc-500 text-xs">
                  No active chats yet. Connect with verified candidates to begin messages.
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 overflow-hidden">
                  {contractorChatMessages.map((msg) => {
                    const matchedItem = recentApplicants.find(item => item.match.id === msg.matchId);
                    return (
                      <div 
                        key={msg.id} 
                        onClick={() => onNavigate('messages')}
                        className="p-4 hover:bg-zinc-50/50 transition-all cursor-pointer flex gap-4 items-start"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-200">
                          <img 
                            src={matchedItem?.worker?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'} 
                            alt="avatar" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-zinc-950">{matchedItem?.worker?.name || 'Tradesperson Partner'}</span>
                            <span className="text-[10px] font-mono text-zinc-400">{msg.timestamp}</span>
                          </div>
                          <p className="text-xs text-zinc-600 truncate leading-relaxed">
                            <span className="font-mono font-bold uppercase text-[#10B981] mr-1">
                              {msg.sender === 'employer' ? 'You:' : 'Candidate:'}
                            </span>
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column / Sidebar items */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* 5. Recent Applicants (Matched Candidates) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">Recent Applicants</h3>
                <span className="text-[10px] font-mono font-bold bg-[#E6FBF3] text-[#10B981] px-2 py-0.5 rounded-full uppercase">
                  {recentApplicants.length} Active
                </span>
              </div>

              {recentApplicants.length === 0 ? (
                <div className="text-xs text-zinc-500 text-center py-4 border border-zinc-100 border-dashed rounded-lg">
                  No matches or applications yet. Head to the match feed to get mutual right swipes.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentApplicants.map(({ match, worker, job }) => worker && job && (
                    <div key={match.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg space-y-2 flex gap-3 items-start justify-between">
                      <div className="flex gap-2.5 items-start">
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 border border-zinc-200">
                          <img src={worker.avatar} alt={worker.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-zinc-950">{worker.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono leading-none">{worker.trade}</p>
                          <p className="text-[9px] text-[#10B981] font-mono font-bold pt-1 leading-none">Job: {job.title}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onSelectWorker(worker)}
                        className="p-1 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950 rounded cursor-pointer transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => onNavigate('matches')}
                    className="w-full text-center text-xs font-mono font-black text-[#10B981] hover:text-[#34D399] uppercase pt-1"
                  >
                    View All Partnerships
                  </button>
                </div>
              )}
            </div>

            {/* 6. Upcoming Interviews */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">Interviews & Visits</h3>
                <span className="text-[10px] font-mono font-bold bg-[#E6FBF3] text-[#10B981] px-2 py-0.5 rounded-full uppercase">
                  {contractorInterviews.length} Booked
                </span>
              </div>

              {contractorInterviews.length === 0 ? (
                <div className="text-xs text-zinc-500 text-center py-4 border border-zinc-100 border-dashed rounded-lg">
                  No site visit walks scheduled yet. Proposed schedules appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {contractorInterviews.map((int) => {
                    const worker = workers.find(w => w.id === int.workerId);
                    const job = jobs.find(j => j.id === int.jobId);
                    return (
                      <div key={int.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-black text-zinc-950">{worker?.name || 'Walkthrough meet'}</p>
                            <p className="text-[9px] text-zinc-500 font-mono uppercase">{job?.title}</p>
                          </div>
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                            int.status === 'confirmed' ? 'bg-[#E6FBF3] text-[#10B981]' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {int.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-zinc-700">
                          <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-400" /> {int.date} at {int.time}</p>
                          <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-zinc-400" /> {int.location}</p>
                        </div>
                      </div>
                    );
                  })}
                  <button 
                    onClick={() => onNavigate('interviews')}
                    className="w-full text-center text-xs font-mono font-black text-[#10B981] hover:text-[#34D399] uppercase pt-2"
                  >
                    Manage Visits Schedule
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {showPostJobModal && userType === 'employer' && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handlePostJob}
            className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl my-8"
          >
            <div className="flex justify-between items-start pb-3 border-b border-zinc-200">
              <div>
                <h3 className="text-base font-black text-zinc-900 uppercase font-mono tracking-wider">
                  Post a Live Vacancy
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Publish a real position to HireUp workers and the swipe deck.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetJobForm();
                  setShowPostJobModal(false);
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {jobError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                {jobError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Job Title *</span>
                <input
                  value={jobTitle}
                  onChange={event => setJobTitle(event.target.value)}
                  placeholder="Commercial Electrician"
                  required
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-[#34D399]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Main Trade *</span>
                <input
                  value={jobTrade}
                  onChange={event => setJobTrade(event.target.value)}
                  placeholder="Electrician"
                  required
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-[#34D399]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Specialism</span>
                <input
                  value={jobSubcategory}
                  onChange={event => setJobSubcategory(event.target.value)}
                  placeholder="Commercial Installation"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-[#34D399]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Pay Rate *</span>
                <input
                  value={jobPayRate}
                  onChange={event => setJobPayRate(event.target.value)}
                  placeholder="£250/day"
                  required
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-[#34D399]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Location *</span>
                <input
                  value={jobLocation}
                  onChange={event => setJobLocation(event.target.value)}
                  placeholder="Brighton, East Sussex"
                  required
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-[#34D399]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Start Date</span>
                <input
                  type="date"
                  value={jobStartDate}
                  onChange={event => setJobStartDate(event.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-[#34D399]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Duration</span>
                <input
                  value={jobDuration}
                  onChange={event => setJobDuration(event.target.value)}
                  placeholder="3 Months or Ongoing"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-[#34D399]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Employment Type</span>
                <select
                  value={jobEmploymentType}
                  onChange={event => setJobEmploymentType(event.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-[#34D399]"
                >
                  <option>CIS Contract</option>
                  <option>Subcontractor</option>
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Temporary</option>
                  <option>Self-Employed</option>
                </select>
              </label>
            </div>

            <label className="space-y-1 block">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Job Description</span>
              <textarea
                value={jobDescription}
                onChange={event => setJobDescription(event.target.value)}
                rows={4}
                placeholder="Describe the site, duties, shift pattern, and expected experience."
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-[#34D399] resize-none"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Qualifications</span>
                <input
                  value={jobQualifications}
                  onChange={event => setJobQualifications(event.target.value)}
                  placeholder="CSCS Gold, NVQ Level 3"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-[#34D399]"
                />
                <span className="text-[9px] text-zinc-400">Separate with commas</span>
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Requirements</span>
                <input
                  value={jobRequirements}
                  onChange={event => setJobRequirements(event.target.value)}
                  placeholder="Own tools, Driving licence"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-[#34D399]"
                />
                <span className="text-[9px] text-zinc-400">Separate with commas</span>
              </label>

              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Benefits</span>
                <input
                  value={jobBenefits}
                  onChange={event => setJobBenefits(event.target.value)}
                  placeholder="Weekly pay, Parking"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-[#34D399]"
                />
                <span className="text-[9px] text-zinc-400">Separate with commas</span>
              </label>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  resetJobForm();
                  setShowPostJobModal(false);
                }}
                disabled={postingJob}
                className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 font-mono font-bold text-xs rounded-lg hover:bg-zinc-50 disabled:opacity-50"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={postingJob}
                className="flex-1 py-2.5 bg-[#34D399] hover:bg-[#10B981] text-white font-mono font-bold text-xs rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Briefcase className="w-4 h-4" />
                {postingJob ? 'POSTING...' : 'PUBLISH VACANCY'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}