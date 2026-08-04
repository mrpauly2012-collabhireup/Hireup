/** 
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  List,
  Map,
  Navigation,
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
type WorkerDisplayMode = 'list' | 'split' | 'map';

const normalise = (value?: string | null) => (value || '').trim().toLowerCase();

const normaliseTradeCategory = (value?: string | null): string => {
  const trade = normalise(value)
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (trade.includes('paint') || trade.includes('decorat')) {
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

const safeWebsiteUrl = (website?: string) => {
  if (!website) return '';
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
};

const formatRating = (rating: number | null | undefined) =>
  rating === null || rating === undefined ? 'New' : Number(rating).toFixed(1);

const UK_LOCATION_COORDINATES: Record<string, [number, number]> = {
  london: [51.5074, -0.1278],
  brighton: [50.8225, -0.1372],
  'brighton and hove': [50.8225, -0.1372],
  worthing: [50.8179, -0.3729],
  shoreham: [50.8342, -0.2748],
  'shoreham by sea': [50.8342, -0.2748],
  crawley: [51.1091, -0.1872],
  horsham: [51.0629, -0.3259],
  chichester: [50.8365, -0.7792],
  portsmouth: [50.8198, -1.088],
  southampton: [50.9097, -1.4044],
  guildford: [51.2362, -0.5704],
  reading: [51.4543, -0.9781],
  oxford: [51.752, -1.2577],
  bristol: [51.4545, -2.5879],
  birmingham: [52.4862, -1.8904],
  manchester: [53.4808, -2.2426],
  liverpool: [53.4084, -2.9916],
  leeds: [53.8008, -1.5491],
  sheffield: [53.3811, -1.4701],
  nottingham: [52.9548, -1.1581],
  leicester: [52.6369, -1.1398],
  coventry: [52.4068, -1.5197],
  newcastle: [54.9783, -1.6178],
  cardiff: [51.4816, -3.1791],
  glasgow: [55.8642, -4.2518],
  edinburgh: [55.9533, -3.1883],
  belfast: [54.5973, -5.9301],
};

const locationCoordinates = (location?: string, seed = ''): [number, number] => {
  const locationKey = normalise(location).replace(/-/g, ' ');
  const direct = UK_LOCATION_COORDINATES[locationKey];
  if (direct) return direct;

  const partial = Object.entries(UK_LOCATION_COORDINATES).find(([name]) =>
    locationKey.includes(name) || name.includes(locationKey)
  );
  if (partial) return partial[1];

  // Stable UK fallback for towns not yet in the local lookup table.
  const hash = `${locationKey}-${seed}`.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return [52.2 + ((hash % 240) - 120) / 100, -1.8 + ((hash % 180) - 90) / 100];
};

const availabilityTone = (availability?: string) => {
  const value = normalise(availability);
  if (value.includes('immediate') || value.includes('now')) {
    return { label: 'Available now', colour: '#10B981', pulse: true };
  }
  if (value.includes('week')) {
    return { label: 'Available this week', colour: '#F59E0B', pulse: false };
  }
  if (value.includes('unavailable')) {
    return { label: 'Unavailable', colour: '#A1A1AA', pulse: false };
  }
  return { label: availability || 'Availability listed', colour: '#3B82F6', pulse: false };
};

const workerMapIcon = (availability?: string) => {
  const tone = availabilityTone(availability);
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:34px;height:42px;display:flex;align-items:flex-start;justify-content:center;">
      ${tone.pulse ? `<span style="position:absolute;top:2px;width:28px;height:28px;border-radius:9999px;background:${tone.colour};opacity:.25;animation:hireup-map-pulse 1.6s ease-out infinite;"></span>` : ''}
      <span style="position:relative;width:28px;height:28px;border-radius:9999px;background:${tone.colour};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.28);"></span>
      <span style="position:absolute;top:24px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid ${tone.colour};"></span>
    </div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -38],
  });
};

function FitWorkerMap({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 10);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 10 });
  }, [map, points]);
  return null;
}


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
  const [workerDisplayMode, setWorkerDisplayMode] = useState<WorkerDisplayMode>('split');
  const [showAllWorkerTrades, setShowAllWorkerTrades] = useState(false);

  const loggedInWorker = workers.find(worker => worker.id === currentUserId);
  const loggedInCompany = companies.find(company => company.id === currentUserId);
  const contractorJobs = jobs.filter(job => job.companyId === currentUserId);

  const verifiedWorkers = useMemo(() => {
    const verified = workers.filter(worker => worker.verified);

    if (
      userType !== 'employer' ||
      showAllWorkerTrades ||
      contractorJobs.length === 0
    ) {
      return verified;
    }

    return verified.filter(worker =>
      contractorJobs.some(job =>
        isSameTradeCategory(worker.trade, job.trade)
      )
    );
  }, [workers, userType, showAllWorkerTrades, contractorJobs]);

  const verifiedCompanies = useMemo(
    () => companies.filter(company => company.verified),
    [companies]
  );

  const featuredJobs = useMemo(
    () =>
      jobs.filter(job => {
        if (
          userType === 'worker' &&
          (!loggedInWorker?.trade ||
            !isSameTradeCategory(loggedInWorker.trade, job.trade))
        ) {
          return false;
        }

        const item = job as JobProfile & {
          featured?: boolean;
          isFeatured?: boolean;
          is_featured?: boolean;
          featured_status?: boolean | string;
        };

        return (
          item.featured === true ||
          item.isFeatured === true ||
          item.is_featured === true ||
          item.featured_status === true ||
          item.featured_status === 'featured' ||
          item.featured_status === 'active'
        );
      }),
    [jobs, userType, loggedInWorker?.trade]
  );

  const availableTrades = useMemo(() => {
    const source =
      userType === 'employer'
        ? verifiedWorkers.map(worker => worker.trade)
        : featuredJobs.map(job => job.trade);

    return Array.from(new Set(source.filter(Boolean))).sort();
  }, [userType, verifiedWorkers, featuredJobs]);

  const availableLocations = useMemo(() => {
    const source =
      userType === 'employer'
        ? verifiedWorkers.map(worker => worker.location)
        : featuredJobs.map(job => job.location);

    return Array.from(new Set(source.filter(Boolean))).sort();
  }, [userType, verifiedWorkers, featuredJobs]);

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

  const filteredFeaturedJobs = useMemo(() => {
    const query = normalise(searchQuery);

    return featuredJobs
      .filter(job => {
        if (
          query &&
          ![
            job.title,
            job.companyName,
            job.trade,
            job.subcategory,
            job.location,
            job.employmentType,
            job.description,
            ...(job.qualifications || []),
            ...(job.requirements || []),
          ].some(value => normalise(value).includes(query))
        ) {
          return false;
        }

        if (tradeFilter !== 'all' && job.trade !== tradeFilter) return false;
        if (locationFilter !== 'all' && job.location !== locationFilter) return false;

        if (minimumRating !== 'all') {
          const company = companies.find(item => item.id === job.companyId);
          if (Number(company?.stats?.rating || 0) < Number(minimumRating)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (!loggedInWorker) return 0;
        return (
          scoreWorkerForJob(loggedInWorker, b).score -
          scoreWorkerForJob(loggedInWorker, a).score
        );
      });
  }, [
    featuredJobs,
    searchQuery,
    tradeFilter,
    locationFilter,
    minimumRating,
    companies,
    loggedInWorker,
  ]);

  const featuredJobMatch = (job: JobProfile) =>
    loggedInWorker
      ? scoreWorkerForJob(loggedInWorker, job)
      : {
          score: 0,
          label: 'Profile required',
          reasons: ['Complete your worker profile to calculate a match.'],
        };

  const isContractorView = userType === 'employer';
  const immediatelyAvailableWorkers = filteredWorkers.filter(worker => {
    const availability = normalise(worker.availability);
    return availability.includes('immediate') || availability.includes('now');
  });
  const averageWorkerMatch = filteredWorkers.length
    ? Math.round(
        filteredWorkers.reduce((total, worker) => total + workerMatch(worker).score, 0) /
          filteredWorkers.length
      )
    : 0;
  const workerMapPoints = filteredWorkers.map(worker =>
    locationCoordinates(worker.location, worker.id)
  );

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
                <Star className="w-5 h-5 text-amber-400 fill-current" />
              )}
              <p className="text-[10px] font-mono font-black text-[#34D399] uppercase tracking-wider">
                {isContractorView ? 'Verified HireUp Network' : 'Promoted HireUp Vacancies'}
              </p>
            </div>
            <h2 className="text-2xl md:text-3xl font-black mt-2">
              {isContractorView ? 'Verified Workers' : 'Featured Jobs'}
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              {isContractorView
                ? 'Discover approved tradespeople ranked against your active vacancies.'
                : 'Discover vacancies selected and promoted by the HireUp admin team, ranked against your worker profile.'}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-48">
            <p className="text-[9px] font-mono uppercase text-zinc-400">
              {isContractorView ? 'Verified profiles' : 'Featured vacancies'}
            </p>
            <p className="text-3xl font-black mt-1">
              {isContractorView
                ? verifiedWorkers.length
                : featuredJobs.length}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-zinc-200/80 rounded-2xl p-4 space-y-4">
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
                  : 'Search job title, company, trade or location...'
              }
              className="w-full pl-9 pr-3 py-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus:border-[#34D399]"
            />
          </div>

          {userType === 'employer' && contractorJobs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllWorkerTrades(value => !value)}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] font-mono font-black uppercase text-emerald-700 hover:bg-emerald-100"
            >
              {showAllWorkerTrades ? 'Vacancy Trades' : 'All Trades'}
            </button>
          )}

          <select
            value={tradeFilter}
            onChange={event => setTradeFilter(event.target.value)}
            className="px-3 py-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-bold"
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
            className="px-3 py-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-bold"
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
            className="px-3 py-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-bold"
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
                  className={`px-3 py-2 rounded-xl text-[10px] font-mono font-black uppercase border ${
                    availabilityFilter === value
                      ? 'bg-[#34D399] border-[#34D399] text-zinc-950'
                      : 'bg-white border-zinc-200/80 text-zinc-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </>
          ) : (
            <span className="px-3 py-2 rounded-xl text-[10px] font-mono font-black uppercase border bg-amber-50 border-amber-200 text-zinc-950 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
              Admin featured only
            </span>
          )}
        </div>
      </section>

      {isContractorView ? (
        <section className="space-y-4">
          <style>{`
            @keyframes hireup-map-pulse {
              0% { transform: scale(.75); opacity: .45; }
              75%, 100% { transform: scale(1.85); opacity: 0; }
            }

            .hireup-worker-map .leaflet-container {
              width: 100%;
              height: 100%;
              background: #e4e4e7;
              font-family: inherit;
            }

            .hireup-worker-map .leaflet-popup-content-wrapper {
              border-radius: 16px;
              overflow: hidden;
              padding: 0;
              box-shadow: 0 16px 40px rgba(0,0,0,.18);
            }

            .hireup-worker-map .leaflet-popup-content {
              width: 270px !important;
              margin: 0;
            }
          `}</style>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="grid grid-cols-3 gap-2 flex-1">
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                  <p className="text-[8px] font-mono font-black text-zinc-400 uppercase">
                    Visible workers
                  </p>
                  <p className="text-xl font-black mt-1">{filteredWorkers.length}</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-[8px] font-mono font-black text-emerald-700 uppercase">
                    Available now
                  </p>
                  <p className="text-xl font-black text-emerald-800 mt-1">
                    {immediatelyAvailableWorkers.length}
                  </p>
                </div>

                <div className="bg-zinc-950 text-white rounded-xl p-3">
                  <p className="text-[8px] font-mono font-black text-[#34D399] uppercase">
                    Average AI match
                  </p>
                  <p className="text-xl font-black mt-1">{averageWorkerMatch}%</p>
                </div>
              </div>

              <div className="inline-flex flex-wrap bg-zinc-100 p-1 rounded-xl self-start xl:self-auto">
                <button
                  type="button"
                  onClick={() => setWorkerDisplayMode('list')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black uppercase flex items-center gap-1.5 ${
                    workerDisplayMode === 'list'
                      ? 'bg-white text-zinc-950 shadow-md'
                      : 'text-zinc-500'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  List
                </button>

                <button
                  type="button"
                  onClick={() => setWorkerDisplayMode('split')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black uppercase flex items-center gap-1.5 ${
                    workerDisplayMode === 'split'
                      ? 'bg-[#34D399] text-zinc-950 shadow-md'
                      : 'text-zinc-500'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Map + List
                </button>

                <button
                  type="button"
                  onClick={() => setWorkerDisplayMode('map')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black uppercase flex items-center gap-1.5 ${
                    workerDisplayMode === 'map'
                      ? 'bg-zinc-950 text-white shadow-md'
                      : 'text-zinc-500'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  Full Map
                </button>
              </div>
            </div>
          </div>

          {workerDisplayMode === 'split' && (
            <div className="grid grid-cols-1 2xl:grid-cols-[520px_minmax(0,1fr)] gap-4 items-start">
              <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden 2xl:sticky 2xl:top-4">
                <div className="px-4 py-3 border-b border-zinc-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-black flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-[#10B981]" />
                        Worker Availability Map
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Based on each worker&apos;s saved town or city—not live GPS.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-[9px] font-mono font-black uppercase">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Now
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        This week
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        Soon
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hireup-worker-map h-[520px] w-full relative z-0">
                  <MapContainer
                    center={[52.5, -1.5]}
                    zoom={6}
                    scrollWheelZoom
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FitWorkerMap points={workerMapPoints} />

                    {filteredWorkers.map(worker => {
                      const match = workerMatch(worker);
                      const tone = availabilityTone(worker.availability);
                      const isSaved = savedIds.includes(worker.id);

                      return (
                        <Marker
                          key={`split-map-${worker.id}`}
                          position={locationCoordinates(worker.location, worker.id)}
                          icon={workerMapIcon(worker.availability)}
                        >
                          <Popup>
                            <div className="bg-white">
                              <div className="bg-zinc-950 text-white p-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={worker.profilePhotoUrl || worker.avatar}
                                    alt={worker.name}
                                    className="w-12 h-12 rounded-xl object-cover border border-white/20"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-black text-sm truncate">{worker.name}</p>
                                    <p className="text-[10px] text-[#34D399] font-bold">
                                      {worker.trade}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                  <span
                                    className="text-[9px] font-mono font-black uppercase"
                                    style={{ color: tone.colour }}
                                  >
                                    {tone.label}
                                  </span>
                                  <span className="text-xl font-black">{match.score}%</span>
                                </div>
                              </div>

                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <span className="flex items-center gap-1 text-zinc-600">
                                    <MapPin className="w-3 h-3" />
                                    {worker.location}
                                  </span>
                                  <span className="text-right font-mono font-black">
                                    {worker.payRate}
                                  </span>
                                  <span className="flex items-center gap-1 text-zinc-600">
                                    <Clock className="w-3 h-3" />
                                    {worker.experience}
                                  </span>
                                  <span className="flex items-center justify-end gap-1">
                                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                                    {formatRating(worker.rating)}
                                  </span>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleSaved(worker.id)}
                                    className={`flex-1 py-2 rounded-xl border text-[9px] font-mono font-black uppercase ${
                                      isSaved
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'border-zinc-200/80 text-zinc-600'
                                    }`}
                                  >
                                    {isSaved ? 'Saved' : 'Save'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onSelectWorker(worker)}
                                    className="flex-1 py-2 bg-zinc-950 text-white rounded-xl text-[9px] font-mono font-black uppercase"
                                  >
                                    View Profile
                                  </button>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>

              <div className="bg-zinc-100/60 border border-zinc-200/80 rounded-2xl p-3">
                <div className="flex items-center justify-between px-1 pb-3">
                  <div>
                    <p className="text-sm font-black">Verified workers</p>
                    <p className="text-[10px] text-zinc-500">
                      Sorted by your strongest AI match
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-white border border-zinc-200/80 rounded-xl text-[9px] font-mono font-black">
                    {filteredWorkers.length} RESULTS
                  </span>
                </div>

                <div className="h-[460px] overflow-y-auto space-y-2 pr-1">
                  {filteredWorkers.length === 0 ? (
                    <div className="bg-white border border-zinc-200/80 border-dashed rounded-xl p-8 text-center">
                      <Users className="w-7 h-7 text-zinc-300 mx-auto" />
                      <p className="text-sm font-black mt-2">No workers found</p>
                    </div>
                  ) : (
                    filteredWorkers.map(worker => {
                      const match = workerMatch(worker);
                      const isSaved = savedIds.includes(worker.id);

                      return (
                        <article
                          key={`split-card-${worker.id}`}
                          className="bg-white border border-zinc-200/80 rounded-xl p-2.5 hover:border-[#34D399] transition-all duration-200 ease-out"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={worker.profilePhotoUrl || worker.avatar}
                              alt={worker.name}
                              className="w-12 h-12 rounded-xl object-cover border border-zinc-200/80 flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="text-[13px] font-black truncate">
                                    {worker.name}
                                  </h3>
                                  <p className="text-[10px] font-bold text-[#10B981] truncate">
                                    {worker.trade}
                                  </p>
                                </div>

                                <div className="bg-zinc-950 text-white rounded-xl px-2 py-1 text-center flex-shrink-0">
                                  <p className="text-[7px] font-mono text-[#34D399] uppercase">
                                    Match
                                  </p>
                                  <p className="text-sm font-black leading-none mt-0.5">
                                    {match.score}%
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-zinc-500 mt-1.5">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {worker.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {worker.experience}
                                </span>
                                <span className="font-mono font-black text-zinc-800">
                                  {worker.payRate}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {(worker.qualifications || []).slice(0, 2).map(item => (
                                  <span
                                    key={item}
                                    className="px-1.5 py-0.5 bg-zinc-50 border border-zinc-200/80 rounded text-[8px] font-mono font-bold text-zinc-600 truncate max-w-40"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  normalise(worker.availability).includes('immediate')
                                    ? 'bg-emerald-500'
                                    : 'bg-blue-500'
                                }`}
                              />
                              <span className="text-[9px] font-mono font-black uppercase text-zinc-500">
                                {worker.availability}
                              </span>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleSaved(worker.id)}
                                className={`p-2 rounded-xl border ${
                                  isSaved
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'border-zinc-200/80 text-zinc-500'
                                }`}
                                title={isSaved ? 'Remove saved worker' : 'Save worker'}
                              >
                                <Bookmark
                                  className={`w-3.5 h-3.5 ${
                                    isSaved ? 'fill-current' : ''
                                  }`}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() => onSelectWorker(worker)}
                                className="px-3 py-2 bg-zinc-950 text-white rounded-xl text-[9px] font-mono font-black uppercase"
                              >
                                Profile
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {workerDisplayMode === 'map' && (
            <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-200/80">
                <p className="text-sm font-black flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#10B981]" />
                  Full Worker Availability Map
                </p>
              </div>

              <div className="hireup-worker-map h-[620px] w-full relative z-0">
                <MapContainer
                  center={[52.5, -1.5]}
                  zoom={6}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitWorkerMap points={workerMapPoints} />

                  {filteredWorkers.map(worker => (
                    <Marker
                      key={`full-map-${worker.id}`}
                      position={locationCoordinates(worker.location, worker.id)}
                      icon={workerMapIcon(worker.availability)}
                    >
                      <Popup>
                        <div className="p-3">
                          <p className="text-sm font-black">{worker.name}</p>
                          <p className="text-[10px] font-bold text-[#10B981]">
                            {worker.trade}
                          </p>
                          <button
                            type="button"
                            onClick={() => onSelectWorker(worker)}
                            className="w-full mt-3 py-2 bg-zinc-950 text-white rounded-xl text-[9px] font-mono font-black uppercase"
                          >
                            View Profile
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}

          {workerDisplayMode === 'list' && (
            <div className="space-y-4">
              {filteredWorkers.length === 0 ? (
                <div className="bg-white border border-zinc-200/80 border-dashed rounded-2xl p-10 text-center">
                  <Users className="w-8 h-8 text-zinc-300 mx-auto" />
                  <h3 className="font-black mt-3">No verified workers found</h3>
                </div>
              ) : (
                filteredWorkers.map(worker => {
                  const match = workerMatch(worker);
                  const isSaved = savedIds.includes(worker.id);

                  return (
                    <article
                      key={`list-card-${worker.id}`}
                      className="bg-white border border-zinc-200/80 rounded-2xl p-5 hover:border-[#34D399] transition-all duration-200 ease-out"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
                        <div className="flex gap-4 min-w-0">
                          <img
                            src={worker.profilePhotoUrl || worker.avatar}
                            alt={worker.name}
                            className="w-20 h-20 rounded-2xl object-cover border border-zinc-200/80 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black truncate">
                                {worker.name}
                              </h3>
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-mono font-black uppercase">
                                <ShieldCheck className="w-3 h-3" />
                                Verified
                              </span>
                            </div>

                            <p className="text-sm font-bold text-[#10B981] mt-1">
                              {worker.trade}
                            </p>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 mt-2">
                              <span>{worker.location}</span>
                              <span>{worker.experience}</span>
                              <span>{worker.payRate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-950 text-white rounded-2xl p-4">
                          <p className="text-[9px] font-mono uppercase text-[#34D399]">
                            HireUp AI match
                          </p>
                          <p className="text-3xl font-black mt-1">{match.score}%</p>
                          <p className="text-xs text-zinc-400 mt-2">
                            {match.reasons[0] || match.label}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-zinc-100 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSaved(worker.id)}
                          className={`px-3 py-2 rounded-xl border text-[10px] font-mono font-black uppercase ${
                            isSaved
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'border-zinc-200/80 text-zinc-600'
                          }`}
                        >
                          {isSaved ? 'Saved' : 'Save'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectWorker(worker)}
                          className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-[10px] font-mono font-black uppercase"
                        >
                          View Profile
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-5">
          {filteredFeaturedJobs.length === 0 ? (
            <div className="bg-white border border-zinc-200/80 border-dashed rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-black text-zinc-950 mt-3">No featured jobs found</h3>
              <p className="text-xs text-zinc-700 mt-1">
                Jobs marked as featured in the Admin Dashboard will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredFeaturedJobs.map(job => {
                const match = featuredJobMatch(job);
                const company = companies.find(item => item.id === job.companyId);
                const isSaved = savedIds.includes(job.id);

                return (
                  <article
                    key={job.id}
                    className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden hover:border-[#34D399] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out"
                  >
                    <div className="h-1.5 bg-[#34D399]" />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-xl bg-zinc-50 border border-zinc-200/80 p-2 flex-shrink-0 flex items-center justify-center">
                            {job.companyLogo ? (
                              <img
                                src={job.companyLogo}
                                alt={job.companyName}
                                className="max-w-full max-h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Briefcase className="w-6 h-6 text-zinc-950" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 text-zinc-950 rounded-full text-[8px] font-mono font-black uppercase">
                                <Star className="w-3 h-3 text-amber-500 fill-current" />
                                Featured
                              </span>
                              {(job.verified || company?.verified) && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 text-zinc-950 rounded-full text-[8px] font-mono font-black uppercase">
                                  <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                                  Verified contractor
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-black text-zinc-950 mt-2 leading-tight">
                              {job.title}
                            </h3>
                            <p className="text-xs font-bold text-zinc-950 mt-1">
                              {job.companyName}
                            </p>
                          </div>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200/80 text-black rounded-xl px-3 py-2 text-center flex-shrink-0">
                          <p className="text-[7px] font-mono font-black text-black uppercase">
                            AI match
                          </p>
                          <p className="text-xl font-black text-black mt-1">{match.score}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
                        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                          <p className="text-[8px] font-mono font-black text-zinc-700 uppercase">Pay</p>
                          <p className="text-sm font-black text-zinc-950 mt-1">
                            {job.payRate || 'Competitive'}
                          </p>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                          <p className="text-[8px] font-mono font-black text-zinc-700 uppercase">Start</p>
                          <p className="text-xs font-black text-zinc-950 mt-1">
                            {job.startDate || 'Immediate'}
                          </p>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                          <p className="text-[8px] font-mono font-black text-zinc-700 uppercase">Duration</p>
                          <p className="text-xs font-black text-zinc-950 mt-1">
                            {job.duration || 'Ongoing'}
                          </p>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3">
                          <p className="text-[8px] font-mono font-black text-zinc-700 uppercase">Rating</p>
                          <p className="text-xs font-black text-zinc-950 mt-1 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-current" />
                            {formatRating(company?.stats?.rating)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-zinc-950">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5" />
                          {job.trade}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {job.employmentType}
                        </span>
                      </div>

                      {job.description && (
                        <p className="text-sm text-zinc-800 leading-relaxed mt-4 line-clamp-3">
                          {job.description}
                        </p>
                      )}

                      {match.reasons?.[0] && (
                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                            <p className="text-[9px] font-mono font-black text-zinc-950 uppercase">
                              Why this matches
                            </p>
                          </div>
                          <p className="text-xs text-zinc-950 mt-1">{match.reasons[0]}</p>
                        </div>
                      )}

                      <div className="mt-5 pt-4 border-t border-zinc-200/80 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSaved(job.id)}
                          className={`px-4 py-2.5 rounded-xl border text-[10px] font-mono font-black uppercase flex items-center justify-center gap-1.5 ${
                            isSaved
                              ? 'bg-emerald-50 border-emerald-200 text-zinc-950'
                              : 'bg-white border-zinc-300 text-zinc-950'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                          {isSaved ? 'Saved' : 'Save job'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectJob(job)}
                          className="flex-1 px-4 py-2.5 border border-zinc-300 text-zinc-950 rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-1.5 hover:bg-white"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View job
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectJob(job)}
                          className="flex-1 px-4 py-2.5 bg-[#34D399] text-zinc-950 rounded-xl text-[10px] font-mono font-black uppercase flex items-center justify-center gap-1.5 hover:bg-[#10B981]"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          Apply
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}