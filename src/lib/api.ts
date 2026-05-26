const API_BASE = 'https://api.shetoken.org';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export interface Summary {
  global_wei_score: number;
  countries_scored: number;
  india_wei: number;
  tier_1_count: number;
  tier_2_count: number;
  tier_3_count: number;
  tier_4_count: number;
  highest_country: string;
  highest_score: number;
  lowest_country: string;
  lowest_score: number;
  last_updated: string;
}

export interface PerformanceSource {
  title: string;
  url: string;
  source: string;
  date: string;
  pillar: string;
}

export interface CountryWEI {
  rank: number;
  country: string;
  iso_code: string;
  ticker: string;
  region: string;
  tier: number;
  population_millions: number;
  wei_score: number;
  weekly_delta: number;
  empowerment_score: number;
  education_score: number;
  economic_score: number;
  health_score: number;
  bodily_autonomy_score: number;
  safety_justice_score: number;
  dignity_welfare_score: number;
  digital_social_score: number;
  violence_penalty_score: number;
  year: number;
  // SLM-generated fields (present when pipeline has run and signals exist)
  performance_summary?: string;
  sources?: PerformanceSource[];
}

export interface CountryListResponse {
  count: number;
  data: CountryWEI[];
}

export interface CountryHistory {
  iso_code: string;
  country: string;
  history: Array<Record<string, number | string>>;
}

export interface LifepathStage {
  age: string;
  title: string;
  girls_affected: number;
  description: string;
}

export interface Lifepath {
  country: string;
  iso_code: string;
  wei_score: number;
  stages: LifepathStage[];
}

export interface IndexScore {
  iso_code?: string;
  country?: string;
  score?: number;
  rank?: number;
  [key: string]: unknown;
}

export const api = {
  summary: () => apiFetch<Summary>('/v1/summary'),

  wei: {
    countries: (limit = 105) =>
      apiFetch<CountryListResponse>(`/v1/wei/countries?limit=${limit}&sort=wei_score&order=desc`),
    country: (iso: string) =>
      apiFetch<CountryWEI>(`/v1/wei/countries/${iso}`),
    history: (iso: string) =>
      apiFetch<CountryHistory>(`/v1/wei/history/country/${iso}`),
    globalTrend: () =>
      apiFetch<Array<Record<string, number | string>>>('/v1/wei/history/global-trend'),
    leaderboard: (limit = 10) =>
      apiFetch<CountryWEI[]>(`/v1/wei/leaderboard?limit=${limit}`),
  },

  gpi: {
    all: () => apiFetch<IndexScore[]>('/v1/gpi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/gpi/${iso}`),
  },

  svi: {
    all: () => apiFetch<IndexScore[]>('/v1/svi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/svi/${iso}`),
  },

  wadi: {
    all: () => apiFetch<IndexScore[]>('/v1/wadi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/wadi/${iso}`),
  },

  wevi: {
    all: () => apiFetch<IndexScore[]>('/v1/wevi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/wevi/${iso}`),
  },

  whi: {
    all: () => apiFetch<IndexScore[]>('/v1/whi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/whi/${iso}`),
  },

  wvi: {
    all: () => apiFetch<IndexScore[]>('/v1/wvi'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/wvi/${iso}`),
  },

  compliance: {
    countries: () => apiFetch<IndexScore[]>('/v1/compliance/countries'),
    country: (iso: string) => apiFetch<IndexScore>(`/v1/compliance/countries/${iso}`),
  },

  lifepath: (iso: string) => apiFetch<Lifepath>(`/v1/lifepath/${iso}`),

  signals: {
    latest: () => apiFetch<IndexScore[]>('/v1/signals/latest?limit=10'),
    topMovers: () => apiFetch<IndexScore[]>('/v1/signals/top-movers?limit=5'),
  },

  subscribe: (email: string, tier = 'subscriber') =>
    apiFetch<{ ok: boolean; message: string }>('/v1/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tier }),
    }),
};
