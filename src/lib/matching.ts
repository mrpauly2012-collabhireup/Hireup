import { JobProfile, WorkerProfile } from '../types';

export interface MatchBreakdown {
  trade: number;
  qualifications: number;
  experience: number;
  location: number;
  availability: number;
  pay: number;
  verification: number;
  profile: number;
}

export interface MatchScore {
  score: number;
  label: 'Perfect Match' | 'Excellent Match' | 'Strong Match' | 'Good Match' | 'Weak Match';
  reasons: string[];
  strengths: string[];
  gaps: string[];
  breakdown: MatchBreakdown;
}

export interface ProfileImprovement {
  label: string;
  points: number;
  completed: boolean;
}

export interface ParsedRecruitmentQuery {
  raw: string;
  terms: string[];
  tradeTerms: string[];
  locations: string[];
  qualifications: string[];
  licences: string[];
  minimumRate: number | null;
  urgency: boolean;
  weekend: boolean;
}

const normalise = (value?: string | null): string =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9£]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const words = (value?: string | null): string[] =>
  normalise(value)
    .split(' ')
    .filter(word => word.length > 2);

const similar = (left?: string | null, right?: string | null): boolean => {
  const a = normalise(left);
  const b = normalise(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;

  const aWords = new Set(words(a));
  const bWords = words(b);
  return bWords.some(word => aWords.has(word));
};

const listOverlap = (left: string[] = [], right: string[] = []): string[] =>
  left.filter(item => right.some(target => similar(item, target)));

const extractNumber = (value?: string | null): number => {
  const values = (value || '').match(/\d+(?:\.\d+)?/g);
  if (!values?.length) return 0;
  return Math.max(...values.map(Number));
};

const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const matchLabel = (score: number): MatchScore['label'] => {
  if (score >= 92) return 'Perfect Match';
  if (score >= 82) return 'Excellent Match';
  if (score >= 68) return 'Strong Match';
  if (score >= 50) return 'Good Match';
  return 'Weak Match';
};

const availabilityMatches = (worker: WorkerProfile, job: JobProfile): boolean => {
  const availability = normalise(worker.availability);
  const start = normalise(job.startDate);

  if (!availability || !start) return false;
  if (availability.includes('immediate') || availability.includes('now')) return true;
  return similar(availability, start);
};

export function calculateProfileStrength(worker: WorkerProfile): {
  score: number;
  improvements: ProfileImprovement[];
} {
  const improvements: ProfileImprovement[] = [
    { label: 'Add a clear profile photo', points: 8, completed: Boolean(worker.profilePhotoUrl || worker.avatar) },
    { label: 'Add qualifications', points: 12, completed: (worker.qualifications || []).length > 0 },
    { label: 'Add licences', points: 10, completed: (worker.licences || []).length > 0 },
    { label: 'Add employment history', points: 12, completed: (worker.workHistory || []).length > 0 },
    { label: 'Add portfolio images', points: 10, completed: (worker.galleryImages || worker.portfolio || []).length > 0 },
    { label: 'Add references', points: 8, completed: (worker.references || []).length > 0 },
    { label: 'Complete tools and transport', points: 8, completed: (worker.toolsAndTransport || []).length > 0 },
    { label: 'Add an About section', points: 8, completed: Boolean(worker.about?.trim()) },
    { label: 'Set availability', points: 7, completed: Boolean(worker.availability?.trim()) },
    { label: 'Set expected pay', points: 7, completed: Boolean(worker.payRate?.trim()) },
    { label: 'Verify the worker profile', points: 10, completed: Boolean(worker.verified) },
  ];

  const score = clamp(
    improvements.reduce((total, item) => total + (item.completed ? item.points : 0), 0)
  );

  return { score, improvements };
}

export function scoreWorkerForJob(
  worker: WorkerProfile,
  job: JobProfile
): MatchScore {
  const reasons: string[] = [];
  const strengths: string[] = [];
  const gaps: string[] = [];

  let trade = 0;
  if (similar(worker.trade, job.trade)) {
    trade = 100;
    reasons.push(`Trade matches: ${worker.trade}`);
  } else if (
    worker.subcategory &&
    job.subcategory &&
    similar(worker.subcategory, job.subcategory)
  ) {
    trade = 70;
    reasons.push('Specialism is closely related');
  } else {
    gaps.push(`Trade differs from ${job.trade}`);
  }

  let qualifications = 0;
  const workerCredentials = [
    ...(worker.qualifications || []),
    ...(worker.licences || []),
    ...(worker.verifiedBadges || []),
  ];
  const requiredCredentials = [
    ...(job.qualifications || []),
    ...(job.requirements || []),
  ];
  const credentialMatches = listOverlap(workerCredentials, requiredCredentials);

  if (requiredCredentials.length === 0) {
    qualifications = 85;
    strengths.push('No missing mandatory credentials identified');
  } else {
    qualifications = clamp((credentialMatches.length / requiredCredentials.length) * 100);

    if (credentialMatches.length) {
      reasons.push(
        `${credentialMatches.length} required credential${
          credentialMatches.length === 1 ? '' : 's'
        } matched`
      );
      strengths.push(...credentialMatches.slice(0, 3));
    }

    const missing = requiredCredentials.filter(
      requirement =>
        !workerCredentials.some(credential => similar(credential, requirement))
    );
    gaps.push(...missing.slice(0, 3).map(item => `May need: ${item}`));
  }

  const years = extractNumber(worker.experience);
  const experience = years >= 10 ? 100 : years >= 7 ? 90 : years >= 5 ? 80 : years >= 3 ? 65 : years >= 1 ? 45 : 20;
  if (years > 0) strengths.push(`${years}+ years of experience`);

  let location = 35;
  if (similar(worker.location, job.location)) {
    location = 100;
    reasons.push(`Location matches: ${job.location}`);
  } else if (worker.location && job.location) {
    gaps.push(`Location differs: ${worker.location} / ${job.location}`);
  }

  let availability = 45;
  if (availabilityMatches(worker, job)) {
    availability = 100;
    reasons.push('Availability suits the start date');
  } else if (normalise(worker.availability).includes('immediate')) {
    availability = 90;
    reasons.push('Available immediately');
  }

  let pay = 50;
  const workerRate = extractNumber(worker.payRate);
  const jobRate = extractNumber(job.payRate);
  if (workerRate && jobRate) {
    const difference = Math.abs(workerRate - jobRate);
    const tolerance = Math.max(jobRate * 0.2, 25);

    if (difference <= tolerance) {
      pay = 100;
      reasons.push('Pay expectations are aligned');
    } else if (workerRate <= jobRate) {
      pay = 90;
      reasons.push('Job rate meets worker expectation');
    } else {
      pay = clamp(100 - (difference / Math.max(jobRate, 1)) * 100);
      gaps.push('Worker rate may exceed the vacancy rate');
    }
  }

  const verification = worker.verified ? 100 : 35;
  if (worker.verified) strengths.push('Verified worker');
  else gaps.push('Profile is not yet verified');

  const profile = calculateProfileStrength(worker).score;
  const score = clamp(
    trade * 0.28 +
      qualifications * 0.2 +
      experience * 0.1 +
      location * 0.14 +
      availability * 0.1 +
      pay * 0.1 +
      verification * 0.03 +
      profile * 0.05
  );

  return {
    score: Math.max(1, Math.min(99, score)),
    label: matchLabel(score),
    reasons: reasons.slice(0, 5),
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 5),
    breakdown: {
      trade,
      qualifications,
      experience,
      location,
      availability,
      pay,
      verification,
      profile,
    },
  };
}

