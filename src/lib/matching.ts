import { JobProfile, WorkerProfile } from '../types';

export interface MatchScore {
  score: number;
  reasons: string[];
  strengths: string[];
  gaps: string[];
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

const experienceYears = (value?: string | null): number =>
  extractNumber(value);

const availabilityMatches = (worker: WorkerProfile, job: JobProfile): boolean => {
  const availability = normalise(worker.availability);
  const start = normalise(job.startDate);

  if (!availability || !start) return false;
  if (availability.includes('immediate') || availability.includes('now')) return true;
  return similar(availability, start);
};

export function scoreWorkerForJob(
  worker: WorkerProfile,
  job: JobProfile
): MatchScore {
  let score = 0;
  const reasons: string[] = [];
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (similar(worker.trade, job.trade)) {
    score += 28;
    reasons.push(`Trade matches: ${worker.trade}`);
  } else {
    gaps.push(`Trade differs from ${job.trade}`);
  }

  if (
    worker.subcategory &&
    job.subcategory &&
    similar(worker.subcategory, job.subcategory)
  ) {
    score += 8;
    reasons.push('Specialism matches');
  }

  const workerCredentials = [
    ...(worker.qualifications || []),
    ...(worker.licences || []),
    ...(worker.verifiedBadges || []),
  ];
  const requiredCredentials = [
    ...(job.qualifications || []),
    ...(job.requirements || []),
  ];
  const credentialMatches = listOverlap(
    workerCredentials,
    requiredCredentials
  );

  if (requiredCredentials.length === 0) {
    score += 12;
    strengths.push('No missing mandatory credentials identified');
  } else {
    const credentialRatio = credentialMatches.length / requiredCredentials.length;
    score += Math.round(Math.min(1, credentialRatio) * 20);

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

  if (similar(worker.location, job.location)) {
    score += 14;
    reasons.push(`Location matches: ${job.location}`);
  } else if (worker.location && job.location) {
    score += 3;
    gaps.push(`Location differs: ${worker.location} / ${job.location}`);
  }

  if (availabilityMatches(worker, job)) {
    score += 10;
    reasons.push('Availability suits the start date');
  } else if (normalise(worker.availability).includes('immediate')) {
    score += 8;
    reasons.push('Available immediately');
  }

  const workerRate = extractNumber(worker.payRate);
  const jobRate = extractNumber(job.payRate);
  if (workerRate && jobRate) {
    const difference = Math.abs(workerRate - jobRate);
    const tolerance = Math.max(jobRate * 0.2, 25);

    if (difference <= tolerance) {
      score += 10;
      reasons.push('Pay expectations are aligned');
    } else if (workerRate <= jobRate) {
      score += 8;
      reasons.push('Job rate meets worker expectation');
    } else {
      gaps.push('Worker rate may exceed the vacancy rate');
    }
  }

  const years = experienceYears(worker.experience);
  if (years >= 5) {
    score += 5;
    strengths.push(`${years}+ years of experience`);
  } else if (years >= 2) {
    score += 3;
    strengths.push(`${years}+ years of experience`);
  }

  if (worker.verified) {
    score += 3;
    strengths.push('Verified worker');
  }

  if ((worker.rating || 0) >= 4.5) {
    score += 2;
    strengths.push(`Strong rating: ${Number(worker.rating).toFixed(1)}`);
  }

  return {
    score: Math.max(1, Math.min(99, Math.round(score))),
    reasons: reasons.slice(0, 4),
    strengths: strengths.slice(0, 4),
    gaps: gaps.slice(0, 4),
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
    reasons: ['Create a vacancy to calculate a stronger match'],
    strengths: [],
    gaps: [],
  };
}