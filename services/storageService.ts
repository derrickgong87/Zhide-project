
import { Candidate, Job, StorageSchema, UserSession, UserRole } from "../types";
import { getInitialCandidates, getInitialJobs } from "./geminiService"; // Import initial mock data as seed

const DB_KEY = 'zhide_db_v1';

// Initialize DB with seed data if empty
const initDB = (): StorageSchema => {
  const existing = localStorage.getItem(DB_KEY);
  if (existing) {
    return JSON.parse(existing);
  }

  // Seed data
  const seed: StorageSchema = {
    candidates: getInitialCandidates(),
    jobs: getInitialJobs(),
    session: null,
    matchHistory: {}
  };

  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
};

// Low-level DB Access
const getDB = (): StorageSchema => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : initDB();
};

const saveDB = (data: StorageSchema) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// --- Repository Pattern Implementation ---

export const StorageService = {
  // Session
  getSession: (): UserSession | null => {
    return getDB().session;
  },
  
  setSession: (session: UserSession | null) => {
    const db = getDB();
    db.session = session;
    saveDB(db);
  },

  // Candidates (CRUD)
  getCandidates: (): Candidate[] => {
    return getDB().candidates;
  },

  getCandidateById: (id: string): Candidate | undefined => {
    return getDB().candidates.find(c => c.id === id);
  },

  saveCandidate: (candidate: Candidate) => {
    const db = getDB();
    const index = db.candidates.findIndex(c => c.id === candidate.id);
    if (index >= 0) {
      db.candidates[index] = { ...candidate, updatedAt: new Date().toISOString() };
    } else {
      db.candidates.unshift({ ...candidate, updatedAt: new Date().toISOString() });
    }
    saveDB(db);
  },

  deleteCandidate: (id: string) => {
    const db = getDB();
    db.candidates = db.candidates.filter(c => c.id !== id);
    saveDB(db);
  },

  // Jobs (CRUD)
  getJobs: (): Job[] => {
    return getDB().jobs;
  },

  addJob: (job: Job) => {
    const db = getDB();
    db.jobs.unshift(job);
    saveDB(db);
  },

  // Matches
  getMatchesForCandidate: (candidateId: string) => {
    return getDB().matchHistory[candidateId] || [];
  },

  saveMatches: (candidateId: string, matches: any[]) => {
    const db = getDB();
    db.matchHistory[candidateId] = matches;
    saveDB(db);
  },
  
  // Reset for demo purposes
  resetDB: () => {
    localStorage.removeItem(DB_KEY);
    initDB();
  }
};