export function rankJobsForWorker(
  worker: WorkerProfile,
  jobs: JobProfile[]
): Array<{ item: JobProfile; match: MatchScore }> {
  return jobs
    .map(item => ({ item, match: scoreWorkerForJob(worker, item) }))
    .sort((a, b) => b.match.score - a.match.score);
}

export function rankWorkersForJob(
  job: JobProfile,
  workers: WorkerProfile[]
): Array<{ item: WorkerProfile; match: MatchScore }> {
  return workers
    .map(item => ({ item, match: scoreWorkerForJob(item, job) }))
    .sort((a, b) => b.match.score - a.match.score);
}

export function bestWorkerMatchAcrossJobs(
  worker: WorkerProfile,
  jobs: JobProfile[]
): MatchScore {
  const ranked = rankJobsForWorker(worker, jobs);
  return ranked[0]?.match || {
    score: 1,
    label: 'Weak Match',
    reasons: ['Create a vacancy to calculate a stronger match'],
    strengths: [],
    gaps: [],
    breakdown: {
      trade: 0,
      qualifications: 0,
      experience: 0,
      location: 0,
      availability: 0,
      pay: 0,
      verification: worker.verified ? 100 : 35,
      profile: calculateProfileStrength(worker).score,
    },
  };
}

const knownTrades = [
  'electrician', 'electrical', 'plumber', 'plumbing', 'bricklayer', 'bricklaying',
  'carpenter', 'carpentry', 'joiner', 'roofer', 'roofing', 'labourer', 'labour',
  'painter', 'decorator', 'plasterer', 'tiler', 'welder', 'groundworker',
  'site manager', 'project manager', 'heating engineer', 'gas engineer',
];

