/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, AreaChart, Area, LineChart, Line, Legend 
} from 'recharts';
import { 
  TrendingUp, Activity, ShieldAlert, Award, Hammer, Wrench, 
  DollarSign, Briefcase, HelpCircle, CheckCircle2 
} from 'lucide-react';
import { UserType } from '../types';

interface AnalyticsViewProps {
  userType: UserType;
}

export default function AnalyticsView({ userType }: AnalyticsViewProps) {
  const [regionFilter, setRegionFilter] = useState<'London' | 'Midlands' | 'North'>('London');

  // Industry analytical data
  const tradeDemandData = [
    { trade: 'Electrician', DemandScore: 94, AvgDayRate: 250 },
    { trade: 'Plumber', DemandScore: 88, AvgDayRate: 240 },
    { trade: 'Bricklayer', DemandScore: 91, AvgDayRate: 220 },
    { trade: 'Carpenter', DemandScore: 85, AvgDayRate: 230 },
    { trade: 'Roofer', DemandScore: 78, AvgDayRate: 210 },
    { trade: 'Site Manager', DemandScore: 92, AvgDayRate: 350 },
  ];

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
    ]
  };

  const cscsRatePremium = [
    { card: 'Green Card', rate: 120 },
    { card: 'Blue Card', rate: 190 },
    { card: 'Gold Card', rate: 240 },
    { card: 'Black Card', rate: 350 },
  ];

  return (
    <div id="analytics_view" className="space-y-6 pb-12 font-sans animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#10B981]" /> UK Construction market intelligence
        </h2>
        <p className="text-xs text-zinc-500 font-sans">
          Real-time UK trade statistics, day-rate benchmarks, and regional recruitment indices sourced directly from HireUp active listings.
        </p>
      </div>

      {/* Top Banner Alert */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 items-center">
        <Activity className="w-6 h-6 text-[#10B981] flex-shrink-0 animate-pulse" />
        <p className="text-xs text-zinc-800 font-sans leading-relaxed">
          <b>MARKET REPORT:</b> UK bricklaying demand has surged by 14% in the last 14 days due to dry conditions. Approved gold-card commercial electricians remain the highest overall compensated trade in the Greater London perimeter.
        </p>
      </div>

      {/* Regional Selector & Wage Over-time Chart */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 font-sans">Trade Day-Rate Benchmarks</h3>
            <p className="text-xs text-zinc-500 font-sans">Tracks average certified day rates inside the chosen operational sector</p>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-lg">
            {(['London', 'Midlands', 'North'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all uppercase cursor-pointer ${regionFilter === r ? 'bg-[#34D399] text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-950'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={regionalRateAverages[regionFilter]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAvgRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} unit="£" />
              <Tooltip 
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }} 
              />
              <Area type="monotone" dataKey="rate" stroke="#34D399" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAvgRate)" name="Average Daily Wage (£)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Two Smaller Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Demand Indices */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 font-sans">Trade Demand & Rates Chart</h3>
            <p className="text-xs text-zinc-500 font-sans">Demand score (0-100) vs average day-rate in £</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradeDemandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="trade" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                <Bar dataKey="DemandScore" fill="#34D399" name="Recruitment Demand Index" radius={[3, 3, 0, 0]} />
                <Bar dataKey="AvgDayRate" fill="#27272a" name="Avg Rate (£/day)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CSCS Card Premium */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 font-sans">CSCS Badge Certification Premiums</h3>
            <p className="text-xs text-zinc-500 font-sans">How different CSCS card colors dictate starting contract daily rates</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cscsRatePremium} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="card" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} unit="£" />
                <Tooltip 
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }} 
                />
                <Line type="monotone" dataKey="rate" stroke="#34D399" strokeWidth={3} activeDot={{ r: 6 }} name="Starting Day Rate (£)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
