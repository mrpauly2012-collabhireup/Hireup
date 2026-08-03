/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  X, Check, Star, MapPin, Calendar, Clock, Award, Hammer, Wrench, 
  ShieldCheck, Eye, RefreshCw, ChevronLeft, SlidersHorizontal, Sparkles, MessageSquare, Phone,
  Heart, LayoutGrid, List, AlertCircle, Briefcase
} from 'lucide-react';
import { WorkerProfile, JobProfile, CompanyProfile, UserType } from '../types';
import { supabase, saveItemInDb, fetchSavedItems } from '../lib/supabase';
import {
  bestWorkerMatchAcrossJobs,
  scoreWorkerForJob,
} from '../lib/matching';

interface SwipeViewProps {
  userType: UserType;
  workers: WorkerProfile[];
  jobs: JobProfile[];
  companies?: CompanyProfile[];
  currentUser?: { id: string; email: string; userType: UserType } | null;
  onMatchCreated: (workerId: string, jobId: string | null, contractorId?: string) => void;
  onSelectWorker: (worker: WorkerProfile) => void;
  onSelectJob: (job: JobProfile) => void;
  onNavigate: (view: string) => void;
  jobsViewMode?: 'card' | 'list';
  onJobsViewModeChange?: (mode: 'card' | 'list') => void;
}

