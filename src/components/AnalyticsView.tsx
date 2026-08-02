/** 
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Sparkles,
  Eye,
  Heart,
  Calendar,
  Briefcase,
  Users,
  Target,
} from 'lucide-react';
import {
  CompanyProfile,
  Interview,
  JobProfile,
  Match,
  UserType,
  WorkerProfile,
} from '../types';
import {
  bestWorkerMatchAcrossJobs,
  calculateProfileStrength,
  rankJobsForWorker,
} from '../lib/matching';

interface AnalyticsViewProps {
  userType: UserType;
  currentUserId?: string;
  workers: WorkerProfile[];
  jobs: JobProfile[];
  matches: Match[];
  interviews: Interview[];
  companies: CompanyProfile[];
}

export default function AnalyticsView({
  userType,
  currentUserId,
  workers,
  jobs,
  matches,
  interviews,
  companies,
}: AnalyticsViewProps) {
  const [regionFilter, setRegionFilter] =
    useState<'London' | 'Midlands' | 'North'>('London');

  const worker = workers.find(item => item.id === currentUserId);
  const company = companies.find(item => item.id === currentUserId);
  const companyJobs = jobs.filter(job => job.companyId === currentUserId);

  const workerMatches = matches.filter(match => match.workerId === currentUserId);
  const companyMatches = matches.filter(match => {
    const job = jobs.find(item => item.id === match.jobId);
    return match.contractorId === currentUserId || job?.companyId === currentUserId;
  });

  const workerInterviews = interviews.filter(item => item.workerId === currentUserId);
  const companyInterviews = interviews.filter(item =>
    companyJobs.some(job => job.id === item.jobId)
  );

  const profileStrength = worker ? calculateProfileStrength(worker).score : 0;
  const bestWorkerScore = worker
    ? rankJobsForWorker(worker, jobs)[0]?.match.score || 0
    : 0;

  const shortlistRate =
    userType === 'worker'
      ? Math.min(100, Math.round((workerMatches.length / Math.max(1, jobs.length)) * 100))
      : Math.min(100, Math.round((companyMatches.length / Math.max(1, workers.length)) * 100));

  const interviewConversion =
    userType === 'worker'
      ? Math.round((workerInterviews.length / Math.max(1, workerMatches.length)) * 100)
      : Math.round((companyInterviews.length / Math.max(1, companyMatches.length)) * 100);

  const performanceCards =
    userType === 'worker'
      ? [
          ['Profile strength', profileStrength, Eye],
          ['Best match', bestWorkerScore, Target],
          ['Match rate', shortlistRate, Heart],
          ['Interview conversion', interviewConversion, Calendar],
        ]
      : [
          ['Live jobs', companyJobs.length, Briefcase],
          ['Candidate matches', companyMatches.length, Users],
          ['Match rate', shortlistRate, Heart],
          ['Interview conversion', interviewConversion, Calendar],
        ];

  const jobPerformance = useMemo(
    () =>
      companyJobs.map(job => {
        const jobMatches = matches.filter(match => match.jobId === job.id);
        const jobInterviews = interviews.filter(interview => interview.jobId === job.id);
        return {
          name: job.title.length > 18 ? `${job.title.slice(0, 18)}…` : job.title,
          matches: jobMatches.length,
          interviews: jobInterviews.length,
          score: Math.min(100, 35 + jobMatches.length * 12 + jobInterviews.length * 18),
        };
      }),
    [companyJobs, matches, interviews]
  );

  const recommendationData = useMemo(() => {
    if (userType === 'worker' && worker) {
      return rankJobsForWorker(worker, jobs)
        .slice(0, 6)
        .map(result => ({
          name: result.item.title.length > 15
            ? `${result.item.title.slice(0, 15)}…`
            : result.item.title,
          score: result.match.score,
        }));
    }

    return workers
      .map(item => ({
        name: item.name.length > 15 ? `${item.name.slice(0, 15)}…` : item.name,
        score: bestWorkerMatchAcrossJobs(item, companyJobs).score,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [userType, worker, jobs, workers, companyJobs]);

  const regionalRateAverages = {
    London: [
      { name: 'Jan', rate: 220 },
      { name: 'Feb', rate: 225 },
      { name: 'Mar', rate: 230 },
      { name: 'Apr', rate: 235 },
      { name: 'May', rate: 245 },
      { name: 'Jun', rate: 250 },
    ],
    Midlands: [
      { name: 'Jan', rate: 195 },
      { name: 'Feb', rate: 200 },
      { name: 'Mar', rate: 205 },
      { name: 'Apr', rate: 202 },
      { name: 'May', rate: 210 },
      { name: 'Jun', rate: 215 },
    ],
    North: [
      { name: 'Jan', rate: 180 },
      { name: 'Feb', rate: 185 },
      { name: 'Mar', rate: 190 },
      { name: 'Apr', rate: 195 },
      { name: 'May', rate: 198 },
      { name: 'Jun', rate: 205 },
    ],
  };

  return (
    <div id="analytics_view" className="space-y-6 pb-12 font-sans animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#10B981]" />
          {userType === 'worker' ? 'Worker performance intelligence' : 'Contractor performance intelligence'}
        </h2>
        <p className="text-xs text-zinc-500">
          Live HireUp performance, AI matching quality and recruitment conversion.
        </p>
      </div>

      <div className="bg-zinc-950 text-white rounded-2xl p-5 flex gap-4">
        <Sparkles className="w-6 h-6 text-[#34D399] flex-shrink-0" />
        <div>
          <p className="text-[10px] font-mono font-black text-[#34D399] uppercase">
            HireUp AI insight
          </p>
          <p className="text-sm mt-1">
            {userType === 'worker'
              ? profileStrength < 70
                ? 'Completing qualifications, licences and work history should noticeably improve your future match scores.'
                : `Your profile is performing strongly. Your current best opportunity is a ${bestWorkerScore}% match.`
              : companyJobs.length === 0
              ? 'Post a detailed vacancy to unlock candidate scoring and job-performance analytics.'
              : `${companyJobs.length} live job${companyJobs.length === 1 ? '' : 's'} generated ${companyMatches.length} candidate match${companyMatches.length === 1 ? '' : 'es'}.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {performanceCards.map(([label, value, Icon]: any) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-xl p-4">
            <Icon className="w-5 h-5 text-[#10B981]" />
            <p className="text-2xl font-black mt-3">{value}{typeof value === 'number' && String(label).includes('rate') || String(label).includes('conversion') || String(label).includes('strength') || String(label).includes('match') ? '%' : ''}</p>
            <p className="text-[9px] font-mono font-black text-zinc-500 uppercase mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <h3 className="text-sm font-black">
          {userType === 'worker' ? 'Top AI job matches' : 'Top AI candidate matches'}
        </h3>
        <p className="text-xs text-zinc-500 mt-1">Highest-scoring current recommendations</p>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recommendationData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="score" fill="#34D399" radius={[5, 5, 0, 0]} name="AI Match %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {userType === 'employer' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <h3 className="text-sm font-black">Job performance</h3>
          <p className="text-xs text-zinc-500 mt-1">Matches, interviews and overall vacancy performance</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="matches" fill="#27272a" name="Matches" />
                <Bar dataKey="interviews" fill="#34D399" name="Interviews" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">Trade day-rate benchmarks</h3>
            <p className="text-xs text-zinc-500">Reference rates for the selected UK region</p>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-lg">
            {(['London', 'Midlands', 'North'] as const).map(region => (
              <button
                key={region}
                onClick={() => setRegionFilter(region)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md ${
                  regionFilter === region ? 'bg-[#34D399] text-white' : 'text-zinc-600'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={regionalRateAverages[regionFilter]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} unit="£" />
              <Tooltip />
              <Area type="monotone" dataKey="rate" stroke="#34D399" fill="#34D399" fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}