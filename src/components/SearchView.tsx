/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, MapPin, Award, Wrench, Briefcase, 
  Map, Star, ShieldCheck, Clock, Check, ChevronRight, X, Heart
} from 'lucide-react';
import { WorkerProfile, JobProfile, UserType } from '../types';
import SearchableDropdown from './SearchableDropdown';
import { HOMETOWNS, LICENCES, POSITION_LENGTHS, GRADES, REQUIREMENTS, TRADES_CATEGORIES, TRADE_SUBCATEGORIES_MAP } from '../data/datasets';

interface SearchViewProps {
  userType: UserType;
  workers: WorkerProfile[];
  jobs: JobProfile[];
  onSelectWorker: (worker: WorkerProfile) => void;
  onSelectJob: (job: JobProfile) => void;
  onNavigate: (view: string) => void;
}

export default function SearchView({
  userType,
  workers,
  jobs,
  onSelectWorker,
  onSelectJob,
  onNavigate
}: SearchViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(25);
  const [cscsTier, setCscsTier] = useState<string | null>(null);
  const [selectedRateRange, setSelectedRateRange] = useState<number>(300);
  const [requireVerified, setRequireVerified] = useState(false);
  const [activeMapPin, setActiveMapPin] = useState<string | null>(null);

  // New Search & Filter States using the master datasets
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
  const [selectedLicences, setSelectedLicences] = useState<string[]>([]);
  const [selectedHometown, setSelectedHometown] = useState<string>('');
  const [selectedPositionLengths, setSelectedPositionLengths] = useState<string[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);

  // Use TRADES_CATEGORIES as the master list
  const trades = TRADES_CATEGORIES;

  const recentSearches = [
    'Gold Card Electrician Battersea',
    'CIS Price Bricklayer Croydon',
    'Approved Plumber Gas Safe',
    'First Fix Carpenter Manchester'
  ];

  // Map pins corresponding to mock construction projects
  const mapPins = [
    { id: 'pin1', label: 'Battersea Site Office', x: '55%', y: '65%', count: 3, trade: 'Electrician' },
    { id: 'pin2', label: 'Croydon Residential Build', x: '58%', y: '78%', count: 2, trade: 'Bricklayer' },
    { id: 'pin3', label: 'Chelsea High-End Refurb', x: '45%', y: '58%', count: 1, trade: 'Carpenter' },
    { id: 'pin4', label: 'London City Centre M&E', x: '52%', y: '48%', count: 4, trade: 'Plumber' },
  ];

  // Filter logic
  const filteredWorkers = workers.filter(worker => {
    if (searchQuery && !worker.name.toLowerCase().includes(searchQuery.toLowerCase()) && !worker.about.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedTrade && worker.trade !== selectedTrade) {
      return false;
    }
    if (selectedSubcategory && worker.subcategory !== selectedSubcategory) {
      return false;
    }
    if (cscsTier && !worker.qualifications.some(q => q.toLowerCase().includes(cscsTier.toLowerCase()))) {
      return false;
    }
    if (requireVerified && !worker.verified) {
      return false;
    }
    // Extract rate number
    const rateNum = parseInt(worker.payRate.replace(/[^0-9]/g, ''), 10) || 0;
    if (rateNum > selectedRateRange) {
      return false;
    }
    // Hometown Filter
    if (selectedHometown && !worker.location.toLowerCase().includes(selectedHometown.toLowerCase())) {
      return false;
    }
    // Qualifications Filter (search/match grades)
    if (selectedQualifications.length > 0) {
      const hasMatch = worker.qualifications.some(q => 
        selectedQualifications.some(sq => q.toLowerCase().includes(sq.toLowerCase()) || sq.toLowerCase().includes(q.toLowerCase()))
      );
      if (!hasMatch) return false;
    }
    // Licences Filter (search/match licences)
    if (selectedLicences.length > 0) {
      const wLics = worker.licences || [];
      const wBadges = worker.verifiedBadges || [];
      const allLicsAndBadges = [...wLics, ...wBadges, ...worker.qualifications];
      const hasMatch = allLicsAndBadges.some(l => 
        selectedLicences.some(sl => l.toLowerCase().includes(sl.toLowerCase()) || sl.toLowerCase().includes(l.toLowerCase()))
      );
      if (!hasMatch) return false;
    }
    // Position Length Filter
    if (selectedPositionLengths.length > 0) {
      const wPositionLengths = worker.positionLengths || [];
      const hasMatch = wPositionLengths.some(pl => selectedPositionLengths.includes(pl)) || 
                       selectedPositionLengths.some(sl => worker.availability.toLowerCase().includes(sl.toLowerCase()));
      if (!hasMatch) return false;
    }
    return true;
  });

  const filteredJobs = jobs.filter(job => {
    if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase()) && !job.companyName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedTrade && job.trade !== selectedTrade) {
      return false;
    }
    if (selectedSubcategory && job.subcategory !== selectedSubcategory) {
      return false;
    }
    if (cscsTier && !job.qualifications.some(q => q.toLowerCase().includes(cscsTier.toLowerCase()))) {
      return false;
    }
    if (requireVerified && !job.verified) {
      return false;
    }
    const rateNum = parseInt(job.payRate.replace(/[^0-9]/g, ''), 10) || 0;
    if (rateNum > selectedRateRange) {
      return false;
    }
    // Hometown Filter
    if (selectedHometown && !job.location.toLowerCase().includes(selectedHometown.toLowerCase())) {
      return false;
    }
    // Qualifications Filter
    if (selectedQualifications.length > 0) {
      const hasMatch = job.qualifications.some(q => 
        selectedQualifications.some(sq => q.toLowerCase().includes(sq.toLowerCase()) || sq.toLowerCase().includes(q.toLowerCase()))
      );
      if (!hasMatch) return false;
    }
    // Position Length / Employment Type Filter
    if (selectedPositionLengths.length > 0) {
      const hasMatch = selectedPositionLengths.some(sl => 
        job.employmentType.toLowerCase().includes(sl.toLowerCase()) || job.duration.toLowerCase().includes(sl.toLowerCase())
      );
      if (!hasMatch) return false;
    }
    // Hiring Requirements Filter
    if (selectedRequirements.length > 0 && job.requirements) {
      const hasMatch = job.requirements.some(r => 
        selectedRequirements.some(sr => r.toLowerCase().includes(sr.toLowerCase()) || sr.toLowerCase().includes(r.toLowerCase()))
      );
      if (!hasMatch) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setSelectedTrade(null);
    setSelectedSubcategory(null);
    setCscsTier(null);
    setSelectedRateRange(300);
    setRequireVerified(false);
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

        {/* Sliding Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Day Rate Expectation */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-400 uppercase">
              <span>MAX DAY RATE expectation</span>
              <span className="text-[#10B981] font-bold">£{selectedRateRange}/day</span>
            </div>
            <input 
              type="range" 
              min="150" 
              max="400" 
              step="10"
              value={selectedRateRange}
              onChange={(e) => setSelectedRateRange(parseInt(e.target.value, 10))}
              className="w-full accent-[#34D399] bg-zinc-100 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Travel Distance Radius */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-400 uppercase">
              <span>Travel Distance Radius</span>
              <span className="text-zinc-700 font-bold">{maxDistance} Miles</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="100" 
              step="5"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseInt(e.target.value, 10))}
              className="w-full accent-[#34D399] bg-zinc-100 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
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

            {/* Employer Only: Hiring Requirements */}
            {userType === 'employer' && (
              <div className="space-y-1">
                <SearchableDropdown
                  id="search-requirements"
                  label="Contractor Hiring Requirements"
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

      {/* Map Search Widget */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
          <div>
            <h4 className="text-xs font-mono font-bold text-zinc-700 uppercase">Interactive Map search</h4>
            <p className="text-[10px] text-zinc-500 font-sans">Tap project pins in your Greater London zone to view local subcontracts</p>
          </div>
          <span className="px-2 py-0.5 bg-zinc-200 border border-zinc-300 rounded text-[9px] font-mono font-black text-zinc-700 flex items-center gap-1">
            <Map className="w-3 h-3 text-zinc-600" /> ACTIVE ZONE: GREATER LONDON
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Custom SVG Map Drawing */}
          <div className="md:col-span-2 bg-zinc-900 h-64 relative overflow-hidden flex items-center justify-center">
            {/* Ambient grid markings */}
            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            
            {/* SVG London outline block */}
            <svg viewBox="0 0 400 200" className="w-full h-full max-w-sm opacity-25 text-zinc-700 fill-current">
              <path d="M 50,50 Q 80,40 110,60 T 170,80 T 230,70 T 300,50 T 350,90 Q 320,130 280,120 T 200,140 T 120,110 T 50,90 Z" />
              {/* Radial boundaries */}
              <circle cx="200" cy="100" r="80" stroke="#444" strokeWidth="1" strokeDasharray="3,3" fill="none" />
              <circle cx="200" cy="100" r="40" stroke="#34D399" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.3" />
            </svg>

            {/* Radius distance circle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
              <div className="text-[9px] font-mono text-[#34D399]/40 font-bold">RADIAL SEARCH: {maxDistance} MILES</div>
            </div>

            {/* Interactive Map Pins */}
            {mapPins.map((pin) => (
              <button
                key={pin.id}
                onClick={() => setActiveMapPin(activeMapPin === pin.id ? null : pin.id)}
                style={{ left: pin.x, top: pin.y }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${activeMapPin === pin.id ? 'bg-[#34D399] text-white scale-110 ring-4 ring-[#34D399]/20 z-20' : 'bg-zinc-800 border border-zinc-700 text-[#34D399] hover:bg-zinc-700 z-10'}`}
              >
                <MapPin className="w-4 h-4 fill-current" />
                {/* Badge count */}
                <span className="absolute -top-1 -right-1 bg-zinc-950 text-white border border-zinc-700 rounded-full text-[8px] font-mono h-4 w-4 flex items-center justify-center font-bold">
                  {pin.count}
                </span>
              </button>
            ))}
          </div>

          {/* Map Pin Detail List */}
          <div className="p-4 bg-zinc-50 border-t md:border-t-0 md:border-l border-zinc-200 flex flex-col justify-between h-64 overflow-y-auto">
            {activeMapPin ? (
              (() => {
                const pin = mapPins.find(p => p.id === activeMapPin);
                if (!pin) return <p className="text-xs text-zinc-500 font-mono">No site selected</p>;
                return (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold bg-[#34D399]/10 border border-[#34D399]/20 text-[#10B981] px-1.5 py-0.5 rounded">
                        CONSTRUCTION SITE
                      </span>
                      <button onClick={() => setActiveMapPin(null)} className="text-zinc-400 hover:text-zinc-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-zinc-900 font-sans">{pin.label}</h5>
                      <p className="text-[10px] text-zinc-500 font-mono">Radial distance: 8.5 miles from base</p>
                    </div>
                    <div className="border-t border-zinc-200 pt-2 space-y-2">
                      <p className="text-xs text-zinc-600 font-sans">
                        Sourced <b>{pin.count} openings</b> matching <b>{pin.trade}</b> scopes in this grid sector.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedTrade(pin.trade);
                        }}
                        className="w-full py-1.5 bg-zinc-900 hover:bg-[#34D399] text-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer"
                      >
                        FILTER FOR THIS SITE
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-3 text-center my-auto">
                <Map className="w-8 h-8 text-zinc-400 mx-auto stroke-[1.5]" />
                <p className="text-xs text-zinc-600 font-sans">
                  Tap active pins on the grid to filter bids, view contractors, or see site boundaries.
                </p>
              </div>
            )}

            {/* Base Coordinate Pin */}
            <div className="border-t border-zinc-200 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <MapPin className="w-3.5 h-3.5 text-[#34D399]" />
                <span className="font-mono">Wimbledon Station (SW19)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Search Results Count */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-zinc-500">
          Sourced Results ({userType === 'employer' ? filteredWorkers.length : filteredJobs.length})
        </h3>
        {selectedTrade && (
          <span className="text-xs font-mono font-bold bg-[#34D399]/10 border border-[#34D399]/20 text-[#10B981] px-2 py-0.5 rounded">
            {selectedTrade.toUpperCase()}{selectedSubcategory ? ` • ${selectedSubcategory.toUpperCase()}` : ''}
          </span>
        )}
      </div>

      {/* Results Listings */}
      {userType === 'employer' ? (
        filteredWorkers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWorkers.map((worker) => (
              <div 
                key={worker.id}
                className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs hover:border-[#34D399]/30 transition-all flex flex-col justify-between"
              >
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
        filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <div 
                key={job.id}
                className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs hover:border-[#34D399]/30 transition-all flex flex-col justify-between"
              >
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