export default function SwipeView({
  userType,
  workers,
  jobs,
  companies = [],
  currentUser,
  onMatchCreated,
  onSelectWorker,
  onSelectJob,
  onNavigate,
  jobsViewMode = 'card',
  onJobsViewModeChange
}: SwipeViewProps) {
  // Helper to retrieve company rating and reviews count
  const getCompanyRatingString = (companyId: string) => {
    const comp = (companies || []).find(c => c.id === companyId);
    if (comp) {
      const rating = comp.stats?.rating || 4.9;
      const reviewsCount = comp.reviews?.length || 52;
      return `⭐ ${rating} (${reviewsCount})`;
    }
    return `⭐ 4.9 (52)`;
  };

  // Combine jobs and companies/contractors for workers
  const combinedWorkerOpportunities = React.useMemo(() => {
    const mappedContractorOpportunities = (companies || []).map(company => ({
      id: `contractor-${company.id}`,
      companyId: company.id,
      companyName: company.name,
      companyLogo: company.logo,
      title: `${company.name} Trade Opportunities`,
      trade: company.industry || 'Multi-Trade Contractor',
      subcategory: 'Site Contractor Profile',
      payRate: company.insuranceStatus || 'Competitive CIS Rates',
      location: company.location,
      startDate: 'Immediate',
      duration: 'Ongoing Contracts',
      employmentType: 'Full-time / Subcontract',
      qualifications: company.requirements || [],
      verified: company.verified,
      description: company.description,
      benefits: company.benefits || [],
      requirements: company.requirements || [],
      companyStats: company.stats || { projects: 0, workers: 0, rating: 5.0 },
      isContractorOpportunity: true
    } as JobProfile & { isContractorOpportunity?: boolean }));

    return [...jobs, ...mappedContractorOpportunities];
  }, [jobs, companies]);

  // We keep a local deck of items that can be swiped
  const [workerDeck, setWorkerDeck] = useState<WorkerProfile[]>(workers);
  const [jobDeck, setJobDeck] = useState<JobProfile[]>(combinedWorkerOpportunities);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);

  // Track applied/matched jobs to display correct status and prevent double submission.
  // These states must be declared before the effects that use them.
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [shortlistedWorkerIds, setShortlistedWorkerIds] = useState<string[]>([]);
  const [persistedAppliedJobIds, setPersistedAppliedJobIds] = useState<string[]>([]);
  const [persistedShortlistedWorkerIds, setPersistedShortlistedWorkerIds] = useState<string[]>([]);

  useEffect(() => {
    const visibleWorkers = workers.filter(
      worker => !persistedShortlistedWorkerIds.includes(worker.id)
    );
    setWorkerDeck(visibleWorkers);
    setCurrentIndex(0);
  }, [workers, persistedShortlistedWorkerIds]);

  useEffect(() => {
    const visibleOpportunities = combinedWorkerOpportunities.filter(
      opportunity => !persistedAppliedJobIds.includes(opportunity.id)
    );
    setJobDeck(visibleOpportunities);
    setCurrentIndex(0);
  }, [combinedWorkerOpportunities, persistedAppliedJobIds]);

  // Reload saved applications/shortlists from Supabase after login or refresh.
  useEffect(() => {
    let cancelled = false;

    const loadSavedState = async () => {
      if (!currentUser) {
        setAppliedJobIds([]);
        setShortlistedWorkerIds([]);
        setPersistedAppliedJobIds([]);
        setPersistedShortlistedWorkerIds([]);
        return;
      }

      const savedItems = await fetchSavedItems(currentUser.id);
      if (cancelled) return;

      if (currentUser.userType === 'worker') {
        const savedOpportunityIds = savedItems.flatMap(item => {
          if (item.itemType === 'job') return [item.itemId];
          if (item.itemType === 'company') return [`contractor-${item.itemId}`];
          return [];
        });

        setAppliedJobIds(savedOpportunityIds);
        setPersistedAppliedJobIds(savedOpportunityIds);
        setShortlistedWorkerIds([]);
        setPersistedShortlistedWorkerIds([]);
      } else {
        const savedWorkerIds = savedItems
          .filter(item => item.itemType === 'worker')
          .map(item => item.itemId);

        setShortlistedWorkerIds(savedWorkerIds);
        setPersistedShortlistedWorkerIds(savedWorkerIds);
        setAppliedJobIds([]);
        setPersistedAppliedJobIds([]);
      }
    };

    loadSavedState();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.userType]);

  // Register likes in Supabase and check for mutual match
  const registerLikeAndCheckMatch = async (itemId: string, itemType: 'worker' | 'job' | 'company') => {
    if (!currentUser) return;

    const myUserId = currentUser.id;

    // 1. Save the like to Supabase saved_items table
    const saved = await saveItemInDb(myUserId, itemId, itemType);
    if (!saved) {
      console.warn("Could not save the interaction to Supabase.");
    }

    // 2. Check if mutual interest exists
    if (userType === 'worker') {
      // Current user is worker. They liked a job or contractor profile.
      let contractorId = '';
      let targetJobId = '';

      if (itemType === 'company') {
        contractorId = itemId;
        const contractorJob = jobs.find(j => j.companyId === contractorId);
        targetJobId = contractorJob?.id || `dummy-${contractorId}`;
      } else if (itemType === 'job') {
        targetJobId = itemId;
        const job = jobs.find(j => j.id === itemId);
        contractorId = job?.companyId || '';
      }

      if (contractorId) {
        // Check if contractor has liked this worker
        const { data: contractorLike } = await supabase
          .from('saved_items')
          .select('id')
          .eq('user_id', contractorId)
          .eq('item_id', myUserId)
          .eq('item_type', 'worker')
          .maybeSingle();

        if (contractorLike && targetJobId) {
          console.log("MUTUAL MATCH DETECTED! Worker liked job/contractor and contractor liked worker.");
          
          // Trigger match creation
          const resolvedJobId = targetJobId.startsWith('dummy-') ? (jobs.find(j => j.companyId === contractorId)?.id || null) : targetJobId;
          onMatchCreated(myUserId, resolvedJobId, contractorId);
          
          const currentJob = jobs.find(j => j.id === targetJobId) || combinedWorkerOpportunities.find(o => o.id === itemId) || {
            id: targetJobId,
            title: 'General Vacancy',
            companyName: 'Verified Contractor',
            companyLogo: 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=200&auto=format&fit=crop&q=80',
            payRate: 'Competitive CIS Rates'
          } as JobProfile;

          const currentWorker = workers.find(w => w.id === myUserId) || {
            id: myUserId,
            name: 'Me',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
          } as WorkerProfile;

          setCelebrationMatch({
            worker: currentWorker,
            job: currentJob
          });
        }
      }
    } else {
      // Current user is contractor. They liked a worker.
      const workerId = itemId;
      const myCompanyId = myUserId;

      // Find all job IDs of this contractor
      const myJobIds = jobs.filter(j => j.companyId === myCompanyId).map(j => j.id);

      // Check if worker has liked my company profile OR any of my jobs
      const selectQuery = myJobIds.length > 0 
        ? `and(item_id.in.(${myJobIds.join(',')}),item_type.eq.job)`
        : `item_type.eq.company`;

      const { data: workerLikes } = await supabase
        .from('saved_items')
        .select('item_id, item_type')
        .eq('user_id', workerId);

      const hasWorkerLikedMe = workerLikes?.some((l: any) => 
        (l.item_type === 'company' && l.item_id === myCompanyId) || 
        (l.item_type === 'job' && myJobIds.includes(l.item_id))
      );

      if (hasWorkerLikedMe) {
        console.log("MUTUAL MATCH DETECTED! Contractor liked worker and worker had liked contractor's job/profile.");
        
        let matchedJobId = '';
        const specificJobLike = workerLikes?.find((l: any) => l.item_type === 'job' && myJobIds.includes(l.item_id));
        if (specificJobLike) {
          matchedJobId = specificJobLike.item_id;
        } else {
          matchedJobId = myJobIds[0] || '';
        }

        onMatchCreated(workerId, matchedJobId || null, myCompanyId);

        const currentJob = jobs.find(j => j.id === matchedJobId) || {
          id: matchedJobId || `contractor-${myCompanyId}`,
          companyId: myCompanyId,
          title: 'General Trade Opportunity',
          companyName: companies.find(c => c.id === myCompanyId)?.name || 'My Company',
          companyLogo: companies.find(c => c.id === myCompanyId)?.logo || '',
          payRate: 'Competitive CIS Rates',
          trade: companies.find(c => c.id === myCompanyId)?.industry || 'Multi-Trade',
          subcategory: '',
          location: companies.find(c => c.id === myCompanyId)?.location || '',
          startDate: 'Immediate',
          duration: 'Ongoing',
          employmentType: 'Contract',
          qualifications: [],
          verified: false,
          description: 'Direct contractor match',
          benefits: [],
          requirements: [],
          companyStats: { projects: 0, workers: 0, rating: 5 }
        } as JobProfile;

        const currentWorker = workers.find(w => w.id === workerId) || {
          id: workerId,
          name: 'Candidate',
          avatar: ''
        } as WorkerProfile;

        setCelebrationMatch({
          worker: currentWorker,
          job: currentJob
        });
      }
    }
  };

  const handleApplyJob = async (job: JobProfile) => {
    if (appliedJobIds.includes(job.id)) return;
    setAppliedJobIds(prev => [...prev, job.id]);

    const isOpportunity = (job as any).isContractorOpportunity;
    await registerLikeAndCheckMatch(
      isOpportunity ? job.companyId : job.id,
      isOpportunity ? 'company' : 'job'
    );
  };

  const handleShortlistWorker = async (worker: WorkerProfile) => {
    if (shortlistedWorkerIds.includes(worker.id)) return;
    setShortlistedWorkerIds(prev => [...prev, worker.id]);

    await registerLikeAndCheckMatch(worker.id, 'worker');
  };
  
  // State for match celebration modal
  const [celebrationMatch, setCelebrationMatch] = useState<{
    worker: WorkerProfile;
    job: JobProfile;
  } | null>(null);

  const activeDeckLength = userType === 'employer' ? workerDeck.length : jobDeck.length;
  const isDeckEmpty = currentIndex >= activeDeckLength;

  // Motion values for drag gestures
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacityLeft = useTransform(x, [-120, 0], [1, 0]);
  const opacityRight = useTransform(x, [0, 120], [0, 1]);

  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    setSwipeDirection(direction);
    
    // Perform swipe action operations
    const currentIdx = currentIndex;
    setTimeout(async () => {
      if (userType === 'employer') {
        const currentWorker = workerDeck[currentIdx];
        if (currentWorker) {
          if (direction === 'right') {
            await registerLikeAndCheckMatch(currentWorker.id, 'worker');
          } else if (direction === 'up') {
            if (currentUser) await saveItemInDb(currentUser.id, currentWorker.id, 'worker');
          }
        }
      } else {
        const currentOpportunity = jobDeck[currentIdx];
        if (currentOpportunity) {
          const isOpportunity = (currentOpportunity as any).isContractorOpportunity;
          if (direction === 'right') {
            await registerLikeAndCheckMatch(
              isOpportunity ? currentOpportunity.companyId : currentOpportunity.id,
              isOpportunity ? 'company' : 'job'
            );
          } else if (direction === 'up') {
            if (currentUser) {
              await saveItemInDb(
                currentUser.id,
                isOpportunity ? currentOpportunity.companyId : currentOpportunity.id,
                isOpportunity ? 'company' : 'job'
              );
            }
          }
        }
      }

      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
      x.set(0);
    }, 200);
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 100;
    if (info.offset.x < -swipeThreshold) {
      handleSwipe('left');
    } else if (info.offset.x > swipeThreshold) {
      handleSwipe('right');
    } else {
      x.set(0);
    }
  };

  const resetDeck = () => {
    setCurrentIndex(0);
  };


  const loggedInWorker = workers.find(worker => worker.id === currentUser?.id);
  const contractorJobs = jobs.filter(job => job.companyId === currentUser?.id);

  const getSwipeWorkerMatch = (worker: WorkerProfile) =>
    bestWorkerMatchAcrossJobs(worker, contractorJobs);

  const getSwipeJobMatch = (job: JobProfile) =>
    loggedInWorker
      ? scoreWorkerForJob(loggedInWorker, job)
      : { score: 1, reasons: ['Complete your profile to calculate a match'], strengths: [], gaps: [] };


  return (
    <div id="swipe_view" className="flex flex-col h-[calc(100vh-130px)] max-w-lg mx-auto relative justify-between pb-4">
      
      {/* View Mode Toggle Segmented Control */}
      <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 shadow-inner">
        <button
          onClick={() => {}}
          className="flex-1 py-1.5 text-xs font-mono font-black rounded-lg transition-all uppercase flex items-center justify-center gap-1.5 bg-[#34D399] text-white shadow-xs"
        >
          <Heart className="w-3.5 h-3.5 fill-current text-white" /> Card Swipe
        </button>
        <button
          onClick={() => onNavigate('search')}
          className="flex-1 py-1.5 text-xs font-mono font-black rounded-lg transition-all uppercase flex items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-950 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Search Filters & Map
        </button>
      </div>

      {/* Change View Switcher Toggle (For both workers and contractors) */}
      {onJobsViewModeChange && (
        <div className="flex bg-white p-1 rounded-xl border border-zinc-200 mt-2 shadow-xs items-center">
          <span className="text-[10px] font-mono font-extrabold text-zinc-400 uppercase tracking-widest pl-3 pr-2 select-none">
            Change View:
          </span>
          <div className="flex flex-1 gap-1">
            <button
              onClick={() => onJobsViewModeChange('card')}
              className={`flex-1 py-1.5 text-[11px] font-mono font-black rounded-lg transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                jobsViewMode === 'card'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Card View
            </button>
            <button
              onClick={() => onJobsViewModeChange('list')}
              className={`flex-1 py-1.5 text-[11px] font-mono font-black rounded-lg transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                jobsViewMode === 'list'
                  ? 'bg-[#34D399] text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List View
            </button>
          </div>
        </div>
      )}

      {/* Top Filter Bar Indicator */}
      <div className="flex justify-between items-center bg-white border border-zinc-200 rounded-xl px-4 py-2 text-zinc-800 shadow-sm mt-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
            {userType === 'employer' ? 'Candidates' : 'Contract Vacancies'}
          </span>
        </div>
        <button 
          onClick={() => onNavigate('search')}
          className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#10B981] hover:text-[#34D399] transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> FILTERS
        </button>
      </div>

      {/* Main Swipe or Scrolling stage */}
      <div className="relative flex-grow flex items-center justify-center mt-3 mb-3 w-full overflow-hidden">
        {jobsViewMode === 'list' ? (
          /* LIST VIEW / FEED VIEW (No Swiping) for BOTH Employers & Workers */
          <div className="w-full h-full overflow-y-auto px-1 py-1 space-y-4 scroll-smooth text-left" id="list-scrolling-viewport">
            {userType === 'employer' ? (
              /* Employer: scrolling feed of Workers */
              workers.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center space-y-4 py-12 flex flex-col items-center justify-center">
                  <div className="p-4 bg-zinc-50 rounded-full text-[#10B981] border border-emerald-100">
                    <Wrench className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-zinc-900 font-sans">No Candidates Available</h3>
                    <p className="text-xs text-zinc-500 font-sans max-w-xs">No active candidates match your criteria at this moment. Adjust filters or try again later.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {workers.map((worker) => {
                    const isApplied = shortlistedWorkerIds.includes(worker.id);
                    const aiMatch = getSwipeWorkerMatch(worker);
                    return (
                      <div 
                        key={worker.id} 
                        className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs hover:border-[#34D399] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-mono font-black uppercase">
                              <Sparkles className="w-3 h-3" />
                              {aiMatch.score}% match
                            </span>
                            <h4 
                              onClick={() => onSelectWorker(worker)}
                              className="text-base font-bold text-zinc-900 hover:text-[#10B981] transition-colors cursor-pointer truncate"
                            >
                              {worker.name}
                            </h4>
                            {worker.verified && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[8px] font-mono font-extrabold uppercase tracking-wider">
                                ✓ Verified
                              </span>
                            )}
                            <span className="px-2 py-0.2 bg-zinc-100 text-zinc-600 rounded text-[8px] font-mono font-bold uppercase tracking-wider">
                              {worker.trade}
                            </span>
                            <span className="px-2 py-0.2 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-0.5">
                              ⭐ {worker.rating} ({worker.reviewsCount})
                            </span>
                          </div>

                          {/* Location, Experience, Pay Rate */}
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wide">
                            <span className="text-zinc-800">{worker.experience} Experience</span>
                            <span className="text-zinc-300">•</span>
                            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-zinc-400" /> {worker.location}</span>
                            <span className="text-zinc-300">•</span>
                            <span className="text-[#10B981] font-black">{worker.payRate}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700">
                            <Sparkles className="w-3 h-3" />
                            <span>{aiMatch.reasons[0] || aiMatch.label}</span>
                          </div>

                          {/* Short Bio */}
                          <p className="text-xs text-zinc-500 font-sans leading-relaxed line-clamp-2">
                            {worker.about}
                          </p>
                        </div>

                        {/* Compact Action buttons */}
                        <div className="flex sm:flex-col gap-2 flex-shrink-0 min-w-[120px]">
                          <button 
                            onClick={() => onSelectWorker(worker)}
                            className="flex-1 sm:w-full py-2 px-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-mono text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-400" /> PROFILE
                          </button>
                          <button 
                            onClick={() => handleShortlistWorker(worker)}
                            disabled={isApplied}
                            className={`flex-1 sm:w-full py-2 px-3 font-mono text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isApplied 
                                ? 'bg-emerald-50 border border-emerald-200 text-[#10B981] cursor-default' 
                                : 'bg-[#34D399] hover:bg-[#10B981] text-white shadow-xs'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" /> MATCHED
                              </>
                            ) : (
                              <>
                                <Heart className="w-3.5 h-3.5 fill-current text-white" /> SHORTLIST
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Worker: scrolling feed of Jobs */
              jobDeck.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center space-y-4 py-12 flex flex-col items-center justify-center">
                  <div className="p-4 bg-zinc-50 rounded-full text-zinc-400 border border-zinc-100">
                    <Briefcase className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-zinc-900 font-sans">No jobs or contractor opportunities available yet.</h3>
                    <p className="text-xs text-zinc-500 font-sans max-w-xs font-sans">Please check back soon—new commercial contract jobs and contractor company profiles are added daily.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {jobDeck.map((job) => {
                    const isUrgent = job.title.toLowerCase().includes('urgent') || job.description.toLowerCase().includes('urgent');
                    const isApplied = appliedJobIds.includes(job.id);
                    const aiMatch = getSwipeJobMatch(job);
                    return (
                      <div 
                        key={job.id} 
                        className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs hover:border-[#34D399] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-mono font-black uppercase">
                              <Sparkles className="w-3 h-3" />
                              {aiMatch.score}% match
                            </span>
                            <h4 
                              onClick={() => onSelectJob(job)}
                              className="text-base font-bold text-zinc-900 hover:text-[#10B981] transition-colors cursor-pointer truncate"
                            >
                              {job.title}
                            </h4>
                            {isUrgent && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[8px] font-mono font-extrabold uppercase tracking-wider animate-pulse">
                                Urgent
                              </span>
                            )}
                            <span className="px-2 py-0.2 bg-zinc-100 text-zinc-600 rounded text-[8px] font-mono font-bold uppercase tracking-wider">
                              {job.employmentType}
                            </span>
                          </div>

                          {/* Company, location, start, pay rate */}
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wide">
                            <span className="text-zinc-800 flex items-center gap-1.5 flex-wrap">
                              <span>{job.companyName}</span>
                              <span className="text-amber-500 font-extrabold">{getCompanyRatingString(job.companyId)}</span>
                            </span>
                            <span className="text-zinc-300">•</span>
                            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-zinc-400" /> {job.location}</span>
                            <span className="text-zinc-300">•</span>
                            <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3 text-zinc-400" /> Start: {job.startDate}</span>
                            <span className="text-zinc-300">•</span>
                            <span className="text-[#10B981] font-black">{job.payRate}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700">
                            <Sparkles className="w-3 h-3" />
                            <span>{aiMatch.reasons[0] || aiMatch.label}</span>
                          </div>

                          {/* Short Description */}
                          <p className="text-xs text-zinc-500 font-sans leading-relaxed line-clamp-2">
                            {job.description}
                          </p>
                        </div>

                        {/* Compact Action buttons */}
                        <div className="flex sm:flex-col gap-2 flex-shrink-0 min-w-[120px]">
                          <button 
                            onClick={() => onSelectJob(job)}
                            className="flex-1 sm:w-full py-2 px-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-mono text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-400" /> DETAILS
                          </button>
                          <button 
                            onClick={() => handleApplyJob(job)}
                            disabled={isApplied}
                            className={`flex-1 sm:w-full py-2 px-3 font-mono text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isApplied 
                                ? 'bg-emerald-50 border border-emerald-200 text-[#10B981] cursor-default' 
                                : 'bg-[#34D399] hover:bg-[#10B981] text-white shadow-xs'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" /> MATCHED
                              </>
                            ) : (
                              <>
                                <Heart className="w-3.5 h-3.5 fill-current text-white" /> APPLY
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        ) : (
          /* CARD VIEW - Tinder-style Swipe Experience (One card at a time with left/right swipes) for BOTH Employers & Workers */
          <AnimatePresence>
            {isDeckEmpty ? (
              /* End of Deck State */
              <motion.div 
                key="empty-deck"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-zinc-200 rounded-2xl p-6 text-center space-y-4 max-w-md w-full shadow-sm flex flex-col items-center justify-center py-12"
              >
                <div className="p-4 bg-emerald-50 rounded-full text-[#10B981] border border-emerald-100">
                  <Wrench className="w-12 h-12 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-sans text-zinc-900">End of Deck Reached</h3>
                  <p className="text-xs text-zinc-500 font-sans max-w-xs">
                    {userType === 'employer' 
                      ? "You've reviewed all local tradesmen matching your criteria. Try widening your filters or location search."
                      : "You've swiped on all currently active commercial jobs. Check back soon—new construction sites are added hourly."}
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={resetDeck}
                    className="px-4 py-2 text-xs font-mono font-bold bg-zinc-900 hover:bg-[#34D399] hover:text-white text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> RE-EVALUATE DECK
                  </button>
                  <button 
                    onClick={() => onNavigate('search')}
                    className="px-4 py-2 text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg border border-zinc-200 transition-all"
                  >
                    BROADEN RADIUS
                  </button>
                </div>
              </motion.div>
            ) : userType === 'employer' ? (
              /* Swiping Worker Cards Stack for Employers */
              workerDeck.map((worker, index) => {
                if (index !== currentIndex) return null;
                return (
                  <motion.div
                    key={worker.id}
                    style={{ x, rotate }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    className="absolute bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-lg h-full w-full flex flex-col justify-between cursor-grab active:cursor-grabbing max-h-[580px]"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-zinc-950/90 text-white rounded-full text-[10px] font-mono font-black uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
                      {getSwipeWorkerMatch(worker).score}% match
                    </div>
                    <motion.div style={{ opacity: opacityRight }} className="absolute top-8 left-8 border-4 border-emerald-500 text-emerald-500 font-mono font-black text-2xl px-4 py-1.5 rounded-lg transform -rotate-12 z-30 pointer-events-none uppercase">
                      SHORTLIST
                    </motion.div>
                    <motion.div style={{ opacity: opacityLeft }} className="absolute top-8 right-8 border-4 border-zinc-500 text-zinc-500 font-mono font-black text-2xl px-4 py-1.5 rounded-lg transform rotate-12 z-30 pointer-events-none uppercase">
                      SKIP
                    </motion.div>

                    <div className="flex flex-col h-full overflow-hidden text-left">
                      <div className="relative h-52 bg-zinc-50 border-b border-zinc-200 flex-shrink-0 flex items-center justify-center px-5 pt-10 pb-5">
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 bg-[#34D399] text-zinc-950 rounded text-[9px] font-mono font-black flex items-center gap-1 uppercase">
                            {worker.experience} EXP
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded text-[9px] font-mono font-black flex items-center gap-1 uppercase">
                            ⚡ {worker.availability}
                          </span>
                        </div>

                        {worker.verified && (
                          <div className="absolute top-12 right-3 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] font-mono font-black text-emerald-800 flex items-center gap-1 uppercase">
                            ✓ Verified
                          </div>
                        )}

                        <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl overflow-hidden border-4 border-white bg-white shadow-md flex items-center justify-center">
                          <img 
                            src={worker.profilePhotoUrl || worker.avatar} 
                            alt={worker.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      <div className="p-5 flex-grow overflow-y-auto space-y-4 font-sans select-none">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-1.5">
                                {worker.name}
                              </h2>
                              <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wide">{worker.trade}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-500 px-2.5 py-1 bg-amber-50/50 border border-amber-100 rounded-lg flex items-center gap-1">
                              ⭐ {worker.rating} ({worker.reviewsCount})
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-zinc-500 text-xs mt-1.5">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-400" /> {worker.location}</span>
                          </div>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 flex justify-between items-center">
                          <span className="text-xs font-mono font-bold text-zinc-500 uppercase">PAY EXPECTATIONS</span>
                          <span className="text-sm font-mono font-black text-[#10B981]">{worker.payRate}</span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">ABOUT ME</h4>
                          <p className="text-xs text-zinc-600 leading-relaxed font-sans line-clamp-3">{worker.about}</p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">VERIFIED CERTIFICATIONS</h4>
                          <div className="flex flex-wrap gap-1">
                            {worker.qualifications.map((q, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-[#10B981] rounded text-[9px] font-mono font-bold uppercase">
                                {q}
                              </span>
                            ))}
                          </div>
                        </div>

                        {((worker.licences && worker.licences.length > 0) || (worker.verifiedBadges && worker.verifiedBadges.length > 0)) && (
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">ACTIVE LICENCES & CERTIFICATIONS</h4>
                            <div className="flex flex-wrap gap-1">
                              {worker.licences?.map((lic, idx) => (
                                <span key={`lic-${idx}`} className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded text-[9px] font-mono font-bold uppercase flex items-center gap-1">
                                  🛡️ {lic}
                                </span>
                              ))}
                              {worker.verifiedBadges?.map((badge, idx) => (
                                <span key={`badge-${idx}`} className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded text-[9px] font-mono font-bold uppercase flex items-center gap-1">
                                  ⭐ {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">TOOLS & TRANSPORT</h4>
                          <div className="flex flex-wrap gap-1">
                            {worker.toolsAndTransport.map((t, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded text-[9px] font-mono font-bold uppercase">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex-shrink-0 flex justify-between items-center">
                      <span className="text-[11px] font-mono font-bold text-zinc-400">TAP PROFILE FOR DETAILED CV</span>
                      <button 
                        onClick={() => onSelectWorker(worker)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-[#34D399] hover:text-white text-white font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> VIEW PROFILE
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              /* Swiping Job Cards Stack for Workers */
              jobDeck.map((job, index) => {
                if (index !== currentIndex) return null;
                const isUrgent = job.title.toLowerCase().includes('urgent') || job.description.toLowerCase().includes('urgent');
                const aiMatch = getSwipeJobMatch(job);
                return (
                  <motion.div
                    key={job.id}
                    style={{ x, rotate }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    className="absolute bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-lg h-full w-full flex flex-col justify-between cursor-grab active:cursor-grabbing max-h-[580px]"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div style={{ opacity: opacityRight }} className="absolute top-8 left-8 border-4 border-emerald-500 text-emerald-500 font-mono font-black text-2xl px-4 py-1.5 rounded-lg transform -rotate-12 z-30 pointer-events-none uppercase">
                      APPLY / LIKE
                    </motion.div>
                    <motion.div style={{ opacity: opacityLeft }} className="absolute top-8 right-8 border-4 border-zinc-500 text-zinc-500 font-mono font-black text-2xl px-4 py-1.5 rounded-lg transform rotate-12 z-30 pointer-events-none uppercase">
                      SKIP
                    </motion.div>

                    <div className="flex flex-col h-full overflow-hidden text-left">
                      <div className="relative h-52 bg-zinc-50 border-b border-zinc-200 flex-shrink-0 flex items-center justify-center px-5 pt-10 pb-5">
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-[9px] font-mono font-black text-zinc-950 uppercase tracking-wider">
                            {job.employmentType}
                          </span>
                          {isUrgent && (
                            <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded text-[9px] font-mono font-black flex items-center gap-0.5 uppercase tracking-wider">
                              🚨 Urgent
                            </span>
                          )}
                        </div>

                        {job.verified && (
                          <div className="absolute top-12 right-3 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] font-mono font-black text-emerald-800 flex items-center gap-1 uppercase">
                            ✓ Verified
                          </div>
                        )}

                        <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl overflow-hidden border-4 border-white bg-white shadow-md flex items-center justify-center p-4">
                          <img 
                            src={job.companyLogo} 
                            alt={job.companyName} 
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="absolute bottom-3 right-3 z-20 px-3 py-2 bg-emerald-50 border border-emerald-200 text-zinc-950 rounded-xl shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#10B981]" />
                            <span className="text-sm font-black">{aiMatch.score}% MATCH</span>
                          </div>
                          <p className="text-[8px] font-mono text-zinc-700 uppercase mt-0.5 max-w-40 truncate">
                            {aiMatch.reasons[0] || 'HireUp recommended'}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 flex-grow overflow-y-auto space-y-4 font-sans select-none">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h2 className="text-xl font-bold text-zinc-900 leading-tight">
                                {job.title}
                              </h2>
                              <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                                <span>{job.companyName}</span>
                                <span className="text-amber-500 font-extrabold">{getCompanyRatingString(job.companyId)}</span>
                              </p>
                            </div>
                            <span className="text-xs font-mono font-black text-[#10B981] px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg whitespace-nowrap">
                              {job.payRate}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-zinc-500 text-xs mt-1.5">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-400" /> {job.location}</span>
                            <span className="text-zinc-300">|</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-zinc-400" /> Start: {job.startDate}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                            <h4 className="text-[10px] font-mono font-black text-emerald-700 uppercase">
                              Why HireUp recommends this
                            </h4>
                          </div>
                          <p className="text-xs text-emerald-800 mt-1">
                            {aiMatch.reasons[0] || 'This opportunity matches your active worker profile.'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">JOB DESCRIPTION</h4>
                          <p className="text-xs text-zinc-600 leading-relaxed font-sans line-clamp-4">{job.description}</p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">REQUIRED CERTIFICATIONS</h4>
                          <div className="flex flex-wrap gap-1">
                            {job.qualifications.map((q, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded text-[9px] font-mono font-bold uppercase">
                                {q}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex-shrink-0 flex justify-between items-center">
                      <span className="text-[11px] font-mono font-bold text-zinc-400">
                        {(job as any).isContractorOpportunity ? "TAP TO VIEW CONTRACTOR PROFILE" : "TAP TO INQUIRE DETAILS"}
                      </span>
                      <button 
                        onClick={() => onSelectJob(job)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-[#34D399] hover:text-white text-white font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> {(job as any).isContractorOpportunity ? "VIEW PROFILE" : "VIEW JOB"}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Swipe Action Controls (Available in Card/Swipe View only when deck is not empty) */}
      {jobsViewMode === 'card' && !isDeckEmpty && (
        <div className="flex justify-center items-center gap-6 mt-1 flex-shrink-0 pb-2">
          {/* Skip Button */}
          <button 
            onClick={() => handleSwipe('left')}
            className="w-14 h-14 bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-400 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
            title="Skip / Pass"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Save / Favorite / Detail Button */}
          <button 
            onClick={() => {
              if (userType === 'employer') {
                handleSwipe('up');
              } else {
                onSelectJob(jobDeck[currentIndex]);
              }
            }}
            className="w-12 h-12 bg-zinc-900 text-zinc-400 hover:text-amber-400 border border-zinc-800 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
            title={userType === 'employer' ? "Shortlist / Favourite" : "View Contract Details"}
          >
            {userType === 'employer' ? (
              <Star className="w-5 h-5 fill-current" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>

          {/* Like / Apply / Match Button */}
          <button 
            onClick={() => handleSwipe('right')}
            className="w-14 h-14 bg-[#34D399] hover:bg-[#10B981] text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-[#34D399]/25 active:scale-95 cursor-pointer"
            title={userType === 'employer' ? "Match Candidate" : "Apply to Opportunity"}
          >
            <Heart className="w-6 h-6 stroke-[2.5] fill-current text-white" />
          </button>
        </div>
      )}

      {/* Match Celebration Modal */}
      <AnimatePresence>
        {celebrationMatch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-emerald-500/30 rounded-3xl p-6 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Particle sparks */}
              <div className="absolute top-0 inset-x-0 h-40 bg-radial-gradient from-emerald-500/20 to-transparent pointer-events-none" />

              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-[#34D399] rounded-full animate-bounce">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black font-mono tracking-tight text-white uppercase">
                  IT'S A MATCH!
                </h3>
                <p className="text-xs text-zinc-400 font-sans max-w-xs mx-auto">
                  Dave Knyte and {celebrationMatch.job.companyName} have liked each other. The site manager has been alerted.
                </p>
              </div>

              {/* Avatar vs Company Logo celebrate */}
              <div className="flex items-center justify-center gap-4 relative z-10">
                <div className="w-16 h-16 border-2 border-emerald-500 rounded-full overflow-hidden bg-white p-1 shadow-md">
                  <img 
                    src={celebrationMatch.worker.avatar} 
                    alt={celebrationMatch.worker.name} 
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-xl text-emerald-500 font-mono font-black animate-pulse">
                  ⚡
                </div>
                <div className="w-16 h-16 border-2 border-emerald-500 rounded-full overflow-hidden bg-white p-1.5 shadow-md flex items-center justify-center">
                  <img 
                    src={celebrationMatch.job.companyLogo} 
                    alt={celebrationMatch.job.companyName} 
                    className="max-w-full max-h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 relative z-10">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-left">
                  <p className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">CONTRACT PROFILE</p>
                  <h4 className="text-sm font-bold text-white font-sans mt-0.5">{celebrationMatch.job.title}</h4>
                  <p className="text-xs text-[#34D399] font-mono font-black mt-0.5">{celebrationMatch.job.payRate}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 relative z-10">
                <button 
                  onClick={() => {
                    setCelebrationMatch(null);
                    onNavigate('chats');
                  }}
                  className="w-full py-3 bg-[#34D399] hover:bg-[#10B981] text-zinc-950 font-mono font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <MessageSquare className="w-4 h-4 fill-current" /> INTRODUCE VIA LIVE CHAT
                </button>
                <button 
                  onClick={() => {
                    setCelebrationMatch(null);
                    onNavigate('interviews');
                  }}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" /> SCHEDULE SITE INTERVIEW
                </button>
                <button 
                  onClick={() => setCelebrationMatch(null)}
                  className="w-full py-2 text-zinc-500 hover:text-zinc-300 font-mono text-xs font-medium transition-all cursor-pointer"
                >
                  KEEP SWIPING
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}