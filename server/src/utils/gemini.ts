import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../config/env";

const ai = new GoogleGenAI({ apiKey: env.API_KEY });
const MODEL_NAME = "gemini-2.5-flash";

// --- Type Definitions for AI IO ---

export interface ParsedResume {
  name: string;
  title: string;
  experienceYears: number;
  education: string;
  skills: string[];
  currentSalary: string;
  targetSalary: string;
  summary: string;
}

export interface MatchAnalysis {
  score: number;
  reason: string;
  overlappingKeywords: string[];
}

// --- AI Methods ---

export const GeminiService = {
  /**
   * Analyzes resume text and extracts structured data.
   */
  analyzeResume: async (text: string): Promise<ParsedResume> => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Extract structured data from this resume text: \n\n${text}`,
      config: {
        systemInstruction: "You are an expert HR parser. Extract the following fields strictly.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            experienceYears: { type: Type.NUMBER },
            education: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            currentSalary: { type: Type.STRING },
            targetSalary: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ["name", "title", "experienceYears", "education", "skills", "summary"]
        }
      }
    });

    if (!response.text) throw new Error("AI failed to generate response");
    return JSON.parse(response.text) as ParsedResume;
  },

  /**
   * Matches a candidate profile against a job description.
   */
  matchJob: async (candidateProfile: string, jobDescription: string): Promise<MatchAnalysis> => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Candidate: ${candidateProfile}\n\nJob: ${jobDescription}`,
      config: {
        systemInstruction: "Analyze the fit between the candidate and the job. Output a score (0-100), a concise reason in Chinese, and overlapping keywords.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            overlappingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "reason", "overlappingKeywords"]
        }
      }
    });

    if (!response.text) throw new Error("AI matching failed");
    return JSON.parse(response.text) as MatchAnalysis;
  }
};