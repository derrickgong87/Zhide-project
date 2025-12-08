
export enum UserRole {
  B_SIDE = 'B_SIDE', // 猎头/企业 HR
  C_SIDE = 'C_SIDE', // 高端候选人
  GUEST = 'GUEST',
}

export interface Candidate {
  id: string;
  name: string;
  title: string;
  experienceYears: number;
  education: string;
  skills: string[];
  currentSalary: string;
  targetSalary: string;
  status: '待业' | '面试中' | '已入职';
  summary: string;
  email?: string;
  phone?: string;
  updatedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  requirements: string[];
  tags: string[];
  description: string;
  source: 'Exclusive' | 'Crawler';
  originalUrl?: string;
  postDate: string;
  active: boolean;
}

export interface MatchResult {
  jobId: string;
  score: number; // 0-100
  reason: string;
  overlappingKeywords: string[];
  jobDetails?: Job; // Hydrated on client side
  timestamp?: number;
}

// Backend Simulation Types
export interface UserSession {
  id: string;
  role: UserRole;
  name: string;
  lastLogin: number;
}

export interface StorageSchema {
  candidates: Candidate[];
  jobs: Job[];
  session: UserSession | null;
  matchHistory: Record<string, MatchResult[]>; // candidateId -> matches
}
