import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { GeminiService } from '../utils/gemini';

const prisma = new PrismaClient();

export const ApiController = {
  // --- Resume & Profile ---
  
  uploadResume: async (req: AuthRequest, res: Response) => {
    try {
      const { textData, mimeType } = req.body; // Assume text extracted or handled via separate file upload middleware
      if (!textData) return res.status(400).json({ error: "Resume text required" });

      // 1. AI Parsing
      const parsed = await GeminiService.analyzeResume(textData);

      // 2. Save/Update Profile
      const candidate = await prisma.candidate.upsert({
        where: { userId: req.user!.id },
        update: {
          ...parsed,
          resumeText: textData,
        },
        create: {
          userId: req.user!.id,
          ...parsed,
          resumeText: textData,
          status: '待业', // Default
        }
      });

      res.json(candidate);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process resume" });
    }
  },

  getProfile: async (req: AuthRequest, res: Response) => {
    const profile = await prisma.candidate.findUnique({ where: { userId: req.user!.id } });
    res.json(profile);
  },

  // --- Jobs ---

  getJobs: async (req: AuthRequest, res: Response) => {
    const jobs = await prisma.job.findMany({ 
      where: { isActive: true },
      orderBy: { createdAt: 'desc' } 
    });
    res.json(jobs);
  },

  createJob: async (req: AuthRequest, res: Response) => {
    try {
      const job = await prisma.job.create({
        data: {
          ...req.body,
          recruiterId: req.user!.id
        }
      });
      res.status(201).json(job);
    } catch (error) {
      res.status(400).json({ error: "Invalid job data" });
    }
  },

  // --- Matching ---

  matchCandidateToJobs: async (req: AuthRequest, res: Response) => {
    try {
      const { candidateId } = req.body; // B-Side passes ID, C-Side uses own profile
      
      const targetCandidateId = req.user?.role === 'C_SIDE' 
        ? (await prisma.candidate.findUnique({ where: { userId: req.user.id } }))?.id
        : candidateId;

      if (!targetCandidateId) return res.status(404).json({ error: "Candidate profile not found" });

      const candidate = await prisma.candidate.findUnique({ where: { id: targetCandidateId } });
      const jobs = await prisma.job.findMany({ where: { isActive: true } });

      if (!candidate) return res.status(404).json({ error: "Candidate not found" });

      // Perform Matches (Batch or Single)
      // Note: In prod, use a queue. Here we await for demo simplicity.
      const results = [];
      
      for (const job of jobs) {
        // Check if match exists
        const existing = await prisma.match.findUnique({
          where: { candidateId_jobId: { candidateId: candidate.id, jobId: job.id } }
        });

        if (existing) {
          results.push(existing);
          continue;
        }

        // Run AI Match
        const candidateStr = JSON.stringify({
          skills: candidate.skills,
          experience: candidate.experienceYears,
          title: candidate.title,
          summary: candidate.summary
        });
        
        const jobStr = JSON.stringify({
          title: job.title,
          requirements: job.requirements,
          description: job.description
        });

        const analysis = await GeminiService.matchJob(candidateStr, jobStr);

        // Save Match
        const newMatch = await prisma.match.create({
          data: {
            candidateId: candidate.id,
            jobId: job.id,
            score: analysis.score,
            reason: analysis.reason,
            keywords: analysis.overlappingKeywords
          }
        });
        
        results.push(newMatch);
      }

      // Sort by score
      res.json(results.sort((a, b) => b.score - a.score));

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Matching service failure" });
    }
  }
};