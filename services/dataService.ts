import { StorageService } from "./storageService";
import { parseResumeWithAI, matchCandidateToJobs } from "./geminiService";
import { Candidate, Job, UserRole, MatchResult } from "../types";

// --- CONFIGURATION ---
// Toggle this to TRUE when the backend server (node server/dist/index.js) is running.
const USE_REAL_BACKEND = false; 
const API_URL = "http://localhost:3000/api";

/**
 * DataService acts as the abstraction layer.
 * It can switch between the "Browser Simulation" (StorageService) 
 * and the "Real Node.js Backend" (API_URL) seamlessly.
 */
export const DataService = {
  
  // --- Auth Logic ---
  login: async (role: UserRole): Promise<boolean> => {
    if (USE_REAL_BACKEND) {
       // Example of how the real backend call would look
       /*
       const res = await fetch(`${API_URL}/../auth/login`, {
         method: 'POST',
         body: JSON.stringify({ email: 'demo@test.com', password: 'demo', role })
       });
       if (res.ok) {
         const data = await res.json();
         localStorage.setItem('token', data.token);
         return true;
       }
       return false;
       */
       return true; 
    } else {
      // Simulation
      const session = {
        id: `user_${Date.now()}`,
        role: role,
        name: role === UserRole.B_SIDE ? '企业招聘负责人' : '高端求职者',
        lastLogin: Date.now()
      };
      StorageService.setSession(session);
      return true;
    }
  },

  logout: () => {
    StorageService.setSession(null);
    localStorage.removeItem('token');
  },

  getCurrentUser: () => {
    return StorageService.getSession();
  },

  // --- Candidate Logic ---
  
  /**
   * Uploads a resume, parses it, and saves it.
   */
  uploadResume: async (base64Data: string, mimeType: string): Promise<Candidate> => {
    if (USE_REAL_BACKEND) {
      /*
      const res = await fetch(`${API_URL}/resume/upload`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
         body: JSON.stringify({ textData: base64Data, mimeType })
      });
      return await res.json();
      */
      throw new Error("Backend not connected");
    }

    // 1. Call Client-side AI Service (Simulation)
    const parsedData = await parseResumeWithAI({ type: 'base64', data: base64Data, mimeType });
    
    // 2. Hydrate
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

    // 3. Save to Local DB
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
   * Performs matching logic.
   */
  getMatchesForCandidate: async (candidateId: string, forceRefresh = false): Promise<MatchResult[]> => {
    if (USE_REAL_BACKEND) {
       /*
       const res = await fetch(`${API_URL}/match/run`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ candidateId })
       });
       return await res.json();
       */
       return [];
    }

    // 1. Check Cache
    if (!forceRefresh) {
      const cached = StorageService.getMatchesForCandidate(candidateId);
      if (cached && cached.length > 0) {
        const jobs = StorageService.getJobs();
        return cached.map(m => ({
          ...m,
          jobDetails: jobs.find(j => j.id === m.jobId)
        })).filter(m => m.jobDetails); 
      }
    }

    // 2. Fetch Entities
    const candidate = StorageService.getCandidateById(candidateId);
    const jobs = StorageService.getJobs();

    if (!candidate || jobs.length === 0) return [];

    // 3. Run AI Match (Client Side Simulation)
    const rawMatches = await matchCandidateToJobs(candidate, jobs);

    // 4. Save to Local DB
    StorageService.saveMatches(candidateId, rawMatches);

    // 5. Return Enriched Results
    return rawMatches.map(m => ({
      ...m,
      jobDetails: jobs.find(j => j.id === m.jobId)
    }));
  }
};