/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, MapPin, Award, Users, Star, 
  ChevronRight, ArrowUpRight, Search, Activity, HelpCircle,
  Globe, FileText, CheckCircle2, ExternalLink, Mail, Phone
} from 'lucide-react';
import { CompanyProfile, JobProfile } from '../types';

interface CompaniesViewProps {
  companies: CompanyProfile[];
  jobs: JobProfile[];
  onSelectJob: (job: JobProfile) => void;
}

export default function CompaniesView({
  companies,
  jobs,
  onSelectJob
}: CompaniesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="companies_view" className="space-y-6 pb-12 font-sans animate-fade-in">
      
      {/* Title & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-[#10B981]" /> Verified Companies
          </h2>
          <p className="text-xs text-zinc-500">
            Browse registered builders, main contractors, and mechanical subcontractors active on the HireUp platform.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified builders..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs placeholder-zinc-400 focus:outline-none focus:border-[#34D399] font-sans font-medium"
          />
        </div>
      </div>

      {/* Companies Listings */}
      <div className="space-y-6">
        {filteredCompanies.map((comp) => {
          // Resolve vacancies for this specific company
          const companyVacancies = jobs.filter(j => j.companyId === comp.id);

          return (
            <div 
              key={comp.id}
              className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:border-[#34D399]/20 transition-all"
            >
              {/* Header Image and Logo banner */}
              <div className="relative h-28 bg-zinc-950">
                <img 
                  src={comp.coverImage} 
                  alt={comp.name} 
                  className="w-full h-full object-cover opacity-50"
                  referrerPolicy="no-referrer"
                />
                {comp.verified && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-zinc-900/80 backdrop-blur-md border border-emerald-500 rounded text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-0.5 uppercase">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> PLATINUM CONTRACTOR
                  </div>
                )}
              </div>

              {/* Company Info Box */}
              <div className="p-5 relative">
                <div className="absolute -top-10 left-5 border-4 border-white rounded-xl overflow-hidden w-20 h-20 bg-white shadow-sm flex items-center justify-center p-2">
                  <img 
                    src={comp.logo} 
                    alt={comp.name} 
                    className="max-w-full max-h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="pt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bio block */}
                  <div className="space-y-4 md:col-span-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-zinc-900 flex items-center gap-1.5 font-sans">
                          {comp.name}
                        </h3>
                        {comp.verified && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[8px] font-mono font-bold uppercase flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> VERIFIED
                          </span>
                        )}
                        {comp.website && (
                          <a 
                            href={comp.website} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-zinc-400 hover:text-[#10B981] flex items-center gap-0.5"
                          >
                            <Globe className="w-3.5 h-3.5" /> <span className="underline text-[10px]">Website</span>
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {comp.location} • HEADQUARTERS
                      </p>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed font-sans">{comp.description}</p>

                    {/* COMPLIANCE & LEGAL DETAILS */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-zinc-50 border border-zinc-150 p-3 rounded-xl text-[10px] font-mono text-zinc-600">
                      <div>
                        <span className="text-[8px] text-zinc-400 font-bold block uppercase">COMPANIES HOUSE</span>
                        <span className="font-bold text-zinc-900">{comp.companyHouseNumber || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-400 font-bold block uppercase">VAT REGISTERED</span>
                        <span className="font-bold text-zinc-900">{comp.vatNumber || 'Not registered'}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-400 font-bold block uppercase">INSURANCE LIABILITY</span>
                        <span className="font-bold text-emerald-700">{comp.insuranceStatus || comp.publicLiabilityInsurance || '£5M Verified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Stats panel */}
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex flex-col justify-between space-y-2 h-full">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase">PROJECTS</p>
                        <p className="text-sm font-bold text-zinc-950 mt-0.5">{comp.stats.projects}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase">STAFF</p>
                        <p className="text-sm font-bold text-zinc-950 mt-0.5">{comp.stats.workers}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase">RATING</p>
                        <p className="text-sm font-bold text-zinc-950 mt-0.5 flex items-center justify-center gap-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {comp.stats.rating || '5.0'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-zinc-200 pt-3 text-center">
                      <span className="text-xs font-mono font-bold text-zinc-500 uppercase">ACTIVE VACANCIES: </span>
                      <span className="text-xs font-mono font-black text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {companyVacancies.length} OPEN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Company project gallery */}
                {comp.companyGalleryImages && comp.companyGalleryImages.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2">
                    <h4 className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider">PROJECT PORTFOLIO PREVIEW</h4>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {comp.companyGalleryImages.map((imgUrl, idx) => (
                        <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 flex-shrink-0">
                          <img src={imgUrl} alt="Gallery Preview" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Open positions accordion list */}
                {companyVacancies.length > 0 && (
                  <div className="mt-6 border-t border-zinc-100 pt-5 space-y-3">
                    <h4 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-wider">AVAILABLE VACANCIES AT THIS FIRM</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {companyVacancies.map((vacancy) => (
                        <div 
                          key={vacancy.id}
                          className="p-3 bg-zinc-50 border border-zinc-100 hover:border-[#34D399]/30 rounded-xl flex justify-between items-center transition-all"
                        >
                          <div>
                            <p className="text-xs font-bold font-sans text-zinc-900">{vacancy.title}</p>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">{vacancy.trade} • {vacancy.payRate}</p>
                          </div>
                          <button
                            onClick={() => onSelectJob(vacancy)}
                            className="p-1.5 bg-zinc-900 hover:bg-[#34D399] text-white rounded-lg transition-all cursor-pointer"
                            title="Review Job Specifications"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