const knownCredentials = [
  'cscs', 'ecs', 'ipaf', 'pasma', 'sssts', 'smsts', 'first aid', 'nvq',
  'city and guilds', 'niceic', 'gas safe', 'jib',
];

export function parseRecruitmentQuery(query: string): ParsedRecruitmentQuery {
  const clean = normalise(query);
  const allTerms = words(clean);
  const rateMatch = clean.match(/£?\s*(\d{2,4})\s*(?:\/|per)?\s*(?:day|daily|hour|hr)?/i);

  return {
    raw: query,
    terms: allTerms,
    tradeTerms: knownTrades.filter(term => clean.includes(term)),
    locations: [],
    qualifications: knownCredentials.filter(term => clean.includes(term)),
    licences: knownCredentials.filter(term => clean.includes(term)),
    minimumRate: rateMatch ? Number(rateMatch[1]) : null,
    urgency:
      clean.includes('immediate') ||
      clean.includes('tomorrow') ||
      clean.includes('monday') ||
      clean.includes('urgent'),
    weekend: clean.includes('weekend') || clean.includes('saturday') || clean.includes('sunday'),
  };
}

export function scoreJobAgainstNaturalLanguage(
  job: JobProfile,
  query: string,
  worker?: WorkerProfile
): number {
  const parsed = parseRecruitmentQuery(query);
  if (!parsed.raw.trim()) return worker ? scoreWorkerForJob(worker, job).score : 0;

  const searchable = normalise(
    [
      job.title,
      job.trade,
      job.subcategory,
      job.location,
      job.description,
      job.employmentType,
      job.duration,
      ...(job.qualifications || []),
      ...(job.requirements || []),
      ...(job.benefits || []),
    ].join(' ')
  );

  let queryScore = 0;
  parsed.terms.forEach(term => {
    if (searchable.includes(term)) queryScore += 8;
  });

  if (parsed.minimumRate && extractNumber(job.payRate) >= parsed.minimumRate) queryScore += 20;
  if (parsed.urgency && (normalise(job.startDate).includes('immediate') || searchable.includes('urgent'))) queryScore += 15;
  if (parsed.weekend && searchable.includes('weekend')) queryScore += 15;

  const profileScore = worker ? scoreWorkerForJob(worker, job).score : 50;
  return clamp(queryScore * 0.55 + profileScore * 0.45);
}

export function scoreWorkerAgainstNaturalLanguage(
  worker: WorkerProfile,
  query: string,
  jobs: JobProfile[] = []
): number {
  const parsed = parseRecruitmentQuery(query);
  if (!parsed.raw.trim()) return bestWorkerMatchAcrossJobs(worker, jobs).score;

  const searchable = normalise(
    [
      worker.name,
      worker.trade,
      worker.subcategory,
      worker.location,
      worker.availability,
      worker.experience,
      worker.about,
      ...(worker.qualifications || []),
      ...(worker.licences || []),
      ...(worker.verifiedBadges || []),
      ...(worker.toolsAndTransport || []),
    ].join(' ')
  );

  let queryScore = 0;
  parsed.terms.forEach(term => {
    if (searchable.includes(term)) queryScore += 8;
  });

  if (parsed.minimumRate && extractNumber(worker.payRate) <= parsed.minimumRate) queryScore += 20;
  if (parsed.urgency && normalise(worker.availability).includes('immediate')) queryScore += 15;
  if (worker.verified) queryScore += 5;

  const vacancyScore = jobs.length ? bestWorkerMatchAcrossJobs(worker, jobs).score : 50;
  return clamp(queryScore * 0.6 + vacancyScore * 0.4);
}