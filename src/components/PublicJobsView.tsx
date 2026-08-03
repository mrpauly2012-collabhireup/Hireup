import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { JobProfile } from '../types';
import {
  createJobSeoSlug,
  fetchPublicJobBySlug,
  fetchPublicJobs,
} from '../lib/supabase';
import { HIREUP_LOGO } from '../constants';

const SITE_URL = 'https://hireupapp.netlify.app';

function setMetaTag(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value);
  });
}

function setCanonical(url: string) {
  let canonical = document.head.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }

  canonical.href = url;
}

function slugFromPath(): string | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts.length > 1 ? decodeURIComponent(parts.slice(1).join('/')) : null;
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function formatDate(value?: string) {
  if (!value) return 'Recently added';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function normaliseEmploymentType(value: string) {
  const lower = value.toLowerCase();

  if (lower.includes('full')) return 'FULL_TIME';
  if (lower.includes('part')) return 'PART_TIME';
  if (lower.includes('temporary') || lower.includes('temp')) return 'TEMPORARY';
  if (lower.includes('intern')) return 'INTERN';
  if (lower.includes('volunteer')) return 'VOLUNTEER';
  if (lower.includes('per diem')) return 'PER_DIEM';
  if (lower.includes('contract') || lower.includes('cis')) return 'CONTRACTOR';

  return 'OTHER';
}

function extractPayValue(payRate: string) {
  const match = payRate.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : undefined;
}

function extractPayUnit(payRate: string) {
  const lower = payRate.toLowerCase();

  if (lower.includes('hour')) return 'HOUR';
  if (lower.includes('week')) return 'WEEK';
  if (lower.includes('month')) return 'MONTH';
  if (lower.includes('year') || lower.includes('annual')) return 'YEAR';

  return 'DAY';
}

function JobCard({
  job,
  onOpen,
}: {
  job: JobProfile;
  onOpen: (job: JobProfile) => void;
}) {
  return (
    <article className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl border border-zinc-200 bg-white p-2 flex items-center justify-center flex-shrink-0">
          <img
            src={job.companyLogo || HIREUP_LOGO}
            alt={`${job.companyName} logo`}
            className="max-w-full max-h-full object-contain"
            onError={event => {
              event.currentTarget.src = HIREUP_LOGO;
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {job.featured && (
              <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-black uppercase">
                Featured
              </span>
            )}

            {job.urgent && (
              <span className="px-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[9px] font-black uppercase">
                Urgent
              </span>
            )}

            {job.verified && (
              <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-black uppercase">
                Verified contractor
              </span>
            )}
          </div>

          <h2 className="text-lg font-black text-zinc-950 mt-2">
            {job.title}
          </h2>

          <p className="text-sm font-bold text-zinc-700 mt-1">
            {job.companyName}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs text-zinc-700">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              {job.location}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <WalletCards className="w-4 h-4 text-emerald-600" />
              {job.payRate}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              {job.employmentType}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-zinc-700 leading-6 mt-4 line-clamp-3">
        {job.description || `Apply for this ${job.trade} opportunity in ${job.location}.`}
      </p>

      <button
        type="button"
        onClick={() => onOpen(job)}
        className="mt-5 w-full px-4 py-3 rounded-xl bg-zinc-950 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
      >
        View job details
        <ArrowRight className="w-4 h-4" />
      </button>
    </article>
  );
}

function JobsDirectory({
  onOpenApp,
}: {
  onOpenApp: () => void;
}) {
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title =
      'Construction Jobs in East & West Sussex and Across the UK | HireUp';

    setMetaTag('meta[name="description"]', {
      name: 'description',
      content:
        'Browse construction jobs across the UK with a specialist focus on East Sussex and West Sussex. Find electrician, plumbing, carpentry, bricklaying, labouring and other skilled trade vacancies on HireUp.',
    });

    setCanonical(`${SITE_URL}/jobs`);

    fetchPublicJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter(job =>
      [
        job.title,
        job.trade,
        job.subcategory,
        job.location,
        job.companyName,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
    );
  }, [jobs, searchTerm]);

  const openJob = (job: JobProfile) => {
    navigate(`/jobs/${createJobSeoSlug(job)}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="w-44 h-16 flex items-center"
          >
            <img
              src={HIREUP_LOGO}
              alt="HireUp"
              className="w-full h-full object-contain object-left"
            />
          </button>

          <button
            type="button"
            onClick={onOpenApp}
            className="px-4 py-2.5 rounded-xl bg-[#34D399] text-zinc-950 text-sm font-black hover:bg-emerald-400 transition-all"
          >
            Sign in or join HireUp
          </button>
        </div>
      </header>

      <main>
        <section className="bg-zinc-950 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              UK construction recruitment
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-5 max-w-4xl">
              Construction jobs across the UK, specialising in East and West Sussex
            </h1>

            <p className="text-zinc-300 text-base sm:text-lg leading-8 mt-5 max-w-3xl">
              Discover live opportunities for electricians, plumbers, carpenters,
              bricklayers, labourers and other skilled trades across Brighton,
              Worthing, Crawley, Eastbourne, Horsham and the wider UK.
            </p>

            <div className="mt-8 max-w-2xl relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="search"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search by trade, job title, company or location"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-zinc-950 border border-white focus:outline-none focus:ring-4 focus:ring-emerald-400/20"
              />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                Live opportunities
              </p>
              <h2 className="text-2xl font-black text-zinc-950 mt-1">
                Current construction vacancies
              </h2>
            </div>

            {!loading && (
              <span className="text-sm font-bold text-zinc-600">
                {filteredJobs.length} job{filteredJobs.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
              <p className="font-bold text-zinc-700">Loading live jobs…</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
              <Briefcase className="w-10 h-10 text-zinc-300 mx-auto" />
              <h2 className="font-black text-zinc-950 mt-4">
                No matching jobs found
              </h2>
              <p className="text-sm text-zinc-600 mt-2">
                Try a different trade or Sussex location.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} onOpen={openJob} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-zinc-600">
          © 2026 HireUp. Construction recruitment across the UK, East Sussex
          and West Sussex.
        </div>
      </footer>
    </div>
  );
}

function JobDetails({
  slug,
  onOpenApp,
}: {
  slug: string;
  onOpenApp: () => void;
}) {
  const [job, setJob] = useState<JobProfile | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPublicJobBySlug(slug), fetchPublicJobs()])
      .then(([selectedJob, allJobs]) => {
        setJob(selectedJob);

        if (selectedJob) {
          setRelatedJobs(
            allJobs
              .filter(
                item =>
                  item.id !== selectedJob.id &&
                  (item.trade === selectedJob.trade ||
                    item.location === selectedJob.location)
              )
              .slice(0, 3)
          );
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!job) return;

    const canonicalUrl = `${SITE_URL}/jobs/${createJobSeoSlug(job)}`;
    const title = `${job.title} in ${job.location} | ${job.payRate} | HireUp`;
    const description = `${job.title} opportunity in ${job.location} with ${job.companyName}. ${job.payRate}, ${job.employmentType}. View requirements and apply through HireUp.`;

    document.title = title;
    setCanonical(canonicalUrl);

    setMetaTag('meta[name="description"]', {
      name: 'description',
      content: description,
    });

    setMetaTag('meta[property="og:title"]', {
      property: 'og:title',
      content: title,
    });

    setMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    });

    setMetaTag('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl,
    });

    const previousSchema = document.getElementById('hireup-job-posting-schema');
    previousSchema?.remove();

    const schema = document.createElement('script');
    schema.id = 'hireup-job-posting-schema';
    schema.type = 'application/ld+json';

    const payValue = extractPayValue(job.payRate);

    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description:
        job.description ||
        `${job.trade} opportunity with ${job.companyName} in ${job.location}.`,
      datePosted: job.createdAt || new Date().toISOString(),
      employmentType: normaliseEmploymentType(job.employmentType),
      hiringOrganization: {
        '@type': 'Organization',
        name: job.companyName,
        sameAs: SITE_URL,
        logo: job.companyLogo || HIREUP_LOGO,
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.location,
          postalCode: job.postcode || undefined,
          addressRegion:
            job.location.toLowerCase().includes('east sussex')
              ? 'East Sussex'
              : job.location.toLowerCase().includes('west sussex')
                ? 'West Sussex'
                : undefined,
          addressCountry: 'GB',
        },
      },
      baseSalary: payValue
        ? {
            '@type': 'MonetaryAmount',
            currency: 'GBP',
            value: {
              '@type': 'QuantitativeValue',
              value: payValue,
              unitText: extractPayUnit(job.payRate),
            },
          }
        : undefined,
      directApply: true,
      url: canonicalUrl,
    });

    document.head.appendChild(schema);

    return () => schema.remove();
  }, [job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <p className="font-bold text-zinc-700">Loading job details…</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm">
          <Briefcase className="w-12 h-12 text-zinc-300 mx-auto" />
          <h1 className="text-2xl font-black text-zinc-950 mt-4">
            This job is no longer available
          </h1>
          <p className="text-sm text-zinc-600 mt-3">
            It may have been filled, removed or replaced with a newer vacancy.
          </p>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="mt-6 px-5 py-3 rounded-xl bg-zinc-950 text-white font-black"
          >
            Browse current jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="w-44 h-16 flex items-center"
          >
            <img
              src={HIREUP_LOGO}
              alt="HireUp"
              className="w-full h-full object-contain object-left"
            />
          </button>

          <button
            type="button"
            onClick={onOpenApp}
            className="px-4 py-2.5 rounded-xl bg-[#34D399] text-zinc-950 text-sm font-black"
          >
            Apply through HireUp
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="text-sm font-black text-emerald-700 hover:text-emerald-800"
        >
          ← Back to all construction jobs
        </button>

        <div className="grid lg:grid-cols-[1fr_340px] gap-7 mt-6">
          <article className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 sm:p-8 border-b border-zinc-200">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl border border-zinc-200 bg-white p-2 flex items-center justify-center flex-shrink-0">
                  <img
                    src={job.companyLogo || HIREUP_LOGO}
                    alt={`${job.companyName} logo`}
                    className="max-w-full max-h-full object-contain"
                    onError={event => {
                      event.currentTarget.src = HIREUP_LOGO;
                    }}
                  />
                </div>

                <div>
                  <div className="flex flex-wrap gap-2">
                    {job.featured && (
                      <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-black uppercase">
                        Featured job
                      </span>
                    )}
                    {job.verified && (
                      <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-black uppercase">
                        Verified contractor
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-950 mt-3">
                    {job.title}
                  </h1>

                  <p className="text-base font-bold text-zinc-700 mt-2">
                    {job.companyName}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-7">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500">
                      Location
                    </p>
                    <p className="text-sm font-black text-zinc-950 mt-0.5">
                      {job.location}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
                  <WalletCards className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500">
                      Pay
                    </p>
                    <p className="text-sm font-black text-zinc-950 mt-0.5">
                      {job.payRate}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500">
                      Employment
                    </p>
                    <p className="text-sm font-black text-zinc-950 mt-0.5">
                      {job.employmentType}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
                  <Clock3 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500">
                      Duration
                    </p>
                    <p className="text-sm font-black text-zinc-950 mt-0.5">
                      {job.duration}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <section>
                <h2 className="text-xl font-black text-zinc-950">
                  About this construction job
                </h2>
                <p className="text-sm sm:text-base text-zinc-700 leading-7 mt-3 whitespace-pre-line">
                  {job.description ||
                    `A ${job.trade} opportunity is available with ${job.companyName} in ${job.location}.`}
                </p>
              </section>

              {job.requirements.length > 0 && (
                <section>
                  <h2 className="text-xl font-black text-zinc-950">
                    Job requirements
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    {job.requirements.map(requirement => (
                      <div
                        key={requirement}
                        className="flex items-start gap-2.5 text-sm text-zinc-700"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span>{requirement}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {job.qualifications.length > 0 && (
                <section>
                  <h2 className="text-xl font-black text-zinc-950">
                    Qualifications
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.qualifications.map(qualification => (
                      <span
                        key={qualification}
                        className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold"
                      >
                        {qualification}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {job.benefits.length > 0 && (
                <section>
                  <h2 className="text-xl font-black text-zinc-950">
                    Benefits
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    {job.benefits.map(benefit => (
                      <div
                        key={benefit}
                        className="flex items-start gap-2.5 text-sm text-zinc-700"
                      >
                        <BadgeCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </article>

          <aside className="space-y-5">
            <div className="bg-zinc-950 text-white rounded-3xl p-6 sticky top-6">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Apply through HireUp
              </p>
              <h2 className="text-xl font-black mt-2">
                Interested in this {job.trade} job?
              </h2>
              <p className="text-sm text-zinc-300 leading-6 mt-3">
                Create a worker account or sign in to apply, track your
                application and speak directly with the contractor.
              </p>

              <button
                type="button"
                onClick={onOpenApp}
                className="mt-5 w-full px-4 py-3.5 rounded-xl bg-[#34D399] text-zinc-950 font-black flex items-center justify-center gap-2"
              >
                Apply now
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="border-t border-zinc-800 mt-5 pt-5 space-y-3 text-xs text-zinc-300">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Contractor verification shown where available
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  Posted {formatDate(job.createdAt)}
                </p>
                <p className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  {job.companyName}
                </p>
              </div>
            </div>
          </aside>
        </div>

        {relatedJobs.length > 0 && (
          <section className="mt-12">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
              More opportunities
            </p>
            <h2 className="text-2xl font-black text-zinc-950 mt-1">
              Related construction jobs
            </h2>

            <div className="grid md:grid-cols-3 gap-5 mt-6">
              {relatedJobs.map(relatedJob => (
                <JobCard
                  key={relatedJob.id}
                  job={relatedJob}
                  onOpen={selected => navigate(`/jobs/${createJobSeoSlug(selected)}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function PublicJobsView({
  onOpenApp,
}: {
  onOpenApp: () => void;
}) {
  const [routeVersion, setRouteVersion] = useState(0);

  useEffect(() => {
    const handlePopState = () => setRouteVersion(version => version + 1);
    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const slug = useMemo(() => slugFromPath(), [routeVersion]);

  return slug ? (
    <JobDetails slug={slug} onOpenApp={onOpenApp} />
  ) : (
    <JobsDirectory onOpenApp={onOpenApp} />
  );
}