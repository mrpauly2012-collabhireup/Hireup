/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Briefcase, MapPin, Calendar, Award, MessageSquare, 
  ChevronRight, Activity, Clock, ShieldCheck, Eye, 
  CheckCircle2, Sparkles, User, Users, Heart
} from 'lucide-react';
import { WorkerProfile, JobProfile, CompanyProfile, Match, Message, Interview, UserType } from '../types';

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
  onUpdateCompany
}: DashboardViewProps) {
  // Local notification for availability status update
  const [showNotification, setShowNotification] = useState<string | null>(null);

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

  // Filters and helpers for Worker Dashboard
  const workerRecommendedJobs = jobs.filter(j => 
    j.trade.toLowerCase() === loggedInWorker.trade.toLowerCase() ||
    loggedInWorker.qualifications.some(q => j.qualifications.includes(q))
  ).slice(0, 3);

  // If no exact match trades, show top verified jobs
  const resolvedRecJobs = workerRecommendedJobs.length > 0 
    ? workerRecommendedJobs 
    : jobs.filter(j => j.verified).slice(0, 3);

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
  const recommendedWorkers = workers.filter(w => 
    activeVacancies.some(v => v.trade.toLowerCase() === w.trade.toLowerCase()) ||
    w.rating >= 4.8
  ).slice(0, 3);

  // Resolved contractor messages
  const contractorMatches = matches.filter(m => 
    activeVacancies.some(v => v.id === m.jobId)
  );

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


  const handleUpdateAvailability = (val: string) => {
    const updated = { ...loggedInWorker, availability: val };
    onUpdateWorker(updated);
    setShowNotification(`Availability status changed to "${val}"`);
    setTimeout(() => setShowNotification(null), 3500);
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
            <button 
              onClick={() => onNavigate(userType === 'employer' ? 'profile' : 'profile')}
              className="px-5 py-2.5 text-xs bg-white hover:bg-zinc-50 text-zinc-950 border border-zinc-200 font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-4 h-4 text-[#10B981]" />
              Manage Profile
            </button>
          </div>
        </div>
      </div>

      {/* ================= WORKER DASHBOARD ================= */}
      {userType === 'worker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left / Main Column */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 2. Recommended Jobs */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                <div>
                  <h2 className="text-lg font-black text-zinc-950 tracking-tight uppercase">Recommended Jobs</h2>
                  <p className="text-xs text-zinc-500">Based on your trades, verified certifications, and local radius</p>
                </div>
                <button 
                  onClick={() => onNavigate('swipe')}
                  className="text-xs font-mono font-black text-[#10B981] hover:text-[#34D399] tracking-wider uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                {resolvedRecJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-white border border-zinc-200 p-5 rounded-xl hover:border-[#34D399] hover:shadow-sm transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-zinc-50 p-1 border border-zinc-200 flex-shrink-0 flex items-center justify-center">
                        <img 
                          src={job.companyLogo} 
                          alt={job.companyName} 
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-zinc-950 text-sm">{job.title}</h3>
                          {job.verified && <ShieldCheck className="w-4 h-4 text-[#10B981]" />}
                        </div>
                        <p className="text-xs text-zinc-500 font-medium">{job.companyName}</p>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-zinc-600">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-zinc-400" /> {job.location}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-400" /> {job.duration}</span>
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-[10px] text-[#10B981] font-mono font-bold rounded uppercase">{job.employmentType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 gap-2">
                      <span className="text-sm font-mono font-black text-[#10B981] bg-[#E6FBF3] px-2.5 py-1 rounded">{job.payRate}</span>
                      <button 
                        onClick={() => onSelectJob(job)}
                        className="px-3 py-1.5 text-[10px] bg-zinc-100 hover:bg-[#34D399] text-zinc-700 hover:text-zinc-950 font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Quick View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                  onClick={() => onNavigate('profile')} // Profile page contains "Post Vacancy" or listings
                  className="text-xs font-mono font-black text-[#10B981] hover:text-[#34D399] tracking-wider uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  Manage Jobs <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeVacancies.length === 0 ? (
                <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-8 text-center text-zinc-500 text-xs">
                  No active vacancies. Click Manage Jobs or update your profile to list an opening.
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
                    <div className="flex items-start gap-4">
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

    </div>
  );
}
