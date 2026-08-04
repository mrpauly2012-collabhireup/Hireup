/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, Clock, MapPin, ShieldAlert, Check, X, 
  Plus, AlertTriangle, ExternalLink, HardHat, ShieldCheck, Star, AlertCircle, Video
} from 'lucide-react';
import { Interview, WorkerProfile, JobProfile, UserType } from '../types';

interface InterviewsViewProps {
  userType: UserType;
  interviews: Interview[];
  workers: WorkerProfile[];
  jobs: JobProfile[];
  reviews: any[];
  onConfirmInterview: (id: string) => void;
  onDeclineInterview: (id: string) => void;
  onCompleteInterview: (id: string) => void;
  onScheduleInterview: (interview: Omit<Interview, 'id'>) => void;
  onSubmitReview: (reviewedUserId: string, jobId: string, rating: number, text: string, categories: Record<string, number>) => Promise<any>;
}

export default function InterviewsView({
  userType,
  interviews,
  workers,
  jobs,
  reviews = [],
  onConfirmInterview,
  onDeclineInterview,
  onCompleteInterview,
  onScheduleInterview,
  onSubmitReview
}: InterviewsViewProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [interviewMode, setInterviewMode] = useState<'video' | 'onsite'>('video');
  const [ppeList, setPpeList] = useState<string[]>(['Hard Hat', 'Steel Toe Boots', 'Hi-Vis Vest']);

  // State hooks for review submissions
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    reviewedUserId: string;
    jobId: string;
    reviewedName: string;
  } | null>(null);
  const [overallRating, setOverallRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({});
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !selectedJobId || !interviewDate || !interviewTime) return;

    const roomName = [
      'HireUpInterview',
      selectedWorkerId,
      selectedJobId,
      interviewDate,
      interviewTime,
    ]
      .join('-')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 120);

    onScheduleInterview({
      workerId: selectedWorkerId,
      jobId: selectedJobId,
      date: interviewDate,
      time: interviewTime,
      location:
        interviewMode === 'video'
          ? 'Online video interview'
          : interviewLocation || 'Site address to be confirmed',
      meetingLink:
        interviewMode === 'video'
          ? `https://meet.jit.si/${roomName}`
          : undefined,
      status: 'pending',
      ppeRequired: interviewMode === 'video' ? [] : ppeList,
      notes:
        interviewNotes ||
        (interviewMode === 'video'
          ? 'Online HireUp video interview.'
          : 'Standard site walkthrough and induction. Bring CSCS card.')
    });

    setShowScheduleModal(false);
    // Reset fields
    setInterviewDate('');
    setInterviewTime('');
    setInterviewLocation('');
    setInterviewNotes('');
  };

  const togglePpe = (item: string) => {
    if (ppeList.includes(item)) {
      setPpeList(prev => prev.filter(p => p !== item));
    } else {
      setPpeList(prev => [...prev, item]);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;
    setReviewError('');
    setSubmittingReview(true);

    try {
      await onSubmitReview(
        reviewTarget.reviewedUserId,
        reviewTarget.jobId,
        overallRating,
        reviewText,
        categoryRatings
      );
      setShowReviewModal(false);
      setReviewTarget(null);
      setOverallRating(5);
      setReviewText('');
      setCategoryRatings({});
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div id="interviews_view" className="space-y-6 pb-12 font-sans animate-fade-in">
      
      {/* Title & Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#10B981]" /> Scheduled Walkthroughs
          </h2>
          <p className="text-xs text-zinc-500">
            {userType === 'employer' 
              ? "Coordinate on-site inductions, competence walkthroughs, and tradesmen interviews."
              : "Review upcoming on-site trials, briefings, and contractor walkthrough invitations."}
          </p>
        </div>
        {userType === 'employer' && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3.5 py-2 bg-[#34D399] hover:bg-[#10B981] text-white font-mono font-bold text-xs rounded-xl transition-all duration-200 ease-out flex items-center gap-1 shadow-md cursor-pointer active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" /> SCHEDULE INDUCTION
          </button>
        )}
      </div>

      {/* Interviews Grid */}
      {interviews.length > 0 ? (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const worker = workers.find(w => w.id === interview.workerId);
            const job = jobs.find(j => j.id === interview.jobId);
            if (!worker || !job) return null;

            return (
              <div 
                key={interview.id}
                className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-md hover:border-[#34D399]/30 transition-all duration-200 ease-out grid grid-cols-1 md:grid-cols-3"
              >
                {/* Left Panel - Person and Vacancy */}
                <div className="p-5 border-b md:border-b-0 md:border-r border-zinc-100 space-y-3">
                  <span className="px-2 py-0.5 bg-zinc-900 text-white rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                    {job.trade.toUpperCase()} CONTRACT
                  </span>
                  
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100 border border-zinc-200/80">
                      <img 
                        src={userType === 'employer' ? worker.avatar : job.companyLogo} 
                        alt="logo" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 font-sans">
                        {userType === 'employer' ? worker.name : job.companyName}
                      </h4>
                      <p className="text-xs text-[#10B981] font-mono font-bold">{job.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {interview.status === 'confirmed' ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[9px] font-mono font-black uppercase flex items-center gap-1">
                        <Check className="w-3 h-3" /> CONFIRMED WALKTHROUGH
                      </span>
                    ) : interview.status === 'pending' ? (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[9px] font-mono font-black uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-pulse" /> PROPOSED / AWAITING
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-500 border border-zinc-200/80 rounded-full text-[9px] font-mono font-black uppercase">
                        COMPLETED
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Panel - Location and Calendar details */}
                <div className="p-5 border-b md:border-b-0 md:border-r border-zinc-100 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                      <Calendar className="w-4 h-4 text-[#34D399]" />
                      <span className="font-bold text-zinc-800">
                        {new Date(interview.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                      <Clock className="w-4 h-4 text-[#34D399]" />
                      <span className="font-bold text-zinc-800">{interview.time} BST</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-zinc-500 font-sans">
                      <MapPin className="w-4 h-4 text-zinc-400 mt-0.5" />
                      <span className="leading-relaxed">{interview.location}</span>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 text-[11px] text-zinc-600 leading-relaxed font-sans">
                    <b>Induction details:</b> "{interview.notes}"
                  </div>
                </div>

                {/* Right Panel - Safety Mandate and Action Button */}
                <div className="p-5 flex flex-col justify-between bg-zinc-50/50">
                  {/* Safety compliance Checklist */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-[10px] font-mono font-black text-amber-600 uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" /> PPE SITE REQUISITIONS
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {interview.ppeRequired.map((ppe, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-zinc-900 text-zinc-100 border border-zinc-800 rounded text-[9px] font-mono font-bold uppercase flex items-center gap-1">
                          <HardHat className="w-2.5 h-2.5 text-[#34D399]" /> {ppe}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions depending on user and status */}
                  <div className="pt-4 flex flex-col gap-2">
                    {interview.status === 'pending' && userType === 'worker' && (
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => onDeclineInterview(interview.id)}
                          className="flex-1 py-1.5 border border-zinc-200/80 text-zinc-500 hover:text-red-500 hover:border-red-200 text-xs font-mono font-bold rounded-xl transition-all duration-200 ease-out cursor-pointer active:scale-[0.99]"
                        >
                          DECLINE
                        </button>
                        <button
                          onClick={() => onConfirmInterview(interview.id)}
                          className="flex-1 py-1.5 bg-[#34D399] hover:bg-[#10B981] text-white text-xs font-mono font-bold rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-0.5 cursor-pointer active:scale-[0.99]"
                        >
                          ACCEPT DATE
                        </button>
                      </div>
                    )}

                    {interview.status === 'confirmed' && (
                      <div className="flex flex-col gap-2 w-full">
                        {interview.meetingLink && (
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 bg-[#34D399] hover:bg-[#10B981] text-zinc-950 text-xs font-mono font-black rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <Video className="w-4 h-4" /> JOIN VIDEO INTERVIEW
                          </a>
                        )}
                        <button
                          onClick={() => onCompleteInterview(interview.id)}
                          className="w-full py-1.5 bg-zinc-900 hover:bg-[#10B981] text-white text-xs font-mono font-black rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-1 shadow-md cursor-pointer active:scale-[0.99]"
                        >
                          ✓ MARK INTERVIEW COMPLETED
                        </button>
                        <a 
                          href="https://maps.google.com" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="w-full py-1.5 border border-zinc-200/80 text-zinc-700 bg-white hover:bg-zinc-50 text-xs font-mono font-bold rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-1 shadow-md"
                        >
                          DIRECTIONS TO SITE <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {interview.status === 'completed' && (() => {
                      const targetUserId = userType === 'worker' 
                        ? (jobs.find(j => j.id === interview.jobId)?.companyId || '') 
                        : interview.workerId;
                      const hasReviewed = reviews.some(r => r.jobId === interview.jobId && r.reviewedUserId === targetUserId);

                      if (hasReviewed) {
                        return (
                          <div className="w-full py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-center text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1">
                            ⭐ REVIEWED & SUBMITTED
                          </div>
                        );
                      }

                      return (
                        <button
                          onClick={() => {
                            const partnerName = userType === 'worker' 
                              ? (jobs.find(j => j.id === interview.jobId)?.companyName || 'Contractor') 
                              : (workers.find(w => w.id === interview.workerId)?.name || 'Tradesman');
                            setReviewTarget({
                              reviewedUserId: targetUserId,
                              jobId: interview.jobId,
                              reviewedName: partnerName
                            });
                            // Setup default category ratings
                            const defaultCats: Record<string, number> = {};
                            const cats = userType === 'worker' 
                              ? ['communication', 'site_organisation', 'payment_speed', 'professionalism', 'accuracy_of_job_description']
                              : ['reliability', 'quality_of_work', 'communication', 'professionalism', 'timekeeping'];
                            cats.forEach(c => { defaultCats[c] = 5; });
                            setCategoryRatings(defaultCats);
                            setOverallRating(5);
                            setReviewText('');
                            setReviewError('');
                            setShowReviewModal(true);
                          }}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-mono font-black rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer active:scale-[0.99]"
                        >
                          ⭐ LEAVE REVIEW & RATING
                        </button>
                      );
                    })()}

                    {interview.status === 'pending' && userType === 'employer' && (
                      <div className="text-center py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Awaiting Tradesman Response
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-zinc-200/80 rounded-xl space-y-3 max-w-sm mx-auto">
          <Calendar className="w-10 h-10 text-zinc-300 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-zinc-900">No Inductions Scheduled</h3>
            <p className="text-xs text-zinc-500">
              Arrange walkthrough dates inside chat rooms or utilize the "Schedule Induction" button to propose a slot.
            </p>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal overlay */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleScheduleSubmit}
            className="bg-white border border-zinc-200/80 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl font-sans"
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200/80">
              <h3 className="text-base font-bold text-zinc-900 uppercase font-mono tracking-wider">Schedule Site Walkthrough</h3>
              <button 
                type="button" 
                onClick={() => setShowScheduleModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Selector */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Select Connected Tradesman</label>
              <select 
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                required
                className="w-full p-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-mono font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus:border-[#34D399]"
              >
                <option value="">-- Choose Candidate --</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.trade})</option>
                ))}
              </select>
            </div>

            {/* Vacancy Selector */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Select Open Vacancy Contract</label>
              <select 
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                required
                className="w-full p-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-mono font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus:border-[#34D399]"
              >
                <option value="">-- Choose Position --</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title} (£{j.payRate})</option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Proposed Date</label>
                <input 
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  required
                  className="w-full p-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-mono font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Induction Time</label>
                <input 
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  required
                  className="w-full p-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-mono font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                Interview Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInterviewMode('video')}
                  className={`rounded-xl border px-3 py-2 text-xs font-mono font-black ${
                    interviewMode === 'video'
                      ? 'border-[#34D399] bg-emerald-50 text-emerald-700'
                      : 'border-zinc-200/80 bg-white text-zinc-600'
                  }`}
                >
                  VIDEO INTERVIEW
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewMode('onsite')}
                  className={`rounded-xl border px-3 py-2 text-xs font-mono font-black ${
                    interviewMode === 'onsite'
                      ? 'border-[#34D399] bg-emerald-50 text-emerald-700'
                      : 'border-zinc-200/80 bg-white text-zinc-600'
                  }`}
                >
                  ON-SITE
                </button>
              </div>
            </div>

            {interviewMode === 'onsite' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                    Site Location Postcode / Address
                  </label>
                  <input
                    type="text"
                    value={interviewLocation}
                    onChange={(e) => setInterviewLocation(e.target.value)}
                    placeholder="Site address or postcode"
                    className="w-full p-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase block">
                    Required Site Safety Wear
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Hard Hat', 'Steel Toe Boots', 'Hi-Vis Vest', 'Safety Glasses', 'Ear Protection'].map((item) => {
                      const active = ppeList.includes(item);
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => togglePpe(item)}
                          className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border transition-all duration-200 ease-out ${active ? 'bg-[#34D399] border-[#34D399] text-white shadow-md' : 'bg-zinc-50 border-zinc-200/80 text-zinc-600 hover:border-zinc-300'}`}
                        >
                          {item.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Special Instructions */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Special Instructions / Induction Notes</label>
              <textarea 
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                rows={2}
                placeholder="Site induction begins at main gate. Bring original CSCS card copy."
                className="w-full p-2 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 font-sans resize-none"
              />
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-2 border border-zinc-200/80 text-zinc-600 font-mono font-bold text-xs rounded-xl transition-all duration-200 ease-out"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-[#34D399] hover:bg-[#10B981] text-white font-mono font-bold text-xs rounded-xl transition-all duration-200 ease-out cursor-pointer active:scale-[0.99]"
              >
                SEND INTERVIEW INVITE
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Review & Rating Modal overlay */}
      {showReviewModal && reviewTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleReviewSubmit}
            className="bg-white border border-zinc-200/80 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl font-sans my-8 text-left"
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200/80">
              <div className="text-left">
                <h3 className="text-base font-bold text-zinc-900 uppercase font-mono tracking-wider">Leave Partner Review</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">FOR JOB COMPLETED WITH {reviewTarget.reviewedName.toUpperCase()}</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewTarget(null);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-xs text-rose-600 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Overall Star Rating */}
            <div className="space-y-2 text-center py-2 bg-amber-50/40 border border-amber-100 rounded-xl">
              <label className="text-xs font-mono font-black text-amber-700 uppercase tracking-wider block">Overall Rating Score</label>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setOverallRating(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer active:scale-[0.99]"
                  >
                    <Star 
                      className={`w-8 h-8 ${star <= overallRating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'}`} 
                    />
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-600 uppercase">
                {overallRating === 5 ? "Excellent - Tier 1 standard" :
                 overallRating === 4 ? "Very Good - Highly recommend" :
                 overallRating === 3 ? "Good - Met requirements" :
                 overallRating === 2 ? "Below Average" : "Poor - Unsatisfactory"}
              </span>
            </div>

            {/* Multi-category Rating metrics */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-mono font-black text-zinc-400 uppercase tracking-wider block">Category-specific Performance Metrics</label>
              
              {userType === 'worker' ? (
                // Worker reviewing Contractor
                <div className="space-y-2.5">
                  {[
                    { key: 'communication', label: 'Communication' },
                    { key: 'site_organisation', label: 'Site Organisation' },
                    { key: 'payment_speed', label: 'Payment Speed' },
                    { key: 'professionalism', label: 'Professionalism' },
                    { key: 'accuracy_of_job_description', label: 'Accuracy of Job Description' }
                  ].map((cat) => (
                    <div key={cat.key} className="flex justify-between items-center text-xs font-sans">
                      <span className="text-zinc-600 font-medium">{cat.label}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => setCategoryRatings(prev => ({ ...prev, [cat.key]: val }))}
                            className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold border transition-all duration-200 ease-out ${
                              (categoryRatings[cat.key] || 5) === val 
                                ? 'bg-amber-400 border-amber-400 text-white font-black' 
                                : 'bg-zinc-50 border-zinc-200/80 text-zinc-500 hover:border-zinc-300'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Contractor reviewing Worker
                <div className="space-y-2.5">
                  {[
                    { key: 'reliability', label: 'Reliability' },
                    { key: 'quality_of_work', label: 'Quality of Work' },
                    { key: 'communication', label: 'Communication' },
                    { key: 'professionalism', label: 'Professionalism' },
                    { key: 'timekeeping', label: 'Timekeeping' }
                  ].map((cat) => (
                    <div key={cat.key} className="flex justify-between items-center text-xs font-sans">
                      <span className="text-zinc-600 font-medium">{cat.label}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => setCategoryRatings(prev => ({ ...prev, [cat.key]: val }))}
                            className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold border transition-all duration-200 ease-out ${
                              (categoryRatings[cat.key] || 5) === val 
                                ? 'bg-amber-400 border-amber-400 text-white font-black' 
                                : 'bg-zinc-50 border-zinc-200/80 text-zinc-500 hover:border-zinc-300'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Written Review Textbox */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Written Endorsement / Review Notes</label>
              <textarea 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                required
                rows={3}
                placeholder="Describe your working experience with this member..."
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewTarget(null);
                }}
                className="flex-1 py-2 border border-zinc-200/80 text-zinc-600 font-mono font-bold text-xs rounded-xl transition-all duration-200 ease-out"
                disabled={submittingReview}
              >
                DISCARD
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold text-xs rounded-xl transition-all duration-200 ease-out cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
                disabled={submittingReview}
              >
                {submittingReview ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}