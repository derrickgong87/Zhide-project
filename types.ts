
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
  email?: string; // Added for contact
  phone?: string; // Added for contact
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
}

export interface MatchResult {
  jobId: string;
  score: number; // 0-100
  reason: string;
  overlappingKeywords: string[];
  jobDetails?: Job; // Hydrated on client side
}
