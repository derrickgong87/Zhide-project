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
  education: string; // e.g., "清华大学, MBA"
  skills: string[];
  currentSalary?: string;
  targetSalary?: string;
  status: '待业' | '面试中' | '已入职';
  summary: string; // AI 生成的摘要
  matchScore?: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  requirements: string[];
  tags: string[]; // e.g., "独家", "急招", "500强"
  description: string;
  source: 'Exclusive' | 'Crawler'; // Exclusive = B端录入/独家, Crawler = 爬虫抓取
  originalUrl?: string; // 原始链接 (用于爬虫抓取的岗位)
  postDate: string;
}

export interface MatchResult {
  jobId: string;
  score: number; // 0-100
  reason: string; // AI 解释的匹配理由
  overlappingKeywords: string[]; // 关键词重合点
  jobDetails?: Job; // 为了前端方便展示
}

export interface AppState {
  currentUserRole: UserRole;
  isLoggedIn: boolean;
}