/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, Briefcase, Heart, MessageSquare, Calendar, Star, 
  Bell, Users, TrendingUp, Settings, User, HardHat, Wrench, 
  ShieldCheck, MapPin, Award, Clock, ArrowRight, X, ChevronRight, LogOut,
  Video, UserCheck, FileText, CheckCircle2, ExternalLink, Image as ImageIcon, ClipboardCheck
} from 'lucide-react';
import { 
  WorkerProfile, JobProfile, CompanyProfile, Match, Message, Interview, UserType 
} from './types';
import { 
  supabase, 
  fetchWorkers, 
  fetchCompanies, 
  fetchJobs, 
  fetchMatches, 
  fetchInterviews, 
  fetchMessages,
  fetchMessagesForMatches,
  createNotificationInDb,
  createMatchInDb, 
  sendMessageInDb, 
  createInterviewInDb, 
  updateInterviewStatusInDb, 
  updateWorkerProfileInDb, 
  updateCompanyProfileInDb, 
  createJobInDb,
  signOutUser,
  fetchReviewsFromDb,
  createReviewInDb,
  reportReviewInDb,
  moderateReviewInDb,
  isValidUploadUrl
} from './lib/supabase';

import DashboardView from './components/DashboardView';
import SwipeView from './components/SwipeView';
import SearchView from './components/SearchView';
import MatchesView from './components/MatchesView';
import MessagingView from './components/MessagingView';
import InterviewsView from './components/InterviewsView';
import CompaniesView from './components/CompaniesView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import ProfileView from './components/ProfileView';
import AuthView from './components/AuthView';
import VideoInterviewRoom from './components/VideoInterviewRoom';

