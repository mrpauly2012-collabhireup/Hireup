/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, MapPin, Award, Wrench, Briefcase,
  Star, ShieldCheck, Clock, Check, ChevronRight, X, Heart, ArrowUpDown, Sparkles
} from 'lucide-react';
import { WorkerProfile, JobProfile, UserType } from '../types';
import {
  bestWorkerMatchAcrossJobs,
  rankJobsForWorker,
  scoreWorkerForJob,
  scoreJobAgainstNaturalLanguage,
  scoreWorkerAgainstNaturalLanguage,
} from '../lib/matching';
import SearchableDropdown from './SearchableDropdown';
import { HOMETOWNS, LICENCES, POSITION_LENGTHS, GRADES, REQUIREMENTS, TRADES_CATEGORIES, TRADE_SUBCATEGORIES_MAP } from '../data/datasets';

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

interface SearchViewProps {
  userType: UserType;
  workers: WorkerProfile[];
  jobs: JobProfile[];
  currentUser?: { id: string; email: string; userType: UserType } | null;
  onSelectWorker: (worker: WorkerProfile) => void;
  onSelectJob: (job: JobProfile) => void;
  onNavigate: (view: string) => void;
}

export default function SearchView({
  userType,
  workers,
  jobs,
  currentUser,
  onSelectWorker,
  onSelectJob,
  onNavigate
}: SearchViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [cscsTier, setCscsTier] = useState<string | null>(null);
  const [minimumRate, setMinimumRate] = useState<number>(0);
  const [maximumRate, setMaximumRate] = useState<number>(500);
  const [requireVerified, setRequireVerified] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<
    'relevance' | 'rate-high' | 'rate-low' | 'rating-high' | 'name'
  >('relevance');

  // New Search & Filter States using the master datasets
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
  const [selectedLicences, setSelectedLicences] = useState<string[]>([]);
  const [selectedHometown, setSelectedHometown] = useState<string>('');
  const [selectedPositionLengths, setSelectedPositionLengths] = useState<string[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [showAllWorkerTrades, setShowAllWorkerTrades] = useState(false);

  const loggedInWorker =
    userType === 'worker'
      ? workers.find(worker => worker.id === currentUser?.id)
      : undefined;

  const contractorJobs =
    userType === 'employer' && currentUser
      ? jobs.filter(job => job.companyId === currentUser.id)
      : [];

  // Contractors can browse all trades. Workers only filter within their own category.
  const trades =
    userType === 'worker' && loggedInWorker?.trade
      ? [loggedInWorker.trade]
      : TRADES_CATEGORIES;

  const extractRate = (payRate: string): number => {
    const values = payRate.match(/\d+(?:\.\d+)?/g);
    if (!values || values.length === 0) return 0;
    return Math.max(...values.map(value => Number(value)));
  };

  const normalise = (value: string | undefined | null) =>
    (value || '').trim().toLowerCase();

  const includesQuery = (fields: Array<string | undefined | null>) => {
    const query = normalise(searchQuery);
    if (!query) return true;
    return fields.some(field => normalise(field).includes(query));
  };

  // Live filter logic
  const filteredWorkers = workers.filter(worker => {
    if (
      userType === 'employer' &&
      !showAllWorkerTrades &&
      contractorJobs.length > 0 &&
      !contractorJobs.some(job =>
        isSameTradeCategory(worker.trade, job.trade)
      )
    ) {
      return false;
    }

    if (
      !includesQuery([
        worker.name,
        worker.trade,
        worker.subcategory,
        worker.location,
        worker.about,
        worker.experience,
        ...(worker.qualifications || []),
        ...(worker.licences || []),
        ...(worker.verifiedBadges || []),
        ...(worker.toolsAndTransport || [])
      ])
    ) {
      return false;
    }

    if (selectedTrade && normalise(worker.trade) !== normalise(selectedTrade)) {
      return false;
    }

    if (
      selectedSubcategory &&
      normalise(worker.subcategory) !== normalise(selectedSubcategory)
    ) {
      return false;
    }

    if (
      cscsTier &&
      !(worker.qualifications || []).some(qualification =>
        normalise(qualification).includes(normalise(cscsTier))
      )
    ) {
      return false;
    }

    if (requireVerified && !worker.verified) {
      return false;
    }

    const rate = extractRate(worker.payRate);
    if (rate < minimumRate || rate > maximumRate) {
      return false;
    }

    if (
      selectedHometown &&
      !normalise(worker.location).includes(normalise(selectedHometown))
    ) {
      return false;
    }

    if (
      selectedAvailability &&
      !normalise(worker.availability).includes(normalise(selectedAvailability))
    ) {
      return false;
    }

    if (selectedQualifications.length > 0) {
      const workerQualifications = worker.qualifications || [];
      const hasEveryQualification = selectedQualifications.every(selected =>
        workerQualifications.some(qualification =>
          normalise(qualification).includes(normalise(selected)) ||
          normalise(selected).includes(normalise(qualification))
        )
      );

      if (!hasEveryQualification) return false;
    }

    if (selectedLicences.length > 0) {
      const credentials = [
        ...(worker.licences || []),
        ...(worker.verifiedBadges || []),
        ...(worker.qualifications || [])
      ];

      const hasEveryLicence = selectedLicences.every(selected =>
        credentials.some(credential =>
          normalise(credential).includes(normalise(selected)) ||
          normalise(selected).includes(normalise(credential))
        )
      );

      if (!hasEveryLicence) return false;
    }

    if (selectedPositionLengths.length > 0) {
      const preferences = worker.positionLengths || [];
      const hasPreference = selectedPositionLengths.some(selected =>
        preferences.some(preference =>
          normalise(preference).includes(normalise(selected)) ||
          normalise(selected).includes(normalise(preference))
        )
      );

      if (!hasPreference) return false;
    }

    if (selectedRequirements.length > 0) {
      const workerCapabilities = [
        ...(worker.qualifications || []),
        ...(worker.licences || []),
        ...(worker.toolsAndTransport || []),
        ...(worker.verifiedBadges || [])
      ];

      const meetsEveryRequirement = selectedRequirements.every(selected =>
        workerCapabilities.some(capability =>
          normalise(capability).includes(normalise(selected)) ||
          normalise(selected).includes(normalise(capability))
        )
      );

      if (!meetsEveryRequirement) return false;
    }

    return true;
  });

  const filteredJobs = jobs.filter(job => {
    if (
      userType === 'worker' &&
      (!loggedInWorker?.trade ||
        !isSameTradeCategory(loggedInWorker.trade, job.trade))
    ) {
      return false;
    }

    if (
      !includesQuery([
        job.title,
        job.companyName,
        job.trade,
        job.subcategory,
        job.location,
        job.description,
        job.duration,
        job.employmentType,
        ...(job.qualifications || []),
        ...(job.requirements || []),
        ...(job.benefits || [])
      ])
    ) {
      return false;
    }

    if (selectedTrade && normalise(job.trade) !== normalise(selectedTrade)) {
      return false;
    }

    if (
      selectedSubcategory &&
      normalise(job.subcategory) !== normalise(selectedSubcategory)
    ) {
      return false;
    }

    if (
      cscsTier &&
      !(job.qualifications || []).some(qualification =>
        normalise(qualification).includes(normalise(cscsTier))
      )
    ) {
      return false;
    }

    if (requireVerified && !job.verified) {
      return false;
    }

    const rate = extractRate(job.payRate);
    if (rate < minimumRate || rate > maximumRate) {
      return false;
    }

    if (
      selectedHometown &&
      !normalise(job.location).includes(normalise(selectedHometown))
    ) {
      return false;
    }

    if (selectedQualifications.length > 0) {
      const jobQualifications = job.qualifications || [];
      const hasEveryQualification = selectedQualifications.every(selected =>
        jobQualifications.some(qualification =>
          normalise(qualification).includes(normalise(selected)) ||
          normalise(selected).includes(normalise(qualification))
        )
      );

      if (!hasEveryQualification) return false;
    }

    if (selectedLicences.length > 0) {
      const requiredCredentials = [
        ...(job.qualifications || []),
        ...(job.requirements || [])
      ];

      const hasEveryLicence = selectedLicences.every(selected =>
        requiredCredentials.some(credential =>
          normalise(credential).includes(normalise(selected)) ||
          normalise(selected).includes(normalise(credential))
        )
      );

      if (!hasEveryLicence) return false;
    }

    if (selectedPositionLengths.length > 0) {
      const hasPositionMatch = selectedPositionLengths.some(selected =>
        normalise(job.employmentType).includes(normalise(selected)) ||
        normalise(job.duration).includes(normalise(selected))
      );

      if (!hasPositionMatch) return false;
    }

    return true;
  });

  const sortWorkers = (items: WorkerProfile[]) => {
    const sorted = [...items];

    if (sortOrder === 'rate-high') {
      return sorted.sort((a, b) => extractRate(b.payRate) - extractRate(a.payRate));
    }

    if (sortOrder === 'rate-low') {
      return sorted.sort((a, b) => extractRate(a.payRate) - extractRate(b.payRate));
    }

    if (sortOrder === 'rating-high') {
      return sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    if (sortOrder === 'name') {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  };

  const sortJobs = (items: JobProfile[]) => {
    const sorted = [...items];

    if (sortOrder === 'rate-high') {
      return sorted.sort((a, b) => extractRate(b.payRate) - extractRate(a.payRate));
    }

    if (sortOrder === 'rate-low') {
      return sorted.sort((a, b) => extractRate(a.payRate) - extractRate(b.payRate));
    }

    if (sortOrder === 'rating-high') {
      return sorted.sort(
        (a, b) =>
          Number(b.companyStats?.rating || 0) -
          Number(a.companyStats?.rating || 0)
      );
    }

    if (sortOrder === 'name') {
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  };

  const sortedWorkers =
    aiQuery.trim() && userType === 'employer'
      ? [...filteredWorkers].sort(
          (a, b) =>
            scoreWorkerAgainstNaturalLanguage(b, aiQuery, contractorJobs) -
            scoreWorkerAgainstNaturalLanguage(a, aiQuery, contractorJobs)
        )
      : sortOrder === 'relevance' && userType === 'employer' && contractorJobs.length > 0
      ? [...filteredWorkers].sort(
          (a, b) =>
            bestWorkerMatchAcrossJobs(b, contractorJobs).score -
            bestWorkerMatchAcrossJobs(a, contractorJobs).score
        )
      : sortWorkers(filteredWorkers);

  const sortedJobs =
    aiQuery.trim() && userType === 'worker'
      ? [...filteredJobs].sort(
          (a, b) =>
            scoreJobAgainstNaturalLanguage(b, aiQuery, loggedInWorker) -
            scoreJobAgainstNaturalLanguage(a, aiQuery, loggedInWorker)
        )
      : sortOrder === 'relevance' && userType === 'worker' && loggedInWorker
      ? rankJobsForWorker(loggedInWorker, filteredJobs).map(result => result.item)
      : sortJobs(filteredJobs);

  const getWorkerMatch = (worker: WorkerProfile) =>
    contractorJobs.length > 0
      ? bestWorkerMatchAcrossJobs(worker, contractorJobs)
      : { score: 1, reasons: ['Post a vacancy to calculate a match'], strengths: [], gaps: [] };

  const getJobMatch = (job: JobProfile) =>
    loggedInWorker
      ? scoreWorkerForJob(loggedInWorker, job)
      : { score: 1, reasons: ['Complete a worker profile to calculate a match'], strengths: [], gaps: [] };

  const clearFilters = () => {
    setSelectedTrade(null);
    setSelectedSubcategory(null);
    setCscsTier(null);
    setMinimumRate(0);
    setMaximumRate(500);
    setRequireVerified(false);
    setSelectedAvailability('');
    setSortOrder('relevance');
    setSearchQuery('');
    setSelectedQualifications([]);
    setSelectedLicences([]);
    setSelectedHometown('');
    setSelectedPositionLengths([]);
    setSelectedRequirements([]);
  };

  return (
    <div id="search_view" className="space-y-6 pb-12 font-sans max-w-lg mx-auto">
      {/* View Mode Toggle Segmented Control */}
      <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 shadow-inner">
        <button
          onClick={() => onNavigate('swipe')}
          className="flex-1 py-1.5 text-xs font-mono font-black rounded-lg transition-all uppercase flex items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-950 cursor-pointer"
        >
          <Heart className="w-3.5 h-3.5 text-zinc-400" /> Card Swipe
        </button>
        <button
          onClick={() => {}}
          className="flex-1 py-1.5 text-xs font-mono font-black rounded-lg transition-all uppercase flex items-center justify-center gap-1.5 bg-[#34D399] text-white shadow-xs"
        >
          <MapPin className="w-3.5 h-3.5 text-white animate-pulse" /> Search Filters & Map
        </button>
      </div>

      <div className="bg-zinc-950 text-white rounded-2xl p-4 border border-zinc-800 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#34D399]/15 text-[#34D399] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-mono font-black text-[#34D399] uppercase tracking-wider">
              HireUp Smart Matching
            </p>
            <h3 className="text-base font-black mt-1">
              Results ranked by your profile
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Match scores use trade, qualifications, licences, location, availability and pay.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#10B981]" />
          <p className="text-[10px] font-mono font-black uppercase text-zinc-600">
            {userType === 'worker' ? 'AI Job Finder' : 'AI Recruiter'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={aiQuery}
            onChange={event => setAiQuery(event.target.value)}
            placeholder={
              userType === 'worker'
                ? 'Example: weekend electrical work in London paying £250/day'
                : 'Example: electrician in Brighton, ECS Gold, available Monday'
            }
            className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-[#34D399]"
          />
          {aiQuery && (
            <button
              type="button"
              onClick={() => setAiQuery('')}
              className="px-4 py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-mono font-black uppercase"
            >
              Clear AI Search
            </button>
          )}
        </div>
        {aiQuery && (
          <p className="text-xs text-emerald-700 mt-3">
            Smart ranking active for: “{aiQuery}”
          </p>
        )}
      </div>

      {/* Immersive Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={userType === 'employer' ? "Search certified tradesmen (e.g. 'Dave Knyte', 'NVQ Level 3')..." : "Search active sub-contracts (e.g. 'Commercial Electrician', 'Vanguard')..."}
          className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-xl shadow-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399] transition-all text-sm md:text-base font-medium"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Options Panel */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#34D399]" />
            <h3 className="text-sm font-bold text-zinc-900 uppercase font-mono tracking-wider">Site Criteria Filters</h3>
          </div>
          <button 
            onClick={clearFilters}
            className="text-xs font-mono font-bold text-zinc-400 hover:text-[#34D399] transition-colors cursor-pointer"
          >
            CLEAR ALL
          </button>
        </div>

        {/* Trade Chips */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Select Primary Trade Category</label>
          <div className="flex flex-wrap gap-2">
            {trades.map((trade) => (
              <button
                key={trade}
                onClick={() => {
                  if (selectedTrade === trade) {
                    setSelectedTrade(null);
                    setSelectedSubcategory(null);
                  } else {
                    setSelectedTrade(trade);
                    setSelectedSubcategory(null);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${selectedTrade === trade ? 'bg-[#34D399] border-[#34D399] text-white shadow-xs' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100'}`}
              >
                {trade.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Trade Subcategory Dropdown */}
        {selectedTrade && (
          <div className="space-y-2 animate-fade-in pt-1">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">Filter by Specific Subcategory</label>
            <select
              value={selectedSubcategory || ''}
              onChange={(e) => setSelectedSubcategory(e.target.value || null)}
              className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#34D399] cursor-pointer"
            >
              <option value="">-- ALL {selectedTrade.toUpperCase()} SUBCATEGORIES --</option>
              {(TRADE_SUBCATEGORIES_MAP[selectedTrade] || []).map((sub) => (
                <option key={sub} value={sub}>{sub.toUpperCase()}</option>
              ))}
            </select>
          </div>
        )}

        {/* Pay and Availability Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <label className="space-y-2">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
              Minimum Rate
            </span>
            <input
              type="number"
              min="0"
              step="10"
              value={minimumRate}
              onChange={event => setMinimumRate(Math.max(0, Number(event.target.value)))}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-[#34D399]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
              Maximum Rate
            </span>
            <input
              type="number"
              min="0"
              step="10"
              value={maximumRate}
              onChange={event => setMaximumRate(Math.max(0, Number(event.target.value)))}
              className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-[#34D399]"
            />
          </label>

          {userType === 'employer' ? (
            <label className="space-y-2">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
                Availability
              </span>
              <select
                value={selectedAvailability}
                onChange={event => setSelectedAvailability(event.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-[#34D399]"
              >
                <option value="">Any availability</option>
                <option value="Immediate">Immediate</option>
                <option value="1 Week">Within 1 Week</option>
                <option value="2 Weeks">Within 2 Weeks</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </label>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-[10px] font-mono font-black text-[#10B981] uppercase">
                Pay range
              </p>
              <p className="text-sm font-black text-zinc-900 mt-1">
                £{minimumRate} – £{maximumRate}
              </p>
              <p className="text-[9px] text-zinc-500 mt-1">
                Matches the numeric value shown in each vacancy.
              </p>
            </div>
          )}
        </div>

        {/* CSCS Tiers & Verifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* CSCS levels */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">CSCS Certification Card Tier</label>
            <div className="flex gap-2">
              {['Green', 'Blue', 'Gold', 'Black'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setCscsTier(cscsTier === tier ? null : tier)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-black border transition-all text-center uppercase ${cscsTier === tier ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Checkbox */}
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={requireVerified}
                onChange={(e) => setRequireVerified(e.target.checked)}
                className="w-4 h-4 rounded text-[#34D399] border-zinc-300 focus:ring-[#34D399] accent-[#34D399]"
              />
              <span className="text-xs font-mono font-bold text-zinc-600 uppercase">REQUIRE VERIFIED BADGES ONLY</span>
            </label>
          </div>
        </div>

        {/* Dataset-Populated Dropdowns */}
        <div className="border-t border-zinc-100 pt-4 space-y-4">
          <h4 className="text-[10px] font-mono font-black text-[#34D399] uppercase tracking-widest">Enhanced Matching Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hometown Dropdown */}
            <div className="space-y-1">
              <SearchableDropdown
                id="search-hometown"
                label="Hometown / Base Location"
                options={HOMETOWNS}
                selected={selectedHometown}
                onChange={setSelectedHometown}
                multiple={false}
                placeholder="Search hometowns..."
              />
            </div>

            {/* Position Length Dropdown */}
            <div className="space-y-1">
              <SearchableDropdown
                id="search-position-lengths"
                label="Employment / Contract Type"
                options={POSITION_LENGTHS}
                selected={selectedPositionLengths}
                onChange={setSelectedPositionLengths}
                multiple={true}
                placeholder="Select position lengths..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Qualifications Dropdown */}
            <div className="space-y-1">
              <SearchableDropdown
                id="search-qualifications"
                label="Qualifications & Grades"
                options={GRADES}
                selected={selectedQualifications}
                onChange={setSelectedQualifications}
                multiple={true}
                placeholder="Filter by qualifications..."
              />
            </div>

            {/* Licences Dropdown */}
            <div className="space-y-1">
              <SearchableDropdown
                id="search-licences"
                label="Licences & Certifications"
                options={LICENCES}
                selected={selectedLicences}
                onChange={setSelectedLicences}
                multiple={true}
                placeholder="Filter by licences..."
              />
            </div>

            {/* Employer Only: Worker capability requirements */}
            {userType === 'employer' && (
              <div className="space-y-1">
                <SearchableDropdown
                  id="search-requirements"
                  label="Worker Capabilities & Requirements"
                  options={REQUIREMENTS}
                  selected={selectedRequirements}
                  onChange={setSelectedRequirements}
                  multiple={true}
                  placeholder="Filter by hiring requirements..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Summary */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-mono font-black text-zinc-800 uppercase tracking-wider">
              Active Search Criteria
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Results update immediately from live HireUp profiles and vacancies.
            </p>
          </div>

          <label className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-zinc-400" />
            <select
              value={sortOrder}
              onChange={event =>
                setSortOrder(
                  event.target.value as
                    | 'relevance'
                    | 'rate-high'
                    | 'rate-low'
                    | 'rating-high'
                    | 'name'
                )
              }
              className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] font-mono font-black uppercase focus:outline-none focus:border-[#34D399]"
            >
              <option value="relevance">Most Relevant</option>
              <option value="rate-high">Highest Rate</option>
              <option value="rate-low">Lowest Rate</option>
              <option value="rating-high">Highest Rating</option>
              <option value="name">Alphabetical</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full text-[10px] font-mono font-bold flex items-center gap-1"
            >
              Search: {searchQuery} <X className="w-3 h-3" />
            </button>
          )}

          {selectedTrade && (
            <button
              type="button"
              onClick={() => {
                setSelectedTrade(null);
                setSelectedSubcategory(null);
              }}
              className="px-2.5 py-1 bg-emerald-50 text-[#10B981] border border-emerald-100 rounded-full text-[10px] font-mono font-bold flex items-center gap-1"
            >
              {selectedTrade} <X className="w-3 h-3" />
            </button>
          )}

          {selectedSubcategory && (
            <button
              type="button"
              onClick={() => setSelectedSubcategory(null)}
              className="px-2.5 py-1 bg-emerald-50 text-[#10B981] border border-emerald-100 rounded-full text-[10px] font-mono font-bold flex items-center gap-1"
            >
              {selectedSubcategory} <X className="w-3 h-3" />
            </button>
          )}

          {selectedHometown && (
            <button
              type="button"
              onClick={() => setSelectedHometown('')}
              className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full text-[10px] font-mono font-bold flex items-center gap-1"
            >
              {selectedHometown} <X className="w-3 h-3" />
            </button>
          )}

          {requireVerified && (
            <button
              type="button"
              onClick={() => setRequireVerified(false)}
              className="px-2.5 py-1 bg-emerald-50 text-[#10B981] border border-emerald-100 rounded-full text-[10px] font-mono font-bold flex items-center gap-1"
            >
              Verified only <X className="w-3 h-3" />
            </button>
          )}

          {selectedAvailability && (
            <button
              type="button"
              onClick={() => setSelectedAvailability('')}
              className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full text-[10px] font-mono font-bold flex items-center gap-1"
            >
              {selectedAvailability} <X className="w-3 h-3" />
            </button>
          )}

          {!searchQuery &&
            !selectedTrade &&
            !selectedSubcategory &&
            !selectedHometown &&
            !requireVerified &&
            !selectedAvailability &&
            selectedQualifications.length === 0 &&
            selectedLicences.length === 0 &&
            selectedPositionLengths.length === 0 &&
            selectedRequirements.length === 0 &&
            !cscsTier && (
              <span className="text-[10px] text-zinc-400 italic">
                No additional filters applied.
              </span>
            )}
        </div>
      </div>

      {userType === 'employer' && contractorJobs.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div>
            <p className="text-xs font-black text-zinc-950">
              {showAllWorkerTrades ? 'All worker trades are visible' : 'Workers are filtered to your vacancy trades'}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-600">
              Matching against {contractorJobs.length} live {contractorJobs.length === 1 ? 'vacancy' : 'vacancies'}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAllWorkerTrades(value => !value)}
            className="flex-shrink-0 rounded-lg bg-white px-3 py-2 text-[10px] font-mono font-black uppercase text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          >
            {showAllWorkerTrades ? 'Vacancy Trades' : 'All Trades'}
          </button>
        </div>
      )}

      {/* Filtered Search Results Count */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-zinc-500">
          Sourced Results ({userType === 'employer' ? sortedWorkers.length : sortedJobs.length})
        </h3>
        {selectedTrade && (
          <span className="text-xs font-mono font-bold bg-[#34D399]/10 border border-[#34D399]/20 text-[#10B981] px-2 py-0.5 rounded">
            {selectedTrade.toUpperCase()}{selectedSubcategory ? ` • ${selectedSubcategory.toUpperCase()}` : ''}
          </span>
        )}
      </div>

      {/* Results Listings */}
      {userType === 'employer' ? (
        sortedWorkers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedWorkers.map((worker) => (
              <div 
                key={worker.id}
                className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs hover:border-[#34D399]/30 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-mono font-black uppercase">
                    <Sparkles className="w-3 h-3" />
                    {getWorkerMatch(worker).score}% match
                  </span>
                  <span className="text-[9px] text-zinc-400">
                    {getWorkerMatch(worker).reasons[0]}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100 border border-zinc-100">
                    <img 
                      src={worker.avatar} 
                      alt={worker.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 font-sans flex items-center gap-1">
                        {worker.name}
                        {worker.verified && <ShieldCheck className="w-4 h-4 text-[#10B981] flex-shrink-0" />}
                      </h4>
                      <p className="text-xs font-mono font-bold text-zinc-500 uppercase">{worker.trade}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-mono">
                      <MapPin className="w-3 h-3" /> {worker.location}
                      <span className="text-zinc-300">|</span>
                      <Award className="w-3 h-3" /> {worker.experience}
                    </div>
                  </div>
                </div>

                {/* Display Licences as Badges on Cards */}
                {((worker.licences && worker.licences.length > 0) || (worker.verifiedBadges && worker.verifiedBadges.length > 0)) && (
                  <div className="flex flex-wrap gap-1 mt-3 px-1">
                    {worker.licences?.slice(0, 3).map((lic, idx) => (
                      <span key={`lic-${idx}`} className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[9px] font-mono font-bold uppercase flex items-center gap-1">
                        🛡️ {lic}
                      </span>
                    ))}
                    {worker.verifiedBadges?.slice(0, 2).map((badge, idx) => (
                      <span key={`badge-${idx}`} className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-[9px] font-mono font-bold uppercase flex items-center gap-1">
                        ⭐ {badge}
                      </span>
                    ))}
                  </div>
                )}

                <div className="border-t border-zinc-100 mt-3 pt-3 flex justify-between items-center bg-zinc-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                  <span className="text-xs font-mono font-black text-[#10B981]">{worker.payRate}</span>
                  <button
                    onClick={() => onSelectWorker(worker)}
                    className="px-3 py-1 bg-zinc-900 hover:bg-[#34D399] text-white text-xs font-mono font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    DETAIL CV <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-zinc-200 rounded-xl space-y-2">
            <Wrench className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs text-zinc-600 font-mono">No tradesmen matched your selected filters.</p>
            <button onClick={clearFilters} className="text-xs font-mono font-black text-[#34D399] hover:underline cursor-pointer">RESET FILTER PARAMS</button>
          </div>
        )
      ) : (
        sortedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedJobs.map((job) => (
              <div 
                key={job.id}
                className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs hover:border-[#34D399]/30 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-mono font-black uppercase">
                    <Sparkles className="w-3 h-3" />
                    {getJobMatch(job).score}% match
                  </span>
                  <span className="text-[9px] text-zinc-400">
                    {getJobMatch(job).reasons[0]}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-zinc-200 flex items-center justify-center p-1.5">
                    <img 
                      src={job.companyLogo} 
                      alt={job.companyName} 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 font-sans flex items-center gap-1">
                        {job.title}
                        {job.verified && <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      </h4>
                      <p className="text-xs font-mono font-bold text-zinc-500 uppercase">{job.companyName}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-mono flex-wrap">
                      <MapPin className="w-3 h-3" /> {job.location}
                      <span className="text-zinc-300">|</span>
                      <Clock className="w-3 h-3" /> {job.duration}
                      <span className="text-zinc-300">|</span>
                      <span>{job.employmentType}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 mt-3 pt-3 flex justify-between items-center bg-zinc-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                  <span className="text-xs font-mono font-black text-[#10B981]">{job.payRate}</span>
                  <button
                    onClick={() => onSelectJob(job)}
                    className="px-3 py-1 bg-zinc-900 hover:bg-[#34D399] text-white text-xs font-mono font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    DETAIL AD <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-zinc-200 rounded-xl space-y-2">
            <Briefcase className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs text-zinc-600 font-mono">No active jobs found matching your criteria.</p>
            <button onClick={clearFilters} className="text-xs font-mono font-black text-[#34D399] hover:underline cursor-pointer">RESET FILTER PARAMS</button>
          </div>
        )
      )}
    </div>
  );
}