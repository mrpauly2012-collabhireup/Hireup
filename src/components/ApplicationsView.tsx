/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Eye,
  MapPin,
  MessageSquare,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  ApplicationStatus,
  CompanyProfile,
  JobApplication,
  JobProfile,
  UserType,
  WorkerProfile,
} from '../types';

interface ApplicationsViewProps {
  userType: UserType;
  applications: JobApplication[];
  jobs: JobProfile[];
  workers: WorkerProfile[];
  companies: CompanyProfile[];
  currentUserId: string;
  loading?: boolean;
  onUpdateStatus: (
    applicationId: string,
    status: ApplicationStatus
  ) => Promise<void> | void;
  onSelectJob: (job: JobProfile) => void;
  onSelectWorker: (worker: WorkerProfile) => void;
  onNavigate: (view: string) => void;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  viewed: 'Viewed',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offered: 'Offered',
  hired: 'Hired',
  rejected: 'Unsuccessful',
  withdrawn: 'Withdrawn',
};

const CONTRACTOR_STATUS_OPTIONS: ApplicationStatus[] = [
  'applied',
  'viewed',
  'shortlisted',
  'interview',
  'offered',
  'hired',
  'rejected',
];

const statusClasses: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-50 border-blue-200 text-blue-800',
  viewed: 'bg-violet-50 border-violet-200 text-violet-800',
  shortlisted: 'bg-amber-50 border-amber-200 text-amber-800',
  interview: 'bg-cyan-50 border-cyan-200 text-cyan-800',
  offered: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  hired: 'bg-green-100 border-green-300 text-green-900',
  rejected: 'bg-red-50 border-red-200 text-red-700',
  withdrawn: 'bg-zinc-100 border-zinc-200 text-zinc-600',
};

