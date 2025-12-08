
import { StorageService } from "./storageService";
import { parseResumeWithAI, matchCandidateToJobs } from "./geminiService";
import { Candidate, Job, UserRole, MatchResult } from "../types";

/**
 * DataService acts as the Backend Controller.
 * It coordinates between the Database (StorageService) and External APIs (Gemini).
 */
export const DataService = {
  
  // --- Auth Logic ---
  login: (role: UserRole): boolean => {
    // Simulating auth logic
    const session = {
      id: `user_${Date.now()}`,
      role: role,
      name: role === UserRole.B_SIDE ? '企业招聘负责人' : '高端求职者',
      lastLogin: Date.now()
    };
    StorageService.setSession(session);
    return true;
  },

  logout: () => {
    StorageService.setSession(null);
  },

  getCurrentUser: () => {
    return StorageService.getSession();
  },

  // --- Candidate Logic ---
  
  /**
   * Uploads a resume (Base64), parses it via AI, and saves it to DB.
   */
  uploadResume: async (base64Data: string, mimeType: string): Promise<Candidate> => {
    // 1. Call AI Service
    const parsedData = await parseResumeWithAI({ type: 'base64', data: base64Data, mimeType });
    
    // 2. Hydrate into full Candidate object
    const newCandidate: Candidate = {
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: parsedData.name || "未命名候选人",
      title: parsedData.title || "待定职位",
      experienceYears: parsedData.experienceYears || 0,
      education: parsedData.education || "学历不详",
      skills: parsedData.skills || [],
      currentSalary: parsedData.currentSalary || "面议",
      targetSalary: parsedData.targetSalary || "面议",
      status: '待业',
      summary: parsedData.summary || "AI自动解析简历",
      email: parsedData.email,
      phone: parsedData.phone,
      updatedAt: new Date().toISOString()
    };

    // 3. Save to DB
    // Note: If C-side, we might usually overwrite 'me', but here we treat it as a pool
    StorageService.saveCandidate(newCandidate);
    
    return newCandidate;
  },

  updateCandidateProfile: (candidate: Candidate) => {
    StorageService.saveCandidate(candidate);
  },

  getAllCandidates: () => {
    return StorageService.getCandidates();
  },

  // --- Job Logic ---
  
  getAllJobs: () => {
    return StorageService.getJobs();
  },

  // --- Matching Logic ---

  /**
   * Performs matching logic, either fetching from cache or running AI.
   */
  getMatchesForCandidate: async (candidateId: string, forceRefresh = false): Promise<MatchResult[]> => {
    // 1. Check Cache
    if (!forceRefresh) {
      const cached = StorageService.getMatchesForCandidate(candidateId);
      if (cached && cached.length > 0) {
        // Hydrate job details (join operation)
        const jobs = StorageService.getJobs();
        return cached.map(m => ({
          ...m,
          jobDetails: jobs.find(j => j.id === m.jobId)
        })).filter(m => m.jobDetails); // Ensure job still exists
      }
    }

    // 2. Fetch Entities
    const candidate = StorageService.getCandidateById(candidateId);
    const jobs = StorageService.getJobs();

    if (!candidate || jobs.length === 0) return [];

    // 3. Run AI Match
    const rawMatches = await matchCandidateToJobs(candidate, jobs);

    // 4. Save to DB (Cache)
    StorageService.saveMatches(candidateId, rawMatches);

    // 5. Return Enriched Results
    return rawMatches.map(m => ({
      ...m,
      jobDetails: jobs.find(j => j.id === m.jobId)
    }));
  }
};
