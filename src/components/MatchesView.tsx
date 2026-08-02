/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Heart, MessageSquare, Calendar, ChevronRight, Star, 
  MapPin, Clock, ShieldCheck, HelpCircle, Hammer, Wrench 
} from 'lucide-react';
import { WorkerProfile, JobProfile, Match, UserType, CompanyProfile } from '../types';

interface MatchesViewProps {
  userType: UserType;
  matches: Match[];
  workers: WorkerProfile[];
  jobs: JobProfile[];
  companies?: CompanyProfile[];
  onNavigate: (view: string, matchId?: string) => void;
  onSelectWorker: (worker: WorkerProfile) => void;
  onSelectJob: (job: JobProfile) => void;
}

export default function MatchesView({
  userType,
  matches,
  workers,
  jobs,
  companies,
  onNavigate,
  onSelectWorker,
  onSelectJob
}: MatchesViewProps) {
  
  // Resolve match info
  const resolvedMatches = matches.map(m => {
    const worker = workers.find(w => w.id === m.workerId);
    const job = jobs.find(j => j.id === m.jobId);
    return {
      matchId: m.id,
      worker,
      job,
      matchedAt: m.matchedAt,
      lastMessageText: m.lastMessageText || "You matched! Say hello and discuss site details.",
      lastMessageTime: m.lastMessageTime || "Just now"
    };
  }).filter(m => m.worker && m.job);

  return (
    <div id="matches_view" className="space-y-6 pb-12 font-sans animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 font-sans uppercase tracking-wider flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#34D399] fill-current" /> Matched Connections
        </h2>
        <p className="text-xs text-zinc-500 font-sans">
          {userType === 'employer' 
            ? "Lads who swiped right on your active site vacancies. Direct lines unlocked." 
            : "Contractors interested in your digital CV. Chat with site managers immediately."}
        </p>
      </div>

      {/* Matches Grid */}
      {resolvedMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resolvedMatches.map((m) => {
            const worker = m.worker!;
            const job = m.job!;
            const company = companies?.find(c => c.id === job.companyId);
            const resolvedLogo = company?.companyLogoUrl || company?.logo || job.companyLogo;
            const resolvedAvatar = worker.profilePhotoUrl || worker.avatar || '';

            return (
              <div 
                key={m.matchId}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:border-[#34D399]/30 transition-all flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    CONNECTED ON {new Date(m.matchedAt).toLocaleDateString('en-GB')}
                  </span>
                  <div className="flex gap-1.5">
                    {worker.verified && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-[#10B981] rounded text-[8px] font-mono font-bold uppercase">
                        CSCS GOLD VERIFIED
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Card Info */}
                <div className="p-4 flex gap-3">
                  {userType === 'employer' ? (
                    <>
                      {/* Employer views Candidate */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100 border">
                        <img 
                          src={resolvedAvatar} 
                          alt={worker.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1 flex-grow">
                        <h4 className="text-sm font-bold text-zinc-900 font-sans">{worker.name}</h4>
                        <p className="text-xs font-mono font-bold text-[#10B981] uppercase">{worker.trade}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                          <MapPin className="w-3 h-3" /> {worker.location}
                          <span>•</span>
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {worker.rating}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Candidate views Contractor Vacancy */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white border flex items-center justify-center p-1.5">
                        <img 
                          src={resolvedLogo} 
                          alt={job.companyName} 
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1 flex-grow">
                        <h4 className="text-sm font-bold text-zinc-900 font-sans">{job.title}</h4>
                        <p className="text-xs font-mono font-bold text-[#10B981] uppercase">{job.companyName}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                          <MapPin className="w-3 h-3" /> {job.location}
                          <span>•</span>
                          <Clock className="w-3 h-3" /> {job.duration}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Mini Chat bubble preview */}
                <div className="mx-4 p-2.5 bg-zinc-50 border border-zinc-100 rounded-lg text-xs flex gap-2 items-start">
                  <span className="text-[#34D399] text-xs font-black">💬</span>
                  <div className="space-y-0.5">
                    <p className="text-zinc-700 italic font-sans leading-relaxed line-clamp-1">"{m.lastMessageText}"</p>
                    <span className="text-[9px] font-mono text-zinc-400 block">{m.lastMessageTime}</span>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="p-4 pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      if (userType === 'employer') {
                        onSelectWorker(worker);
                      } else {
                        onSelectJob(job);
                      }
                    }}
                    className="flex-1 py-2 border border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-zinc-50 hover:bg-zinc-100 text-xs font-mono font-bold rounded-lg transition-all"
                  >
                    VIEW SPECS
                  </button>
                  <button
                    onClick={() => onNavigate('messages', m.matchId)}
                    className="flex-1 py-2 bg-[#34D399] hover:bg-[#10B981] text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> CHAT SITE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl space-y-4 max-w-md mx-auto">
          <div className="p-4 bg-emerald-50 rounded-full text-[#10B981] w-14 h-14 mx-auto flex items-center justify-center">
            <Heart className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold font-sans text-zinc-900">No Matched Connections Yet</h3>
            <p className="text-xs text-zinc-500 font-sans max-w-xs mx-auto">
              Matches happen when you swipe right on a card, and they swipe right on you. Hit the swipe desk and keep digging!
            </p>
          </div>
          <button
            onClick={() => onNavigate('swipe')}
            className="px-4 py-2 bg-zinc-900 hover:bg-[#34D399] text-white font-mono text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            LAUNCH SWIPE DECK
          </button>
        </div>
      )}

      {/* Shortlist Pending Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-white">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Your Shortlisted Pending Items</h4>
          <span className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-mono text-[#34D399] font-bold">2 SAVED</span>
        </div>
        <div className="divide-y divide-zinc-800">
          <div className="py-3 flex justify-between items-center">
            <div>
              <p className="text-xs font-sans font-bold text-zinc-100">Marcus Brickman</p>
              <p className="text-[10px] font-mono text-zinc-500 uppercase">Bricklayer • Manchester</p>
            </div>
            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Awaiting Response</span>
          </div>
          <div className="py-3 flex justify-between items-center">
            <div>
              <p className="text-xs font-sans font-bold text-zinc-100">Commercial Plumber & Pipefitter</p>
              <p className="text-[10px] font-mono text-zinc-500 uppercase">Vanguard Mechanical • Birmingham</p>
            </div>
            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Awaiting Response</span>
          </div>
        </div>
      </div>
    </div>
  );
}