export default function App() {
  // Core User Session State
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; userType: UserType } | null>(null);

  // Core Persona State
  const [userType, setUserType] = useState<UserType>('worker');

  // Current view route
  const [currentView, setCurrentView] = useState('dashboard');

  // Job search layout view mode (Card vs List View)
  const [jobsViewMode, setJobsViewMode] = useState<'card' | 'list'>('card');

  // Dynamic Call & Interview Slots State
  interface ActiveCallState {
    matchId: string;
    partnerName: string;
    partnerAvatar: string;
    partnerTrade: string;
    isIncoming?: boolean;
  }
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);



  // Data Collections
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Database Loading & Sync States
  const [dbLoading, setDbLoading] = useState(false);
  const [dbSyncError, setDbSyncError] = useState<string | null>(null);

  // Selection states for detail overlays
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobProfile | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [appLightboxImage, setAppLightboxImage] = useState<string | null>(null);

  // Load all tables from Supabase
  const loadAllDataFromSupabase = async () => {
    setDbLoading(true);
    setDbSyncError(null);
    try {
      // Query live Supabase tables in parallel
      const [dbWorkers, dbCompanies, dbJobs, dbMatches, dbInterviews, dbReviews] = await Promise.all([
        fetchWorkers(),
        fetchCompanies(),
        fetchJobs(),
        fetchMatches(),
        fetchInterviews(),
        fetchReviewsFromDb(),
      ]);

      setWorkers(dbWorkers || []);
      setCompanies(dbCompanies || []);
      setJobs(dbJobs || []);
      setMatches(dbMatches || []);
      setInterviews(dbInterviews || []);
      setReviews(dbReviews || []);

      if (dbMatches && dbMatches.length > 0) {
        const matchIds = dbMatches.map(m => m.id);
        const dbMessages = await fetchMessagesForMatches(matchIds);
        setMessages(dbMessages || []);
      }

    } catch (err: any) {
      console.warn("Could not sync with live Supabase database tables:", err.message);
      setDbSyncError(err.message || String(err));
    } finally {
      setDbLoading(false);
    }
  };

  // Auth Listener to persist session
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        // Look up profile to determine user role
        supabase.from('worker_profiles').select('id').eq('id', session.user.id).maybeSingle().then(({ data: isWorker }) => {
          const type: UserType = isWorker ? 'worker' : 'employer';
          setCurrentUser({
            id: session.user.id,
            email: session.user.email!,
            userType: type
          });
          setUserType(type);
        });
      } else {
        setCurrentUser(null);
      }
    });

    // Monitor auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        const { data: isWorker } = await supabase.from('worker_profiles').select('id').eq('id', session.user.id).maybeSingle();
        const type: UserType = isWorker ? 'worker' : 'employer';
        setCurrentUser({
          id: session.user.id,
          email: session.user.email!,
          userType: type
        });
        setUserType(type);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Supabase data whenever currentUser logs in
  useEffect(() => {
    if (currentUser) {
      loadAllDataFromSupabase();
    }
  }, [currentUser]);

  // Load chats dynamically when selectedMatchId changes
  useEffect(() => {
    if (selectedMatchId) {
      fetchMessages(selectedMatchId).then(msgs => {
        if (msgs && msgs.length > 0) {
          setMessages(prev => {
            const filtered = prev.filter(m => m.matchId !== selectedMatchId);
            return [...filtered, ...msgs];
          });
        }
      });
    }
  }, [selectedMatchId]);

  // Setup Supabase Realtime Subscriptions for live messaging and notifications
  useEffect(() => {
    if (!currentUser) return;

    console.log("Setting up Supabase Realtime channel for user:", currentUser.id);

    // 1. Subscribe to new messages
    const messageChannel = supabase
      .channel('live-messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = payload.new as any;
          console.log("Realtime message received:", newMsg);

          // Map payload to local Message type
          const mappedMsg: Message = {
            id: newMsg.id,
            matchId: newMsg.match_id,
            sender: newMsg.sender,
            text: newMsg.message || newMsg.text,
            timestamp: newMsg.created_at || newMsg.timestamp,
            isRead: newMsg.read !== undefined ? newMsg.read : newMsg.is_read,
            attachmentType: newMsg.attachment_type,
            attachmentName: newMsg.attachment_name,
          };

          // Append to state if it doesn't already exist
          setMessages(prev => {
            if (prev.some(m => m.id === mappedMsg.id)) return prev;
            return [...prev, mappedMsg];
          });

          // Update latest message info on the match list
          setMatches(prev => prev.map(m => {
            if (m.id === mappedMsg.matchId) {
              return {
                ...m,
                lastMessageText: mappedMsg.text,
                lastMessageTime: new Date(mappedMsg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              };
            }
            return m;
          }));
        }
      )
      .subscribe();

    // 2. Subscribe to matches
    const matchChannel = supabase
      .channel('live-matches-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          const newMatch = payload.new as any;
          console.log("Realtime match received:", newMatch);

          const mappedMatch: Match = {
            id: newMatch.id,
            workerId: newMatch.worker_id,
            jobId: newMatch.job_id,
            matchedAt: newMatch.matched_at,
            lastMessageText: newMatch.last_message_text,
            lastMessageTime: newMatch.last_message_time,
          };

          setMatches(prev => {
            if (prev.some(m => m.id === mappedMatch.id)) return prev;
            return [mappedMatch, ...prev];
          });
        }
      )
      .subscribe();

    // 3. Subscribe to interviews
    const interviewChannel = supabase
      .channel('live-interviews-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interviews',
        },
        async (payload) => {
          const newInt = payload.new as any;
          console.log("Realtime interview received:", newInt);

          const mappedInt: Interview = {
            id: newInt.id,
            workerId: newInt.worker_id,
            jobId: newInt.job_id,
            date: newInt.date,
            time: newInt.time,
            location: newInt.location,
            status: newInt.status,
            ppeRequired: newInt.ppe_required || ['Hard Hat', 'Steel Toe Boots', 'Hi-Vis Vest'],
            notes: newInt.notes || '',
          };

          setInterviews(prev => {
            if (prev.some(i => i.id === mappedInt.id)) return prev;
            return [mappedInt, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up Supabase Realtime channels");
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(interviewChannel);
    };
  }, [currentUser, userType]);

  // Action: Swipe connection liked and match generated
  const handleMatchCreated = async (workerId: string, jobId: string) => {
    try {
      const match = await createMatchInDb(workerId, jobId);
      setMatches(prev => [match, ...prev]);

      // Fetch fresh messages
      const msgs = await fetchMessages(match.id);
      setMessages(prev => [...prev, ...msgs]);

      // Auto-select match so users can discussion immediately
      setSelectedMatchId(match.id);

      // Create live notification record in the notifications table
      const job = jobs.find(j => j.id === jobId);
      const contractorId = job ? job.companyId : null;
      const recipientId = userType === 'worker' ? contractorId : workerId;
      const senderName = userType === 'worker' 
        ? (workers.find(w => w.id === currentUser?.id)?.name || 'Tradesman') 
        : (companies.find(c => c.id === currentUser?.id)?.name || 'Contractor');

      if (recipientId) {
        await createNotificationInDb(
          recipientId, 
          `New Swipe Match with ${senderName}`, 
          `Discussion unlocked! Tap here to contact and arrange site walkthroughs.`
        );
      }
    } catch (err: any) {
      console.error("Match insertion error:", err.message);
      alert(`Could not create the match: ${err.message || err}`);
    }
  };

  // Action: Send chat message
  const handleSendMessage = async (matchId: string, text: string, attachmentType?: 'image' | 'document' | 'voice', attachmentName?: string) => {
    // Generate instant local state update for super snappy UX
    const instantMsg: Message = {
      id: `msg_temp_${Date.now()}`,
      matchId,
      sender: userType,
      text,
      timestamp: new Date().toISOString(),
      isRead: false,
      attachmentType,
      attachmentName
    };
    setMessages(prev => [...prev, instantMsg]);

    try {
      const dbMsg = await sendMessageInDb(matchId, userType, text, attachmentType, attachmentName);
      
      // Update with database message
      setMessages(prev => prev.map(m => m.id === instantMsg.id ? dbMsg : m));

      // Create live notification record in the notifications table
      const match = matches.find(m => m.id === matchId);
      if (match) {
        const job = jobs.find(j => j.id === match.jobId);
        const contractorId = job ? job.companyId : null;
        const recipientId = userType === 'worker' ? contractorId : match.workerId;
        const senderName = userType === 'worker' 
          ? (workers.find(w => w.id === currentUser?.id)?.name || 'Tradesman') 
          : (companies.find(c => c.id === currentUser?.id)?.name || 'Contractor');

        if (recipientId) {
          await createNotificationInDb(
            recipientId, 
            `New Message from ${senderName}`, 
            text
          );
        }
      }
      
      // Refresh matches list to show latest message preview
      const dbMatches = await fetchMatches();
      if (dbMatches && dbMatches.length > 0) setMatches(dbMatches);

    } catch (err: any) {
      console.error("Message send error:", err.message);
    }
  };

  // Action: Accept proposed interview walkthrough
  const handleConfirmInterview = async (id: string) => {
    setInterviews(prev => prev.map(int => int.id === id ? { ...int, status: 'confirmed' } : int));
    try {
      await updateInterviewStatusInDb(id, 'confirmed');
    } catch (err: any) {
      console.error("Could not update interview:", err.message);
    }
  };

  // Action: Decline proposed interview
  const handleDeclineInterview = async (id: string) => {
    setInterviews(prev => prev.map(int => int.id === id ? { ...int, status: 'declined' } : int));
    try {
      await updateInterviewStatusInDb(id, 'declined');
    } catch (err: any) {
      console.error("Could not update interview:", err.message);
    }
  };

  // Action: Complete interview walkthrough
  const handleCompleteInterview = async (id: string) => {
    setInterviews(prev => prev.map(int => int.id === id ? { ...int, status: 'completed' } : int));
    try {
      await updateInterviewStatusInDb(id, 'completed');
      await createNotificationInDb(
        currentUser?.id || '',
        'Walkthrough Completed ✔',
        'Your induction walkthrough has been marked as completed. You can now leave a feedback rating & review.'
      );
    } catch (err: any) {
      console.error("Could not complete interview:", err.message);
    }
  };

  // Action: Submit user review
  const handleSubmitReview = async (
    reviewedUserId: string,
    jobId: string,
    rating: number,
    reviewText: string,
    categories: Record<string, number>
  ) => {
    if (!currentUser) throw new Error("Please log in to submit a review.");

    // Prevent self reviews
    if (currentUser.id === reviewedUserId) {
      throw new Error("Prevent self reviews: You cannot submit a review for yourself.");
    }

    // Validate interaction and eligibility conditions
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      throw new Error("The specified job does not exist on HireUp.");
    }

    const isReviewerWorker = currentUser.userType === 'worker';
    const workerId = isReviewerWorker ? currentUser.id : reviewedUserId;
    const contractorId = isReviewerWorker ? reviewedUserId : currentUser.id;

    if (job.companyId !== contractorId) {
      throw new Error("Invalid review: The reviewed contractor is not associated with this job.");
    }

    // Check if match exists
    const matchExists = matches.some(m => m.jobId === jobId && m.workerId === workerId);
    if (!matchExists) {
      throw new Error("Reviews are only allowed if a match exists between both parties on HireUp.");
    }

    // Check if interview exists with completed status (Job completed)
    const interviewExists = interviews.some(i => i.jobId === jobId && i.workerId === workerId && i.status === 'completed');
    if (!interviewExists) {
      throw new Error("Reviews are only allowed if a scheduled walkthrough has been completed on HireUp.");
    }

    // Retrieve reviewer profile details for custom labels
    let reviewerName = currentUser.email;
    let reviewerRole = currentUser.userType === 'worker' ? 'Tradesperson' : 'Contractor';

    if (currentUser.userType === 'worker') {
      const activeW = workers.find(w => w.id === currentUser.id);
      if (activeW) {
        reviewerName = activeW.name;
        reviewerRole = activeW.trade;
      }
    } else {
      const activeC = companies.find(c => c.id === currentUser.id);
      if (activeC) {
        reviewerName = activeC.name;
        reviewerRole = 'Contractor Agent';
      }
    }

    try {
      const newReview = await createReviewInDb(
        currentUser.id,
        reviewedUserId,
        jobId,
        rating,
        reviewText,
        categories,
        reviewerName,
        reviewerRole
      );

      // Refresh data collection states
      setReviews(prev => [newReview, ...prev]);

      const [dbWorkers, dbCompanies] = await Promise.all([
        fetchWorkers(),
        fetchCompanies()
      ]);
      if (dbWorkers) setWorkers(dbWorkers);
      if (dbCompanies) setCompanies(dbCompanies);

      await createNotificationInDb(
        reviewedUserId,
        'New Review Received ⭐',
        `You received a new ${rating}-star feedback review from ${reviewerName}.`
      );

      return newReview;
    } catch (err: any) {
      console.error("Review submission failed:", err.message);
      throw err;
    }
  };

  // Action: Report Review
  const handleReportReview = async (reviewId: string, reason: string) => {
    try {
      await reportReviewInDb(reviewId, reason);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reported: true, reportReason: reason } : r));
      await createNotificationInDb(
        currentUser?.id || '',
        'Review Reported',
        'Thank you for reporting. Our site administrators are reviewing this feedback for guidelines compliance.'
      );
    } catch (err: any) {
      console.error("Reporting review failed:", err.message);
    }
  };

  // Action: Admin Moderate Review
  const handleModerateReview = async (reviewId: string, action: 'approve' | 'delete') => {
    try {
      await moderateReviewInDb(reviewId, action);
      if (action === 'delete') {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      } else {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reported: false, reportReason: null, moderated: true } : r));
      }
      
      const [dbWorkers, dbCompanies] = await Promise.all([
        fetchWorkers(),
        fetchCompanies()
      ]);
      if (dbWorkers) setWorkers(dbWorkers);
      if (dbCompanies) setCompanies(dbCompanies);
    } catch (err: any) {
      console.error("Moderating review failed:", err.message);
    }
  };

  // Action: Propose new site walkthrough
  const handleScheduleInterview = async (newInterview: Omit<Interview, 'id'>) => {
    try {
      const created = await createInterviewInDb(newInterview);
      setInterviews(prev => [created, ...prev]);

      // Create live notification record in the notifications table
      const job = jobs.find(j => j.id === newInterview.jobId);
      const contractorId = job ? job.companyId : null;
      const recipientId = userType === 'worker' ? contractorId : newInterview.workerId;
      const senderName = userType === 'worker' 
        ? (workers.find(w => w.id === currentUser?.id)?.name || 'Tradesman') 
        : (companies.find(c => c.id === currentUser?.id)?.name || 'Contractor');

      if (recipientId) {
        await createNotificationInDb(
          recipientId, 
          `Walkthrough Induction Booked by ${senderName}`, 
          `Walkthrough induction booked for ${newInterview.date} at ${newInterview.time}.`
        );
      }
    } catch (err: any) {
      console.error("Walkthrough schedule error:", err.message);
      alert(`Could not schedule the walkthrough: ${err.message || err}`);
    }
  };

  // Action: Update worker detail fields
  const handleUpdateWorker = async (updated: WorkerProfile) => {
    try {
      // Always persist the current profile photo URL when saving the worker profile.
      // This ensures newly uploaded Supabase Storage images survive refreshes.
      await updateWorkerProfileInDb(updated.id, updated, true);

      // Re-fetch the saved database profiles so the UI uses Supabase as the source of truth.
      const dbWorkers = await fetchWorkers();
      setWorkers(dbWorkers || []);
    } catch (err: any) {
      console.error("Worker update error:", err.message);
      alert(`Profile update failed: ${err.message || err}`);
    }
  };

  // Action: Update company detail fields
  const handleUpdateCompany = async (updated: CompanyProfile) => {
    setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
    try {
      await updateCompanyProfileInDb(updated.id, updated);
      const dbCompanies = await fetchCompanies();
      if (dbCompanies && dbCompanies.length > 0) {
        setCompanies(dbCompanies);
      }
    } catch (err: any) {
      console.error("Company update error:", err.message);
    }
  };

  // Sidebar Desktop Navigation Links
  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
    { id: 'swipe', label: userType === 'employer' ? 'Find Workers' : 'Find Jobs', icon: userType === 'employer' ? <Wrench className="w-4 h-4" /> : <Briefcase className="w-4 h-4" /> },
    { id: 'matches', label: 'Matches', icon: <Heart className="w-4 h-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'interviews', label: 'Interviews', icon: <Calendar className="w-4 h-4" /> },
    { id: 'companies', label: 'Companies', icon: <Users className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
  ];

  // Mobile Bottom Tab Links
  const mobileTabs = [
    { id: 'dashboard', label: 'Home', icon: <Activity className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
    { 
      id: 'swipe', 
      label: userType === 'employer' ? 'Find Lads' : 'Job Search', 
      icon: userType === 'employer' ? <Wrench className="w-5 h-5" /> : <Briefcase className="w-5 h-5" /> 
    },
    { id: 'matches', label: 'Matches', icon: <Heart className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  // Action: Add custom worker
  const handleAddWorker = (w: WorkerProfile) => {
    setWorkers(prev => [w, ...prev]);
  };

  // Action: Add custom company
  const handleAddCompany = (c: CompanyProfile) => {
    setCompanies(prev => [c, ...prev]);
  };

  // Action: Add custom job vacancy
  const handleAddJob = async (j: JobProfile) => {
    try {
      const created = await createJobInDb(j);
      setJobs(prev => [created, ...prev]);
    } catch (err: any) {
      console.error("Job insertion error:", err.message);
      alert(`Could not create the job: ${err.message || err}`);
    }
  };

  // Action: Handle registration or login
  const handleAuthSuccess = (session: { id: string; email: string; userType: UserType }) => {
    setCurrentUser(session);
    setUserType(session.userType);
    setCurrentView('dashboard');
  };

  // Action: Terminate session & log out
  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error("Supabase sign out error:", err);
    }
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  // Resolve only the profile owned by the authenticated Supabase user.
  const loggedInWorker = currentUser?.userType === 'worker'
    ? workers.find(w => w.id === currentUser.id) || null
    : null;

  const loggedInCompany = currentUser?.userType === 'employer'
    ? companies.find(c => c.id === currentUser.id) || null
    : null;

  if (!currentUser) {
    return (
      <AuthView 
        onAuthSuccess={handleAuthSuccess}
        workers={workers}
        companies={companies}
        onAddWorker={handleAddWorker}
        onAddCompany={handleAddCompany}
        onAddJob={handleAddJob}
      />
    );
  }

  const authenticatedProfile = userType === 'worker' ? loggedInWorker : loggedInCompany;

  if (!authenticatedProfile) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 text-center shadow-sm">
          <h1 className="text-lg font-black text-zinc-900">{dbLoading ? 'Loading your HireUp profile…' : 'Profile unavailable'}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {dbLoading
              ? 'Your authenticated Supabase account is being connected to its live profile.'
              : dbSyncError || 'No live profile was found for this authenticated account.'}
          </p>
          {!dbLoading && (
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-5 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-mono font-bold uppercase"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="hireup_app_root" className="min-h-screen bg-zinc-50 flex flex-col md:flex-row text-zinc-800">
      
      {/* Desktop Left Sidebar Panel */}
      <aside className="w-64 bg-white text-zinc-800 border-r border-zinc-200 flex-shrink-0 flex-col justify-between hidden md:flex sticky top-0 h-screen select-none z-20">
        <div className="flex flex-col">
          {/* Logo Brand */}
          <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#34D399] flex items-center justify-center text-white font-mono font-black text-lg shadow-md shadow-[#34D399]/20">
              HU
            </div>
            <div>
              <span className="text-sm font-black font-sans uppercase tracking-wider text-zinc-900">Hire<span className="text-[#10B981]">Up</span></span>
              <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">TRADES RECRUITMENT</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setCurrentView(link.id);
                    setSelectedMatchId(null);
                  }}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-3 transition-all cursor-pointer ${isActive ? 'bg-[#34D399] text-white shadow-md shadow-[#34D399]/15' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}`}
                >
                  {link.icon}
                  <span className="uppercase tracking-wide">{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Account brief in Sidebar footer */}
        <div className="p-4 border-t border-zinc-100 bg-white flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-zinc-200 flex-shrink-0 bg-white p-0.5">
              <img 
                src={userType === 'worker' ? loggedInWorker!.avatar : loggedInCompany!.logo} 
                alt="user profile" 
                className="w-full h-full object-cover rounded"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="overflow-hidden flex-grow">
              <p className="text-xs font-bold text-zinc-800 truncate">
                {userType === 'worker' ? loggedInWorker!.name : loggedInCompany!.name}
              </p>
              <p className="text-[9px] font-mono text-zinc-400 truncate uppercase">
                {userType === 'worker' ? loggedInWorker!.trade : 'TIER 1 CONTRACTOR'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full py-1.5 bg-zinc-50 hover:bg-red-50 text-zinc-500 hover:text-red-600 border border-zinc-200 hover:border-red-150 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Pack Up & Log Out
          </button>
        </div>
      </aside>

      {/* Main Container wrapper */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        
        {/* Top Branding and Persona Header */}
        <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-xs">
          {/* Mobile Logo Brand */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#34D399] flex items-center justify-center text-white font-mono font-black text-sm">
              HU
            </div>
            <span className="text-sm font-black uppercase tracking-wider text-zinc-900">Hire<span className="text-[#10B981]">Up</span></span>
          </div>

          {/* Authenticated account role */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black text-zinc-400 uppercase hidden sm:inline">SIGNED IN AS:</span>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-mono font-black text-[#10B981] uppercase flex items-center gap-1.5">
              {userType === 'worker' ? <Wrench className="w-3 h-3" /> : <HardHat className="w-3 h-3" />}
              {userType === 'worker' ? 'Worker' : 'Contractor'}
            </div>
          </div>

          {/* Alert Bell indicator */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
            </button>
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 hidden md:block bg-white p-0.5">
              <img 
                src={userType === 'worker' ? loggedInWorker!.avatar : loggedInCompany!.logo} 
                alt="user avatar" 
                className="w-full h-full object-cover rounded"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 relative cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Core Content Stage */}
        <main className="flex-grow p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {(() => {
            switch (currentView) {
              case 'dashboard':
                return (
                  <DashboardView 
                    userType={userType}
                    workers={workers}
                    jobs={jobs}
                    interviews={interviews}
                    matches={matches}
                    messages={messages}
                    companies={companies}
                    currentUser={currentUser}
                    onNavigate={(v) => setCurrentView(v)}
                    onSelectWorker={(w) => setSelectedWorker(w)}
                    onSelectJob={(j) => setSelectedJob(j)}
                    onUpdateWorker={handleUpdateWorker}
                    onUpdateCompany={handleUpdateCompany}
                  />
                );
              case 'swipe':
                return (
                  <SwipeView 
                    userType={userType}
                    workers={workers}
                    jobs={jobs}
                    companies={companies}
                    currentUser={currentUser}
                    onMatchCreated={handleMatchCreated}
                    onSelectWorker={(w) => setSelectedWorker(w)}
                    onSelectJob={(j) => setSelectedJob(j)}
                    onNavigate={(v) => setCurrentView(v)}
                    jobsViewMode={jobsViewMode}
                    onJobsViewModeChange={setJobsViewMode}
                  />
                );
              case 'search':
                return (
                  <SearchView 
                    userType={userType}
                    workers={workers}
                    jobs={jobs}
                    onSelectWorker={(w) => setSelectedWorker(w)}
                    onSelectJob={(j) => setSelectedJob(j)}
                    onNavigate={(v) => setCurrentView(v)}
                  />
                );
              case 'matches':
                return (
                  <MatchesView 
                    userType={userType}
                    matches={matches}
                    workers={workers}
                    jobs={jobs}
                    companies={companies}
                    onNavigate={(v, matchId) => {
                      setCurrentView(v);
                      if (matchId) setSelectedMatchId(matchId);
                    }}
                    onSelectWorker={(w) => setSelectedWorker(w)}
                    onSelectJob={(j) => setSelectedJob(j)}
                    onSelectCompany={(c) => setSelectedCompany(c)}
                  />
                );
              case 'messages':
                return (
                  <MessagingView 
                    userType={userType}
                    selectedMatchId={selectedMatchId}
                    matches={matches}
                    messages={messages}
                    workers={workers}
                    jobs={jobs}
                    companies={companies}
                    onSendMessage={handleSendMessage}
                    onNavigateBack={() => {
                      setCurrentView('matches');
                      setSelectedMatchId(null);
                    }}
                    onStartVideoCall={(matchId) => {
                      const match = matches.find(m => m.id === matchId);
                      if (match) {
                        const partnerW = workers.find(w => w.id === match.workerId);
                        const partnerJ = jobs.find(j => j.id === match.jobId);
                        
                        setActiveCall({
                          matchId: match.id,
                          partnerName: userType === 'employer' ? (partnerW?.name || 'Tradesman') : (partnerJ?.companyName || 'Apex Recruiter'),
                          partnerAvatar: userType === 'employer' ? (partnerW?.avatar || '') : (partnerJ?.companyLogo || ''),
                          partnerTrade: userType === 'employer' ? (partnerW?.trade || 'Electrician') : (partnerJ?.title || 'Lead Electrician')
                        });
                      }
                    }}
                  />
                );
              case 'interviews':
                return (
                  <InterviewsView 
                    userType={userType}
                    interviews={interviews}
                    workers={workers}
                    jobs={jobs}
                    reviews={reviews}
                    onConfirmInterview={handleConfirmInterview}
                    onDeclineInterview={handleDeclineInterview}
                    onCompleteInterview={handleCompleteInterview}
                    onScheduleInterview={handleScheduleInterview}
                    onSubmitReview={handleSubmitReview}
                  />
                );
              case 'companies':
                return (
                  <CompaniesView 
                    companies={companies}
                    jobs={jobs}
                    onSelectJob={(j) => setSelectedJob(j)}
                  />
                );
              case 'analytics':
                return (
                  <AnalyticsView 
                    userType={userType}
                  />
                );
              case 'settings':
                return (
                  <SettingsView 
                    userType={userType}
                    onChangeUserType={(t) => setUserType(t)}
                    onSignOut={handleSignOut}
                  />
                );
              case 'profile':
                return (
                  <ProfileView 
                    userType={userType}
                    workerProfile={loggedInWorker!}
                    companyProfile={loggedInCompany!}
                    jobs={jobs}
                    reviews={reviews}
                    interviews={interviews}
                    currentUserId={currentUser?.id}
                    onUpdateWorker={handleUpdateWorker}
                    onUpdateCompany={handleUpdateCompany}
                    onReportReview={handleReportReview}
                    onModerateReview={handleModerateReview}
                  />
                );
              default:
                return (
                  <DashboardView 
                    userType={userType}
                    workers={workers}
                    jobs={jobs}
                    interviews={interviews}
                    matches={matches}
                    messages={messages}
                    companies={companies}
                    currentUser={currentUser}
                    onNavigate={(v) => setCurrentView(v)}
                    onSelectWorker={(w) => setSelectedWorker(w)}
                    onSelectJob={(j) => setSelectedJob(j)}
                    onUpdateWorker={handleUpdateWorker}
                    onUpdateCompany={handleUpdateCompany}
                  />
                );
            }
          })()}
        </main>

        {/* Mobile Bottom Navigation Bar Panel */}
        <nav className="bg-white text-zinc-800 border-t border-zinc-200 md:hidden flex justify-around py-2 sticky bottom-0 z-20 select-none">
          {mobileTabs.map((tab) => {
            const isActive = currentView === tab.id || (tab.id === 'swipe' && currentView === 'search');
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentView(tab.id);
                  setSelectedMatchId(null);
                }}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all cursor-pointer ${isActive ? 'text-[#34D399]' : 'text-zinc-400 hover:text-zinc-900'}`}
              >
                {isActive ? (
                  <div className="p-1 bg-[#34D399]/10 rounded-full text-[#34D399]">
                    {tab.icon}
                  </div>
                ) : (
                  tab.icon
                )}
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* DETAIL OVERLAY MODAL: Tradesman Digital CV Profile */}
      {selectedWorker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-screen overflow-y-auto flex flex-col justify-between shadow-2xl relative font-sans">
            {/* Top Close bar */}
            <div className="p-4 border-b border-zinc-100 bg-zinc-50 sticky top-0 flex justify-between items-center z-10">
              <span className="text-xs font-mono font-black text-[#10B981] uppercase tracking-wider">
                👷‍♂️ FULL DIGITAL CV PROFILE
              </span>
              <button 
                onClick={() => setSelectedWorker(null)}
                className="p-1.5 bg-zinc-200 hover:bg-[#34D399] hover:text-white rounded-full transition-all text-zinc-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile body render (we reuse part of ProfileView style) */}
            <div className="p-6 space-y-6">
              {/* Header card info */}
              <div className="flex flex-col sm:flex-row gap-5 items-center bg-zinc-50 border border-zinc-150 p-5 rounded-3xl">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 flex-shrink-0 relative">
                  <img 
                    src={selectedWorker.profilePhotoUrl || selectedWorker.avatar} 
                    alt={selectedWorker.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-xl font-bold text-zinc-900">
                      {selectedWorker.name}
                    </h3>
                    {selectedWorker.verified && (
                      <span className="px-2 py-0.5 bg-zinc-900 text-[#34D399] rounded text-[8px] font-mono font-bold uppercase flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-mono font-bold text-[#10B981] uppercase tracking-wide">
                    {selectedWorker.trade} {selectedWorker.subcategory ? `• ${selectedWorker.subcategory}` : ''}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono flex items-center justify-center sm:justify-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {selectedWorker.location}
                  </p>
                </div>
              </div>

              {/* STATS BENTO ROW */}
              {(() => {
                const workerInterviews = interviews.filter(i => i.workerId === selectedWorker.id && i.status === 'completed');
                const workerCompletedCount = workerInterviews.length;
                const workerReviewsList = reviews.filter(r => r.reviewedUserId === selectedWorker.id && !r.moderated);
                const workerAverageRating = workerReviewsList.length > 0 
                  ? (workerReviewsList.reduce((sum, r) => sum + r.rating, 0) / workerReviewsList.length).toFixed(1) 
                  : selectedWorker.rating || '5.0';

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-center sm:text-left">
                      <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">Jobs Completed</span>
                      <p className="text-base font-black text-zinc-900 mt-1">{workerCompletedCount > 0 ? `${workerCompletedCount} Sites` : '0 worked'}</p>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-center sm:text-left">
                      <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">Average Rating</span>
                      <p className="text-base font-black text-zinc-900 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {workerAverageRating}
                      </p>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-center sm:text-left">
                      <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">Wage Target</span>
                      <p className="text-base font-black text-[#10B981] mt-1">{selectedWorker.payRate}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Bio details */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <FileText className="w-4 h-4 text-[#10B981]" /> Professional Statement
                </h4>
                <p className="text-xs md:text-sm text-zinc-600 leading-relaxed font-sans whitespace-pre-line">
                  {selectedWorker.about || <span className="italic text-zinc-400">No profile description added yet.</span>}
                </p>
              </div>

              {/* Credentials & Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <Award className="w-4 h-4 text-[#10B981]" /> Accreditations & Card Competence
                </h4>
                {selectedWorker.qualifications && selectedWorker.qualifications.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWorker.qualifications.map((qual, i) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-[#10B981] rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {qual}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No CSCS / competence credentials listed.</p>
                )}
              </div>

              {/* Active Licences & Verified Documents scans */}
              {((selectedWorker.licences && selectedWorker.licences.length > 0) || 
                (selectedWorker.licenceImages && selectedWorker.licenceImages.length > 0) || 
                (selectedWorker.certificateFiles && selectedWorker.certificateFiles.length > 0)) && (
                <div className="space-y-3 bg-zinc-50 border border-zinc-150 p-4 rounded-2xl">
                  <h4 className="text-xs font-mono font-black text-zinc-800 uppercase tracking-wider">
                    Verified Documents & Scanned Badges
                  </h4>
                  <div className="space-y-2">
                    {/* Tags */}
                    {selectedWorker.licences && selectedWorker.licences.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedWorker.licences.map((lic, i) => (
                          <span key={i} className="px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded text-[9px] font-mono font-bold uppercase">
                            🪪 {lic}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Downloadable or zoomed previews */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(selectedWorker.certificateFiles || []).map((url, i) => (
                        <a 
                          key={`cert-${i}`} 
                          href={url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2.5 bg-white border border-zinc-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 hover:text-emerald-900"
                        >
                          <span className="truncate">Accredited Certificate #{i + 1}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                        </a>
                      ))}
                      {(selectedWorker.licenceImages || []).map((url, i) => (
                        <div 
                          key={`lic-${i}`} 
                          onClick={() => setAppLightboxImage(url)}
                          className="p-2.5 bg-white border border-zinc-200 rounded-xl flex items-center justify-between text-xs text-zinc-700 cursor-pointer hover:bg-zinc-50"
                        >
                          <span className="truncate">Scanned Licence Badge #{i + 1}</span>
                          <span className="text-[9px] font-mono text-zinc-400">ZOOM</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Work history timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <Calendar className="w-4 h-4 text-[#10B981]" /> Chronological On-site History
                </h4>
                {selectedWorker.workHistory && selectedWorker.workHistory.length > 0 ? (
                  <div className="border-l-2 border-zinc-200 ml-3 pl-5 space-y-4">
                    {selectedWorker.workHistory.map((hist) => (
                      <div key={hist.id} className="relative">
                        <span className="absolute -left-[26px] top-1 bg-[#34D399] w-3.5 h-3.5 rounded-full border-2 border-white" />
                        <div>
                          <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">{hist.duration}</span>
                          <h5 className="text-xs font-bold text-zinc-900 mt-0.5">{hist.role}</h5>
                          <p className="text-[10px] font-mono text-[#10B981] font-bold uppercase">{hist.company}</p>
                          <p className="text-xs text-zinc-600 mt-1">{hist.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No chronological construction contracts registered.</p>
                )}
              </div>

              {/* Tools list */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <Wrench className="w-4 h-4 text-[#10B981]" /> Active Tools & Vehicles
                </h4>
                {selectedWorker.toolsAndTransport && selectedWorker.toolsAndTransport.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWorker.toolsAndTransport.map((tool, i) => (
                      <span key={i} className="px-2 py-1 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded text-[10px] font-mono font-bold uppercase">
                        🔧 {tool}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No tools or transport registered.</p>
                )}
              </div>

              {/* PORTFOLIO WORK GALLERY */}
              {(() => {
                const workerGallery = selectedWorker.galleryImages || selectedWorker.portfolio || [];
                if (workerGallery.length === 0) return null;
                return (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                      <ImageIcon className="w-4 h-4 text-[#10B981]" /> Portfolios & Completed Works
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {workerGallery.map((url, i) => (
                        <div 
                          key={i} 
                          onClick={() => setAppLightboxImage(url)}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 cursor-pointer group"
                        >
                          <img 
                            src={url} 
                            alt={`Portfolio Sample ${i + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-mono font-bold">
                            ZOOM
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Verified references */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <ClipboardCheck className="w-4 h-4 text-[#10B981]" /> Verified Professional References
                </h4>
                {selectedWorker.references && selectedWorker.references.length > 0 ? (
                  <div className="space-y-2">
                    {selectedWorker.references.map((ref) => (
                      <div key={ref.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-zinc-900 font-sans">{ref.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono uppercase">{ref.position}</p>
                        </div>
                        <span className="text-zinc-500 font-mono font-bold">{ref.contact}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No formal references listed.</p>
                )}
              </div>

              {/* Real user feedback list */}
              {(() => {
                const workerReviewsList = reviews.filter(r => r.reviewedUserId === selectedWorker.id && !r.moderated);
                if (workerReviewsList.length === 0) return null;
                return (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Walkthrough Compliance Feedback
                    </h4>
                    <div className="divide-y divide-zinc-100">
                      {workerReviewsList.map((rev) => (
                        <div key={rev.id} className="py-3 space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-zinc-800">{rev.reviewerName}</p>
                              <p className="text-[9px] text-zinc-400 font-mono uppercase">{rev.reviewerRole}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-200'}`} />
                                ))}
                              </div>
                              <span className="text-[9px] font-mono text-zinc-400">
                                {new Date(rev.createdAt).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-600 font-sans italic">"{rev.reviewText}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Sticky Actions bar */}
            <div className="p-4 border-t border-zinc-150 bg-zinc-50 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setSelectedWorker(null)}
                className="flex-1 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                DISMISS CV
              </button>
              
              <button
                onClick={() => {
                  const relatedJob = jobs.find(j => j.trade === selectedWorker.trade) || jobs[0];
                  setSelectedWorker(null);
                  if (relatedJob) {
                    handleMatchCreated(selectedWorker.id, relatedJob.id);
                  }
                  setCurrentView('messages');
                }}
                className="flex-1 py-2.5 bg-[#34D399] hover:bg-[#10B981] text-zinc-950 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" /> MESSAGE WORKER
              </button>

              <button
                onClick={() => {
                  const partner = selectedWorker;
                  setSelectedWorker(null);
                  setActiveCall({
                    matchId: 'direct-' + partner.id,
                    partnerName: partner.name,
                    partnerAvatar: partner.avatar,
                    partnerTrade: partner.trade,
                  });
                }}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" /> CALL NOW
              </button>

              <button
                onClick={() => {
                  setSelectedWorker(null);
                  setCurrentView('interviews');
                }}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" /> SCHEDULE WALKTHROUGH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL OVERLAY MODAL: Company Contract Job Spec */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-screen overflow-y-auto flex flex-col justify-between shadow-2xl relative font-sans">
            {/* Top Close bar */}
            <div className="p-4 border-b border-zinc-100 bg-zinc-50 sticky top-0 flex justify-between items-center z-10">
              <span className="text-xs font-mono font-black text-[#10B981] uppercase tracking-wider">
                🏢 DETAILED CONTRACT JOB ADVERT
              </span>
              <button 
                onClick={() => setSelectedJob(null)}
                className="p-1.5 bg-zinc-200 hover:bg-[#34D399] hover:text-white rounded-full transition-all text-zinc-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spec body render */}
            <div className="p-6 space-y-6">
              {/* Header card info */}
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-200 bg-white p-2 flex items-center justify-center">
                  <img 
                    src={selectedJob.companyLogo} 
                    alt={selectedJob.companyName} 
                    className="max-w-full max-h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-1.5">
                    {selectedJob.title}
                    {selectedJob.verified && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                  </h3>
                  <p className="text-sm font-mono font-bold text-[#10B981] uppercase tracking-wide">
                    {selectedJob.companyName}
                  </p>
                  <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {selectedJob.location}
                  </p>
                </div>
              </div>

              {/* Bio details */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-wider">Contract Description</h4>
                <p className="text-xs md:text-sm text-zinc-700 leading-relaxed font-sans">{selectedJob.description}</p>
              </div>

              {/* Operations rates */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-50 p-4 border border-zinc-100 rounded-xl font-mono text-xs text-zinc-600 text-center">
                <div>
                  <p className="font-bold text-zinc-400 uppercase text-[9px]">DAILY RATE</p>
                  <p className="text-xs font-black text-[#10B981] mt-0.5">{selectedJob.payRate}</p>
                </div>
                <div>
                  <p className="font-bold text-zinc-400 uppercase text-[9px]">START DATE</p>
                  <p className="text-xs font-bold text-zinc-950 mt-0.5">{selectedJob.startDate}</p>
                </div>
                <div>
                  <p className="font-bold text-zinc-400 uppercase text-[9px]">DURATION</p>
                  <p className="text-xs font-bold text-zinc-950 mt-0.5">{selectedJob.duration}</p>
                </div>
                <div>
                  <p className="font-bold text-zinc-400 uppercase text-[9px]">CIS PAYROLL</p>
                  <p className="text-xs font-bold text-zinc-950 mt-0.5 uppercase">{selectedJob.employmentType}</p>
                </div>
              </div>

              {/* Qualifications list */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-wider">Mandated CSCS/ECS Card Levels</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.qualifications.map((q, i) => (
                    <span key={i} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" /> {q}
                    </span>
                  ))}
                </div>
              </div>

              {/* Requirements list */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-wider">Candidate Site Requirements</h4>
                <div className="space-y-1.5">
                  {selectedJob.requirements.map((req, i) => (
                    <div key={i} className="text-xs text-zinc-600 flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">⚠️</span>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits list */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-wider">Subcontract Benefits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedJob.benefits.map((benefit, i) => (
                    <div key={i} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✔</span>
                      <p className="text-xs font-sans font-bold text-zinc-950">{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>


            </div>

            {/* Sticky Actions bar */}
            <div className="p-4 border-t border-zinc-150 bg-zinc-50 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="flex-1 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                DISMISS
              </button>

              <button
                onClick={() => {
                  setSelectedJob(null);
                  handleMatchCreated(currentUser.id, selectedJob.id);
                  setCurrentView('messages');
                }}
                className="flex-1 py-2.5 bg-[#34D399] hover:bg-[#10B981] text-zinc-950 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" /> MESSAGE CONTRACTOR
              </button>

              <button
                onClick={() => {
                  setSelectedJob(null);
                  setCurrentView('interviews');
                }}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" /> INVITE / BOOK DATE
              </button>

              <button
                onClick={() => {
                  setSelectedJob(null);
                  handleMatchCreated(currentUser.id, selectedJob.id);
                  // Simulate rapid hire offer
                  alert("Bid submitted! Opened instant site chat to finalize CIS rates and starting details.");
                  setCurrentView('messages');
                }}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" /> HIRE NOW
              </button>
            </div>
          </div>
        </div>
      )}




      {/* DETAIL OVERLAY MODAL: Contractor Company Profile */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-screen overflow-y-auto flex flex-col justify-between shadow-2xl relative font-sans">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50 sticky top-0 flex justify-between items-center z-10">
              <span className="text-xs font-mono font-black text-[#10B981] uppercase tracking-wider">
                🏗️ CONTRACTOR COMPANY PROFILE
              </span>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="p-1.5 bg-zinc-200 hover:bg-[#34D399] hover:text-white rounded-full transition-all text-zinc-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-5 items-center bg-zinc-50 border border-zinc-200 p-5 rounded-3xl">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200 bg-white flex-shrink-0 flex items-center justify-center p-2">
                  {selectedCompany.companyLogoUrl || selectedCompany.logo ? (
                    <img
                      src={selectedCompany.companyLogoUrl || selectedCompany.logo}
                      alt={selectedCompany.name}
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <HardHat className="w-10 h-10 text-zinc-400" />
                  )}
                </div>

                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-xl font-bold text-zinc-900">{selectedCompany.name}</h3>
                    {selectedCompany.verified && (
                      <span className="px-2 py-0.5 bg-zinc-900 text-[#34D399] rounded text-[8px] font-mono font-bold uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-mono font-bold text-[#10B981] uppercase tracking-wide">
                    {selectedCompany.industry || 'UK Construction Contractor'}
                  </p>

                  <p className="text-xs text-zinc-500 font-mono flex items-center justify-center sm:justify-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    {selectedCompany.location || selectedCompany.businessAddress || 'United Kingdom'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                  <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">Active Vacancies</span>
                  <p className="text-base font-black text-zinc-900 mt-1">
                    {jobs.filter(job => job.companyId === selectedCompany.id).length}
                  </p>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                  <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">Company Size</span>
                  <p className="text-base font-black text-zinc-900 mt-1">
                    {selectedCompany.companySize || 'Not specified'}
                  </p>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                  <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">Rating</span>
                  <p className="text-base font-black text-zinc-900 mt-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    {selectedCompany.stats?.rating ?? 'New'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <FileText className="w-4 h-4 text-[#10B981]" /> Company Overview
                </h4>
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                  {selectedCompany.description || 'No company description has been added yet.'}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Compliance & Business Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">Companies House</span>
                    <p className="font-bold text-zinc-800 mt-1">{selectedCompany.companyHouseNumber || 'Not supplied'}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">VAT Number</span>
                    <p className="font-bold text-zinc-800 mt-1">{selectedCompany.vatNumber || 'Not supplied'}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">Public Liability</span>
                    <p className="font-bold text-zinc-800 mt-1">{selectedCompany.publicLiabilityInsurance || selectedCompany.insuranceStatus || 'Not supplied'}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">Contact</span>
                    <p className="font-bold text-zinc-800 mt-1">{selectedCompany.contactName || selectedCompany.phone || 'Not supplied'}</p>
                  </div>
                </div>
              </div>

              {selectedCompany.requirements && selectedCompany.requirements.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                    <ClipboardCheck className="w-4 h-4 text-[#10B981]" /> Hiring Requirements
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCompany.requirements.map((requirement, index) => (
                      <span key={index} className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-[#10B981] rounded text-[10px] font-mono font-bold uppercase">
                        {requirement}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <Briefcase className="w-4 h-4 text-[#10B981]" /> Active Opportunities
                </h4>

                {jobs.filter(job => job.companyId === selectedCompany.id).length > 0 ? (
                  <div className="space-y-2">
                    {jobs
                      .filter(job => job.companyId === selectedCompany.id)
                      .map(job => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => {
                            setSelectedCompany(null);
                            setSelectedJob(job);
                          }}
                          className="w-full text-left p-4 bg-zinc-50 hover:bg-emerald-50 border border-zinc-200 hover:border-emerald-200 rounded-xl transition-all cursor-pointer"
                        >
                          <p className="text-sm font-bold text-zinc-900">{job.title}</p>
                          <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1">
                            {job.location} • {job.payRate} • {job.duration}
                          </p>
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">
                    This contractor currently has no individual job adverts listed.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="flex-1 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                CLOSE PROFILE
              </button>

              <button
                type="button"
                onClick={() => {
                  const companyMatch = matches.find(
                    match => match.contractorId === selectedCompany.id &&
                      match.workerId === currentUser.id
                  );
                  setSelectedCompany(null);
                  if (companyMatch) {
                    setSelectedMatchId(companyMatch.id);
                    setCurrentView('messages');
                  }
                }}
                className="flex-1 py-2.5 bg-[#34D399] hover:bg-[#10B981] text-white font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" /> OPEN MATCH CHAT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN ACTIVE VIDEO CALL ROOM OVERLAY */}
      {activeCall && (
        <div className="fixed inset-0 z-[70]">
          <VideoInterviewRoom 
            matchId={activeCall.matchId}
            partnerName={activeCall.partnerName}
            partnerAvatar={activeCall.partnerAvatar}
            partnerTrade={activeCall.partnerTrade}
            userRole={userType}
            onEndCall={() => setActiveCall(null)}
          />
        </div>
      )}

      {/* APP LIGHTBOX OVERLAY */}
      {appLightboxImage && (
        <div 
          onClick={() => setAppLightboxImage(null)}
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[80] flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button 
            type="button" 
            onClick={() => setAppLightboxImage(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={appLightboxImage} 
            alt="Expanded visual zoom" 
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl animate-fade-in"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

    </div>
  );
}