/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Heart,
  MessageSquare,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Building
} from 'lucide-react';
import {
  WorkerProfile,
  JobProfile,
  Match,
  UserType,
  CompanyProfile
} from '../types';

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
  companies = [],
  onNavigate,
  onSelectWorker,
  onSelectJob
}: MatchesViewProps) {
  const resolvedMatches = matches
    .map(match => {
      const worker = workers.find(workerItem => workerItem.id === match.workerId);
      const job = match.jobId
        ? jobs.find(jobItem => jobItem.id === match.jobId)
        : undefined;

      const contractorId = match.contractorId || job?.companyId || '';
      const company = companies.find(companyItem => companyItem.id === contractorId);

      return {
        matchId: match.id,
        worker,
        job,
        company,
        contractorId,
        matchedAt: match.matchedAt,
        lastMessageText:
          match.lastMessageText ||
          'You matched! Say hello and discuss availability and site details.',
        lastMessageTime: match.lastMessageTime || 'Just now'
      };
    })
    .filter(match => match.worker && (match.job || match.company));

  return (
    <div
      id="matches_view"
      className="space-y-6 pb-12 font-sans animate-fade-in"
    >
      <div>
        <h2 className="text-xl font-bold text-zinc-900 font-sans uppercase tracking-wider flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#34D399] fill-current" />
          Matched Connections
        </h2>

        <p className="text-xs text-zinc-500 font-sans">
          {userType === 'employer'
            ? 'Workers who have shown mutual interest in your company or active vacancies.'
            : 'Contractors interested in your digital CV. Chat with site managers immediately.'}
        </p>
      </div>

      {resolvedMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resolvedMatches.map(match => {
            const worker = match.worker!;
            const job = match.job;
            const company = match.company;

            const contractorName =
              company?.name || job?.companyName || 'Matched Contractor';

            const contractorLogo =
              company?.companyLogoUrl ||
              company?.logo ||
              job?.companyLogo ||
              '';

            const contractorLocation =
              job?.location || company?.location || 'United Kingdom';

            const opportunityTitle =
              job?.title || `${contractorName} Trade Opportunity`;

            const opportunityDuration =
              job?.duration || 'Direct company connection';

            const workerAvatar =
              worker.profilePhotoUrl || worker.avatar || '';

            return (
              <div
                key={match.matchId}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:border-[#34D399]/30 transition-all flex flex-col justify-between"
              >
                <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    CONNECTED ON{' '}
                    {new Date(match.matchedAt).toLocaleDateString('en-GB')}
                  </span>

                  <div className="flex gap-1.5">
                    {worker.verified && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-[#10B981] rounded text-[8px] font-mono font-bold uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        VERIFIED
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex gap-3">
                  {userType === 'employer' ? (
                    <>
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100 border">
                        {workerAvatar ? (
                          <img
                            src={workerAvatar}
                            alt={worker.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <Heart className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 flex-grow">
                        <h4 className="text-sm font-bold text-zinc-900 font-sans">
                          {worker.name}
                        </h4>

                        <p className="text-xs font-mono font-bold text-[#10B981] uppercase">
                          {worker.trade}
                        </p>

                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                          <MapPin className="w-3 h-3" />
                          {worker.location}
                          <span>•</span>
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {worker.rating ?? 'New'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white border flex items-center justify-center p-1.5">
                        {contractorLogo ? (
                          <img
                            src={contractorLogo}
                            alt={contractorName}
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Building className="w-6 h-6 text-zinc-400" />
                        )}
                      </div>

                      <div className="space-y-1 flex-grow">
                        <h4 className="text-sm font-bold text-zinc-900 font-sans">
                          {opportunityTitle}
                        </h4>

                        <p className="text-xs font-mono font-bold text-[#10B981] uppercase">
                          {contractorName}
                        </p>

                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                          <MapPin className="w-3 h-3" />
                          {contractorLocation}
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          {opportunityDuration}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mx-4 p-2.5 bg-zinc-50 border border-zinc-100 rounded-lg text-xs flex gap-2 items-start">
                  <span className="text-[#34D399] text-xs font-black">💬</span>

                  <div className="space-y-0.5 min-w-0">
                    <p className="text-zinc-700 italic font-sans leading-relaxed line-clamp-1">
                      “{match.lastMessageText}”
                    </p>

                    <span className="text-[9px] font-mono text-zinc-400 block">
                      {match.lastMessageTime}
                    </span>
                  </div>
                </div>

                <div className="p-4 pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      if (userType === 'employer') {
                        onSelectWorker(worker);
                      } else if (job) {
                        onSelectJob(job);
                      } else {
                        onNavigate('companies');
                      }
                    }}
                    className="flex-1 py-2 border border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-zinc-50 hover:bg-zinc-100 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer"
                  >
                    {userType === 'employer'
                      ? 'VIEW PROFILE'
                      : job
                        ? 'VIEW JOB'
                        : 'VIEW COMPANY'}
                  </button>

                  <button
                    onClick={() => onNavigate('messages', match.matchId)}
                    className="flex-1 py-2 bg-[#34D399] hover:bg-[#10B981] text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    OPEN CHAT
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
            <h3 className="text-base font-bold font-sans text-zinc-900">
              No Matched Connections Yet
            </h3>

            <p className="text-xs text-zinc-500 font-sans max-w-xs mx-auto">
              A connection appears here as soon as a worker and contractor both
              show interest in each other.
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
    </div>
  );
}