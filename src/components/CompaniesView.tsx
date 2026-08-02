/** 
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  MapPin,
  Users,
  Star,
  ChevronRight,
  Search,
  Globe,
  Sparkles,
  Bookmark,
  Briefcase,
  Clock,
  Wrench,
  Award,
  Truck,
  SlidersHorizontal,
  CheckCircle2,
  Building2,
  Eye,
} from 'lucide-react';
import {
  CompanyProfile,
  JobProfile,
  UserType,
  WorkerProfile,
} from '../types';
import {
  bestWorkerMatchAcrossJobs,
  scoreWorkerForJob,
} from '../lib/matching';

interface CompaniesViewProps {
  userType: UserType;
  currentUserId?: string;
  companies: CompanyProfile[];
  workers: WorkerProfile[];
  jobs: JobProfile[];
  onSelectJob: (job: JobProfile) => void;
  onSelectWorker: (worker: WorkerProfile) => void;
}

type AvailabilityFilter = 'all' | 'immediate' | 'week' | 'available';
type HiringFilter = 'all' | 'hiring' | 'not_hiring';

const normalise = (value?: string | null) => (value || '').trim().toLowerCase();

const safeWebsiteUrl = (website?: string) => {
  if (!website) return '';
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
};

const formatRating = (rating: number | null | undefined) =>
  rating === null || rating === undefined ? 'New' : Number(rating).toFixed(1);

export default function CompaniesView({
  userType,
  currentUserId,
  companies,
  workers,
  jobs,
  onSelectJob,
  onSelectWorker,
}: CompaniesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');
  const [hiringFilter, setHiringFilter] = useState<HiringFilter>('all');
  const [minimumRating, setMinimumRating] = useState('all');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);

  const loggedInWorker = workers.find(worker => worker.id === currentUserId);
  const loggedInCompany = companies.find(company => company.id === currentUserId);
  const contractorJobs = jobs.filter(job => job.companyId === currentUserId);

  const verifiedWorkers = useMemo(
    () => workers.filter(worker => worker.verified),
    [workers]
  );

  const verifiedCompanies = useMemo(
    () => companies.filter(company => company.verified),
    [companies]
  );

  const availableTrades = useMemo(() => {
    const source =
      userType === 'employer'
        ? verifiedWorkers.map(worker => worker.trade)
        : jobs.map(job => job.trade);

    return Array.from(new Set(source.filter(Boolean))).sort();
  }, [userType, verifiedWorkers, jobs]);

  const availableLocations = useMemo(() => {
    const source =
      userType === 'employer'
        ? verifiedWorkers.map(worker => worker.location)
        : verifiedCompanies.map(company => company.location);

    return Array.from(new Set(source.filter(Boolean))).sort();
  }, [userType, verifiedWorkers, verifiedCompanies]);

  const toggleSaved = (id: string) => {
    setSavedIds(current =>
      current.includes(id)
        ? current.filter(savedId => savedId !== id)
        : [...current, id]
    );
  };

  const workerMatch = (worker: WorkerProfile) =>
    bestWorkerMatchAcrossJobs(worker, contractorJobs);

  const companyMatch = (company: CompanyProfile) => {
    const companyJobs = jobs.filter(job => job.companyId === company.id);

    if (loggedInWorker && companyJobs.length > 0) {
      return companyJobs
        .map(job => scoreWorkerForJob(loggedInWorker, job))
        .sort((a, b) => b.score - a.score)[0];
    }

    const locationScore =
      loggedInWorker &&
      normalise(loggedInWorker.location) === normalise(company.location)
        ? 20
        : 5;
    const hiringScore = companyJobs.length > 0 ? 35 : 10;
    const verifiedScore = company.verified ? 20 : 0;
    const profileScore =
      (company.description ? 10 : 0) +
      ((company.companyGalleryImages || []).length > 0 ? 10 : 0) +
      ((company.requirements || []).length > 0 ? 5 : 0);

    const score = Math.min(
      99,
      locationScore + hiringScore + verifiedScore + profileScore
    );

    return {
      score,
      label:
        score >= 82
          ? 'Excellent Match'
          : score >= 68
          ? 'Strong Match'
          : score >= 50
          ? 'Good Match'
          : 'Weak Match',
      reasons: [
        companyJobs.length > 0
          ? `${companyJobs.length} active vacanc${companyJobs.length === 1 ? 'y' : 'ies'}`
          : 'No active vacancies currently',
        company.location
          ? `Based in ${company.location}`
          : 'Location not provided',
      ],
      strengths: company.verified ? ['Verified business'] : [],
      gaps: companyJobs.length === 0 ? ['No active roles currently'] : [],
      breakdown: {
        trade: 0,
        qualifications: 0,
        experience: 0,
        location: locationScore * 5,
        availability: companyJobs.length > 0 ? 80 : 20,
        pay: 50,
        verification: company.verified ? 100 : 0,
        profile: profileScore * 4,
      },
    };
  };

  const filteredWorkers = useMemo(() => {
    const query = normalise(searchQuery);

    return verifiedWorkers
      .filter(worker => {
        if (
          query &&
          ![
            worker.name,
            worker.trade,
            worker.subcategory,
            worker.location,
            worker.experience,
            ...(worker.qualifications || []),
            ...(worker.licences || []),
          ].some(value => normalise(value).includes(query))
        ) {
          return false;
        }

        if (tradeFilter !== 'all' && worker.trade !== tradeFilter) return false;
        if (locationFilter !== 'all' && worker.location !== locationFilter) {
          return false;
        }

        const availability = normalise(worker.availability);
        if (
          availabilityFilter === 'immediate' &&
          !availability.includes('immediate')
        ) {
          return false;
        }
        if (
          availabilityFilter === 'week' &&
          !availability.includes('week')
        ) {
          return false;
        }
        if (
          availabilityFilter === 'available' &&
          availability.includes('unavailable')
        ) {
          return false;
        }

        if (
          minimumRating !== 'all' &&
          Number(worker.rating || 0) < Number(minimumRating)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => workerMatch(b).score - workerMatch(a).score);
  }, [
    verifiedWorkers,
    searchQuery,
    tradeFilter,
    locationFilter,
    availabilityFilter,
    minimumRating,
    contractorJobs,
  ]);

  const filteredCompanies = useMemo(() => {
    const query = normalise(searchQuery);

    return verifiedCompanies
      .filter(company => {
        const companyJobs = jobs.filter(job => job.companyId === company.id);
        const companyTrades = companyJobs.map(job => job.trade);

        if (
          query &&
          ![
            company.name,
            company.location,
            company.description,
            company.industry,
            ...companyTrades,
          ].some(value => normalise(value).includes(query))
        ) {
          return false;
        }

        if (
          tradeFilter !== 'all' &&
          !companyJobs.some(job => job.trade === tradeFilter)
        ) {
          return false;
        }

        if (
          locationFilter !== 'all' &&
          company.location !== locationFilter
        ) {
          return false;
        }

        if (hiringFilter === 'hiring' && companyJobs.length === 0) return false;
        if (hiringFilter === 'not_hiring' && companyJobs.length > 0) {
          return false;
        }

        if (
          minimumRating !== 'all' &&
          Number(company.stats?.rating || 0) < Number(minimumRating)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => companyMatch(b).score - companyMatch(a).score);
  }, [
    verifiedCompanies,
    jobs,
    searchQuery,
    tradeFilter,
    locationFilter,
    hiringFilter,
    minimumRating,
    loggedInWorker,
  ]);

  const isContractorView = userType === 'employer';

  return (
    <div
      id="companies_view"
      className="space-y-6 pb-12 font-sans animate-fade-in"
    >
      <section className="bg-zinc-950 text-white rounded-2xl p-5 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isContractorView ? (
                <Wrench className="w-5 h-5 text-[#34D399]" />
              ) : (
                <Building2 className="w-5 h-5 text-[#34D399]" />
              )}
              <p className="text-[10px] font-mono font-black text-[#34D399] uppercase tracking-wider">
                Verified HireUp Network
              </p>
            </div>
            <h2 className="text-2xl md:text-3xl font-black mt-2">
              {isContractorView ? 'Verified Workers' : 'Verified Businesses'}
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              {isContractorView
                ? 'Discover approved tradespeople ranked against your active vacancies.'
                : 'Discover approved contractors, live vacancies and employers matched to your worker profile.'}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-48">
            <p className="text-[9px] font-mono uppercase text-zinc-400">
              Verified profiles
            </p>
            <p className="text-3xl font-black mt-1">
              {isContractorView
                ? verifiedWorkers.length
                : verifiedCompanies.length}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#10B981]" />
          <p className="text-[10px] font-mono font-black uppercase text-zinc-500">
            Search and filters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder={
                isContractorView
                  ? 'Search trade, skill, licence or location...'
                  : 'Search company, trade or location...'
              }
              className="w-full pl-9 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-[#34D399]"
            />
          </div>

          <select
            value={tradeFilter}
            onChange={event => setTradeFilter(event.target.value)}
            className="px-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold"
          >
            <option value="all">All trades</option>
            {availableTrades.map(trade => (
              <option key={trade} value={trade}>
                {trade}
              </option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={event => setLocationFilter(event.target.value)}
            className="px-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold"
          >
            <option value="all">All locations</option>
            {availableLocations.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          <select
            value={minimumRating}
            onChange={event => setMinimumRating(event.target.value)}
            className="px-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold"
          >
            <option value="all">Any rating</option>
            <option value="4">4.0+ rating</option>
            <option value="4.5">4.5+ rating</option>
            <option value="4.8">4.8+ rating</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {isContractorView ? (
            <>
              {[
                ['all', 'All availability'],
                ['immediate', 'Immediate'],
                ['week', 'Available soon'],
                ['available', 'Available workers'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setAvailabilityFilter(value as AvailabilityFilter)
                  }
                  className={`px-3 py-2 rounded-lg text-[10px] font-mono font-black uppercase border ${
                    availabilityFilter === value
                      ? 'bg-[#34D399] border-[#34D399] text-zinc-950'
                      : 'bg-white border-zinc-200 text-zinc-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                ['all', 'All businesses'],
                ['hiring', 'Hiring now'],
                ['not_hiring', 'No open roles'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setHiringFilter(value as HiringFilter)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-mono font-black uppercase border ${
                    hiringFilter === value
                      ? 'bg-[#34D399] border-[#34D399] text-zinc-950'
                      : 'bg-white border-zinc-200 text-zinc-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </>
          )}
        </div>
      </section>

      {isContractorView ? (
        <section className="space-y-4">
          {filteredWorkers.length === 0 ? (
            <div className="bg-white border border-zinc-200 border-dashed rounded-2xl p-10 text-center">
              <Users className="w-8 h-8 text-zinc-300 mx-auto" />
              <h3 className="font-black mt-3">No verified workers found</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Try clearing or widening your filters.
              </p>
            </div>
          ) : (
            filteredWorkers.map(worker => {
              const match = workerMatch(worker);
              const isSaved = savedIds.includes(worker.id);

              return (
                <article
                  key={worker.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-[#34D399] transition-all"
                >
                  <div className="flex flex-col lg:flex-row gap-5">
                    <div className="flex gap-4 flex-1 min-w-0">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 flex-shrink-0">
                        <img
                          src={worker.profilePhotoUrl || worker.avatar}
                          alt={worker.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black truncate">
                            {worker.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-mono font-black uppercase">
                            <ShieldCheck className="w-3 h-3" />
                            Verified worker
                          </span>
                          {normalise(worker.availability).includes(
                            'immediate'
                          ) && (
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-[9px] font-mono font-black uppercase">
                              Available now
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-[#10B981] mt-1">
                          {worker.trade}
                          {worker.subcategory ? ` · ${worker.subcategory}` : ''}
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {worker.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {worker.experience}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            {formatRating(worker.rating)}
                          </span>
                          <span className="font-mono font-black text-zinc-800">
                            {worker.payRate}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {[...(worker.qualifications || []), ...(worker.licences || [])]
                            .slice(0, 5)
                            .map(item => (
                              <span
                                key={item}
                                className="px-2 py-1 bg-zinc-100 border border-zinc-200 rounded-lg text-[9px] font-mono font-bold text-zinc-600"
                              >
                                {item}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-72 bg-zinc-950 text-white rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-mono uppercase text-[#34D399]">
                            HireUp AI match
                          </p>
                          <p className="text-3xl font-black mt-1">
                            {match.score}%
                          </p>
                          <p className="text-xs font-bold text-zinc-300">
                            {match.label}
                          </p>
                        </div>
                        <Sparkles className="w-6 h-6 text-[#34D399]" />
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-3">
                        {match.reasons[0] ||
                          'Ranked against your active vacancies.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        {(worker.toolsAndTransport || []).slice(0, 2).join(' · ') ||
                          'Transport not listed'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {worker.reviewsCount} reviews
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSaved(worker.id)}
                        className={`px-3 py-2 rounded-xl border text-[10px] font-mono font-black uppercase flex items-center gap-1 ${
                          isSaved
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-zinc-200 text-zinc-600'
                        }`}
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            isSaved ? 'fill-current' : ''
                          }`}
                        />
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectWorker(worker)}
                        className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-[10px] font-mono font-black uppercase flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View profile
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      ) : (
        <section className="space-y-5">
          {filteredCompanies.length === 0 ? (
            <div className="bg-white border border-zinc-200 border-dashed rounded-2xl p-10 text-center">
              <Building2 className="w-8 h-8 text-zinc-300 mx-auto" />
              <h3 className="font-black mt-3">No verified businesses found</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Try clearing or widening your filters.
              </p>
            </div>
          ) : (
            filteredCompanies.map(company => {
              const companyVacancies = jobs.filter(
                job => job.companyId === company.id
              );
              const match = companyMatch(company);
              const isSaved = savedIds.includes(company.id);
              const isExpanded = expandedCompanyId === company.id;
              const hiringTrades = Array.from(
                new Set(companyVacancies.map(job => job.trade))
              );
              const payRates = companyVacancies
                .map(job => job.payRate)
                .filter(Boolean)
                .slice(0, 3);
              const topReview = (company.reviews || [])[0];

              return (
                <article
                  key={company.id}
                  className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-[#34D399] transition-all"
                >
                  <div className="relative h-32 bg-zinc-950">
                    <img
                      src={company.coverImage}
                      alt={company.name}
                      className="w-full h-full object-cover opacity-55"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />

                    <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-2">
                      <span className="px-2.5 py-1 bg-zinc-950/85 text-[#34D399] border border-[#34D399]/30 rounded-full text-[9px] font-mono font-black uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Verified business
                      </span>
                      {companyVacancies.length > 0 && (
                        <span className="px-2.5 py-1 bg-amber-400 text-zinc-950 rounded-full text-[9px] font-mono font-black uppercase">
                          Hiring now
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 px-3 py-2 bg-zinc-950/90 text-white rounded-xl">
                      <p className="text-[8px] font-mono text-[#34D399] uppercase">
                        AI company match
                      </p>
                      <p className="text-xl font-black">{match.score}%</p>
                    </div>
                  </div>

                  <div className="p-5 relative">
                    <div className="absolute -top-10 left-5 border-4 border-white rounded-2xl overflow-hidden w-20 h-20 bg-white shadow-sm flex items-center justify-center p-2">
                      <img
                        src={company.companyLogoUrl || company.logo}
                        alt={company.name}
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="pt-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                      <div className="space-y-4 min-w-0">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black">
                              {company.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-mono font-black uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                            {companyVacancies.length >= 3 && (
                              <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-[9px] font-mono font-black uppercase">
                                Top employer
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {company.location || 'Location not listed'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {company.companySize || `${company.stats?.workers || 0} staff`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                              {formatRating(company.stats?.rating)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-zinc-600 leading-relaxed">
                          {company.description}
                        </p>

                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#10B981]" />
                            <p className="text-[10px] font-mono font-black text-emerald-700 uppercase">
                              Why HireUp recommends this business
                            </p>
                          </div>
                          <p className="text-xs text-emerald-800 mt-2">
                            {match.reasons[0] || match.label}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                            <p className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                              Hiring trades
                            </p>
                            <p className="text-xs font-bold mt-1">
                              {hiringTrades.slice(0, 3).join(', ') ||
                                'No active roles'}
                            </p>
                          </div>
                          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                            <p className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                              Typical rates
                            </p>
                            <p className="text-xs font-bold mt-1">
                              {payRates.join(', ') || 'Not currently listed'}
                            </p>
                          </div>
                          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                            <p className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                              Active vacancies
                            </p>
                            <p className="text-xs font-bold mt-1">
                              {companyVacancies.length} open
                            </p>
                          </div>
                        </div>
                      </div>

                      <aside className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[8px] font-mono font-black text-zinc-400 uppercase">
                              Projects
                            </p>
                            <p className="font-black mt-1">
                              {company.stats?.projects || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] font-mono font-black text-zinc-400 uppercase">
                              Staff
                            </p>
                            <p className="font-black mt-1">
                              {company.stats?.workers || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] font-mono font-black text-zinc-400 uppercase">
                              Rating
                            </p>
                            <p className="font-black mt-1">
                              {formatRating(company.stats?.rating)}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-zinc-200 pt-3 space-y-2">
                          <p className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                            Compliance
                          </p>
                          <p className="text-xs">
                            Companies House:{' '}
                            <strong>
                              {company.companyHouseNumber || 'Not provided'}
                            </strong>
                          </p>
                          <p className="text-xs">
                            VAT:{' '}
                            <strong>
                              {company.vatNumber || 'Not registered'}
                            </strong>
                          </p>
                          <p className="text-xs text-emerald-700">
                            Insurance:{' '}
                            <strong>
                              {company.insuranceStatus ||
                                company.publicLiabilityInsurance ||
                                'Verified'}
                            </strong>
                          </p>
                        </div>

                        {topReview && (
                          <div className="border-t border-zinc-200 pt-3">
                            <p className="text-[9px] font-mono font-black text-zinc-400 uppercase">
                              Worker review
                            </p>
                            <p className="text-xs text-zinc-600 italic mt-1 line-clamp-3">
                              “{topReview.text}”
                            </p>
                            <p className="text-[10px] font-bold mt-2">
                              {topReview.reviewer}
                            </p>
                          </div>
                        )}
                      </aside>
                    </div>

                    {(company.companyGalleryImages || []).length > 0 && (
                      <div className="mt-5 pt-5 border-t border-zinc-100">
                        <p className="text-[10px] font-mono font-black text-zinc-400 uppercase mb-3">
                          Recent projects
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {(company.companyGalleryImages || [])
                            .slice(0, 4)
                            .map((imageUrl, index) => (
                              <div
                                key={`${company.id}-${index}`}
                                className="h-28 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`${company.name} project ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {isExpanded && companyVacancies.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-zinc-100">
                        <p className="text-[10px] font-mono font-black text-zinc-400 uppercase mb-3">
                          Available vacancies
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {companyVacancies.map(vacancy => (
                            <button
                              type="button"
                              key={vacancy.id}
                              onClick={() => onSelectJob(vacancy)}
                              className="p-4 bg-zinc-50 border border-zinc-200 hover:border-[#34D399] rounded-xl text-left flex items-center justify-between gap-3"
                            >
                              <div>
                                <p className="text-sm font-black">
                                  {vacancy.title}
                                </p>
                                <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1">
                                  {vacancy.trade} · {vacancy.location} ·{' '}
                                  {vacancy.payRate}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#10B981]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {company.website && (
                          <a
                            href={safeWebsiteUrl(company.website)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 border border-zinc-200 rounded-xl text-[10px] font-mono font-black uppercase flex items-center gap-1"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Website
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleSaved(company.id)}
                          className={`px-3 py-2 rounded-xl border text-[10px] font-mono font-black uppercase flex items-center gap-1 ${
                            isSaved
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-zinc-200 text-zinc-600'
                          }`}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isSaved ? 'fill-current' : ''
                            }`}
                          />
                          {isSaved ? 'Saved' : 'Save business'}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCompanyId(isExpanded ? null : company.id)
                        }
                        disabled={companyVacancies.length === 0}
                        className="px-4 py-2 bg-zinc-950 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-1"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        {companyVacancies.length === 0
                          ? 'No open jobs'
                          : isExpanded
                          ? 'Hide open jobs'
                          : `View ${companyVacancies.length} open job${
                              companyVacancies.length === 1 ? '' : 's'
                            }`}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}
    </div>
  );
}