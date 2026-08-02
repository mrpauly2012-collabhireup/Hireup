import React from 'react';
import {
  Users,
  Wrench,
  Building2,
  Briefcase,
  Heart,
  MessageSquare,
  Calendar,
  Star,
  AlertTriangle,
  BadgeCheck,
  Ban,
  RefreshCw,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import {
  AdminDashboardStats,
  AdminUser,
} from '../lib/supabase';

interface AdminDashboardProps {
  admin: AdminUser;
  stats: AdminDashboardStats | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSignOut: () => void;
}

export default function AdminDashboard({
  admin,
  stats,
  loading,
  error,
  onRefresh,
  onSignOut,
}: AdminDashboardProps) {
  const cards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: 'Workers and contractors',
    },
    {
      label: 'Workers',
      value: stats?.workers ?? 0,
      icon: Wrench,
      description: 'Registered trade profiles',
    },
    {
      label: 'Contractors',
      value: stats?.contractors ?? 0,
      icon: Building2,
      description: 'Registered companies',
    },
    {
      label: 'Live Jobs',
      value: stats?.liveJobs ?? 0,
      icon: Briefcase,
      description: 'Published vacancies',
    },
    {
      label: 'Matches',
      value: stats?.matches ?? 0,
      icon: Heart,
      description: 'Active recruitment links',
    },
    {
      label: 'Messages',
      value: stats?.messages ?? 0,
      icon: MessageSquare,
      description: 'Platform chat messages',
    },
    {
      label: 'Interviews',
      value: stats?.interviews ?? 0,
      icon: Calendar,
      description: 'Booked walkthroughs',
    },
    {
      label: 'Reviews',
      value: stats?.reviews ?? 0,
      icon: Star,
      description: 'Submitted reputation reviews',
    },
  ];

  const actionCards = [
    {
      label: 'Reported Reviews',
      value: stats?.reportedReviews ?? 0,
      icon: AlertTriangle,
      description: 'Awaiting moderation',
    },
    {
      label: 'Worker Verifications',
      value: stats?.pendingWorkerVerifications ?? 0,
      icon: BadgeCheck,
      description: 'Pending worker decisions',
    },
    {
      label: 'Contractor Verifications',
      value: stats?.pendingContractorVerifications ?? 0,
      icon: ShieldCheck,
      description: 'Pending company decisions',
    },
    {
      label: 'Suspended Accounts',
      value:
        (stats?.suspendedWorkers ?? 0) +
        (stats?.suspendedContractors ?? 0),
      icon: Ban,
      description: 'Workers and contractors',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-[#34D399] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black tracking-tight">
                HireUp Admin
              </h1>
              <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                {admin.role.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-2 bg-white border border-zinc-200 hover:border-[#34D399] rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-2 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <section className="bg-zinc-950 text-white rounded-3xl p-6 md:p-9 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#34D399]/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] rounded-full text-[10px] font-mono font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administration Console
            </span>
            <h2 className="text-2xl md:text-4xl font-black mt-4 tracking-tight">
              Platform control centre
            </h2>
            <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
              Review HireUp activity, monitor moderation queues, and manage
              verification and account safety from one secure dashboard.
            </p>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <strong>Admin dashboard error:</strong> {error}
          </div>
        )}

        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">
                Platform Overview
              </h3>
              <p className="text-xs text-zinc-500">
                Live totals from the connected Supabase project
              </p>
            </div>
            {loading && (
              <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase">
                Updating…
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {cards.map(card => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white border border-zinc-200 rounded-2xl p-4 md:p-5 shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-2xl md:text-3xl font-black mt-4">
                    {loading && !stats ? '—' : card.value.toLocaleString('en-GB')}
                  </p>
                  <p className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-wider mt-1">
                    {card.label}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-lg font-black uppercase tracking-tight">
              Action Required
            </h3>
            <p className="text-xs text-zinc-500">
              Queues that will connect to the next admin management screens
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {actionCards.map(card => {
              const Icon = card.icon;
              const needsAttention = card.value > 0;

              return (
                <button
                  key={card.label}
                  type="button"
                  className="bg-white border border-zinc-200 hover:border-[#34D399] rounded-2xl p-5 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        needsAttention
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#10B981]" />
                  </div>
                  <p className="text-2xl font-black mt-4">
                    {loading && !stats ? '—' : card.value.toLocaleString('en-GB')}
                  </p>
                  <p className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-wider mt-1">
                    {card.label}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}