export default function ApplicationsView({
  userType,
  applications,
  jobs,
  workers,
  companies,
  currentUserId,
  loading = false,
  onUpdateStatus,
  onSelectJob,
  onSelectWorker,
  onNavigate,
}: ApplicationsViewProps) {
  const [activeFilter, setActiveFilter] = useState<
    ApplicationStatus | 'all'
  >('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const visibleApplications = useMemo(() => {
    const owned = applications.filter(application =>
      userType === 'worker'
        ? application.workerId === currentUserId
        : application.contractorId === currentUserId
    );

    if (activeFilter === 'all') return owned;
    return owned.filter(application => application.status === activeFilter);
  }, [applications, userType, currentUserId, activeFilter]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: 0 };
    applications
      .filter(application =>
        userType === 'worker'
          ? application.workerId === currentUserId
          : application.contractorId === currentUserId
      )
      .forEach(application => {
        result.all += 1;
        result[application.status] =
          (result[application.status] || 0) + 1;
      });

    return result;
  }, [applications, userType, currentUserId]);

  const changeStatus = async (
    applicationId: string,
    status: ApplicationStatus
  ) => {
    setUpdatingId(applicationId);
    try {
      await onUpdateStatus(applicationId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const filters: Array<ApplicationStatus | 'all'> =
    userType === 'worker'
      ? [
          'all',
          'applied',
          'viewed',
          'shortlisted',
          'interview',
          'offered',
          'hired',
          'rejected',
          'withdrawn',
        ]
      : [
          'all',
          'applied',
          'viewed',
          'shortlisted',
          'interview',
          'offered',
          'hired',
          'rejected',
        ];

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          {userType === 'worker' ? (
            <Briefcase className="w-5 h-5 text-[#10B981]" />
          ) : (
            <Users className="w-5 h-5 text-[#10B981]" />
          )}
          <h2 className="text-xl font-black text-zinc-950 uppercase tracking-wider">
            {userType === 'worker'
              ? 'My Applications'
              : 'Applicant Pipeline'}
          </h2>
        </div>
        <p className="text-xs text-zinc-600 mt-1">
          {userType === 'worker'
            ? 'Follow every job from application through to hiring.'
            : 'Review applicants and move them through your recruitment stages.'}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(filter => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl border text-[10px] font-mono font-black uppercase transition-all ${
              activeFilter === filter
                ? 'bg-[#34D399] border-[#34D399] text-zinc-950'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
            }`}
          >
            {filter === 'all' ? 'All' : STATUS_LABELS[filter]}
            <span className="ml-1.5 opacity-70">
              {counts[filter] || 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center text-sm text-zinc-600">
          Loading applications…
        </div>
      ) : visibleApplications.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#10B981] flex items-center justify-center mx-auto">
            {userType === 'worker' ? (
              <Briefcase className="w-7 h-7" />
            ) : (
              <UserCheck className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-base font-black text-zinc-950 mt-4">
            {userType === 'worker'
              ? 'No applications in this stage'
              : 'No applicants in this stage'}
          </h3>
          <p className="text-xs text-zinc-600 mt-1">
            {userType === 'worker'
              ? 'Apply to a job and it will appear here automatically.'
              : 'Applications will appear when workers apply to your vacancies.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('swipe')}
            className="mt-5 px-4 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-mono font-black uppercase"
          >
            {userType === 'worker' ? 'Find Jobs' : 'Find Workers'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleApplications.map(application => {
            const job = jobs.find(item => item.id === application.jobId);
            const worker = workers.find(
              item => item.id === application.workerId
            );
            const company = companies.find(
              item => item.id === application.contractorId
            );

            if (!job) return null;

            return (
              <article
                key={application.id}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {userType === 'worker' ? (
                      job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={job.companyName}
                          className="max-w-full max-h-full object-contain p-2"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Briefcase className="w-6 h-6 text-zinc-400" />
                      )
                    ) : worker?.profilePhotoUrl || worker?.avatar ? (
                      <img
                        src={worker.profilePhotoUrl || worker.avatar}
                        alt={worker.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-mono font-black text-[#10B981] uppercase">
                          {userType === 'worker'
                            ? job.companyName
                            : worker?.trade || 'Applicant'}
                        </p>
                        <h3 className="text-lg font-black text-zinc-950 mt-1">
                          {userType === 'worker'
                            ? job.title
                            : worker?.name || 'Worker applicant'}
                        </h3>
                        {userType === 'employer' && (
                          <p className="text-xs text-zinc-600 mt-1">
                            Applied for <b>{job.title}</b>
                          </p>
                        )}
                      </div>

                      <span
                        className={`px-3 py-1.5 rounded-full border text-[10px] font-mono font-black uppercase ${
                          statusClasses[application.status]
                        }`}
                      >
                        {STATUS_LABELS[application.status]}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-zinc-600">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {job.payRate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Applied{' '}
                        {new Date(application.appliedAt).toLocaleDateString(
                          'en-GB'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 p-4 bg-zinc-50 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      userType === 'worker'
                        ? onSelectJob(job)
                        : worker && onSelectWorker(worker)
                    }
                    className="flex-1 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-950 text-xs font-mono font-black uppercase flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {userType === 'worker' ? 'View Job' : 'View Worker'}
                  </button>

                  {userType === 'worker' ? (
                    application.status !== 'withdrawn' &&
                    !['hired', 'rejected'].includes(application.status) && (
                      <button
                        type="button"
                        disabled={updatingId === application.id}
                        onClick={() => {
                          if (
                            window.confirm(
                              'Withdraw this application? This cannot be undone from this page.'
                            )
                          ) {
                            changeStatus(application.id, 'withdrawn');
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-mono font-black uppercase flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        <X className="w-3.5 h-3.5" />
                        Withdraw
                      </button>
                    )
                  ) : (
                    <div className="flex-1 flex gap-2">
                      <select
                        value={application.status}
                        disabled={updatingId === application.id}
                        onChange={event =>
                          changeStatus(
                            application.id,
                            event.target.value as ApplicationStatus
                          )
                        }
                        className="flex-grow px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-950 text-xs font-bold outline-none focus:border-[#34D399]"
                      >
                        {CONTRACTOR_STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => onNavigate('messages')}
                        className="px-3 py-2.5 rounded-xl bg-[#34D399] text-zinc-950 flex items-center justify-center"
                        title="Open messages"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}