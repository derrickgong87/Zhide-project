
import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, Job, MatchResult } from "../types";

// --- Configuration ---
const API_KEY = process.env.API_KEY;
const MODEL_NAME = "gemini-2.5-flash"; // Fast, cheap, large context window

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Schemas ---
// Defined centrally for consistency

const CandidateSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Candidate's full name" },
    title: { type: Type.STRING, description: "Current or most recent job title" },
    experienceYears: { type: Type.NUMBER, description: "Total years of professional experience" },
    education: { type: Type.STRING, description: "Highest degree and university (e.g., '清华大学, 计算机硕士')" },
    skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of top 5-10 technical or professional skills" },
    currentSalary: { type: Type.STRING, description: "Current annual salary (e.g., '80万', 'Unknown')" },
    targetSalary: { type: Type.STRING, description: "Target/Expected annual salary" },
    summary: { type: Type.STRING, description: "A professional summary (max 100 words) highlighting achievements" },
    email: { type: Type.STRING, description: "Email address if found" },
    phone: { type: Type.STRING, description: "Phone number if found" },
  },
  required: ["name", "title", "experienceYears", "education", "skills", "summary"],
};

const MatchListSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      jobId: { type: Type.STRING, description: "The exact ID of the job from the input list" },
      score: { type: Type.NUMBER, description: "Match score from 0 to 100" },
      reason: { type: Type.STRING, description: "Concise explanation of the match in Chinese" },
      overlappingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords present in both Resume and JD" },
    },
    required: ["jobId", "score", "reason", "overlappingKeywords"],
  },
};

// --- Services ---

/**
 * Parses a resume (Text or Base64 PDF) into a structured Candidate object.
 */
export const parseResumeWithAI = async (
  input: { type: 'text' | 'base64', data: string, mimeType?: string }
): Promise<Partial<Candidate>> => {
  if (!API_KEY) {
    console.warn("API Key missing, returning mock data.");
    return mockParseFallback();
  }

  try {
    const systemPrompt = `
      You are an expert HR recruiter for high-end talent. 
      Extract structured data from the provided resume.
      - If exact salary is not found, use "面议" or estimate based on level.
      - Summarize the profile professionally in Chinese.
    `;

    const parts = [];
    if (input.type === 'base64') {
      parts.push({ inlineData: { mimeType: input.mimeType || 'application/pdf', data: input.data } });
      parts.push({ text: "请解析这份简历。" });
    } else {
      parts.push({ text: `请解析这份简历内容:\n${input.data}` });
    }

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: CandidateSchema,
      },
    });

    if (result.text) {
      return JSON.parse(result.text) as Partial<Candidate>;
    }
    throw new Error("No text returned from AI");

  } catch (error) {
    console.error("Resume Parsing Error:", error);
    throw error;
  }
};

/**
 * Matches a candidate against a list of jobs using AI reasoning.
 * Optimized for batch processing.
 */
export const matchCandidateToJobs = async (
  candidate: Candidate,
  jobs: Job[]
): Promise<MatchResult[]> => {
  if (!API_KEY || jobs.length === 0) return [];

  try {
    // optimize context: remove full descriptions to save tokens if list is huge, 
    // but for <50 jobs, full description is better for accuracy.
    const simplifiedJobs = jobs.map(j => ({
      id: j.id,
      title: j.title,
      company: j.company,
      salary: j.salaryRange,
      requirements: j.requirements.join(', '),
      description: j.description.slice(0, 300) // Truncate slightly for efficiency
    }));

    const prompt = `
      Candidate Profile: ${JSON.stringify(candidate)}
      
      Job List: ${JSON.stringify(simplifiedJobs)}
      
      Task:
      1. Analyze the candidate against EACH job in the list.
      2. Assign a match score (0-100).
      3. Provide a reasoning in Chinese (explain "Why this matches").
      4. Extract overlapping keywords.
      5. Return ONLY the top 5 matches sorted by score descending.
    `;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: MatchListSchema,
      },
    });

    if (result.text) {
      return JSON.parse(result.text) as MatchResult[];
    }
    return [];

  } catch (error) {
    console.error("Matching Error:", error);
    return [];
  }
};

// --- Mock Data Generators (kept for initialization) ---

const mockParseFallback = (): Partial<Candidate> => ({
  name: "演示用户",
  title: "高级经理",
  experienceYears: 5,
  education: "未配置API Key",
  skills: ["请在", "环境变量中", "配置", "API_KEY"],
  summary: "由于未检测到有效的 API Key，系统使用了默认的模拟数据。请检查 metadata.json 或环境配置。",
  currentSalary: "Unknown",
  targetSalary: "Unknown"
});

export const getInitialCandidates = (): Candidate[] => [
  {
    id: 'c1',
    name: '张伟',
    title: '市场总监',
    experienceYears: 10,
    education: '复旦大学, 市场营销 MBA',
    skills: ['品牌战略', '数字营销', '团队管理', 'SaaS增长'],
    currentSalary: '80万',
    targetSalary: '120万',
    status: '待业',
    summary: '十年亚太区市场经验，曾主导两家SaaS企业的从0到1增长。',
    email: 'zhangwei@example.com'
  },
  {
    id: 'c2',
    name: '王强',
    title: '算法专家',
    experienceYears: 6,
    education: '清华大学, 计算机硕士',
    skills: ['机器学习', 'Python', 'PyTorch', '推荐系统', '大模型微调'],
    currentSalary: '100万',
    targetSalary: '150万',
    status: '面试中',
    summary: '专注于高并发推荐引擎，曾在字节跳动核心算法团队任职。',
  },
  {
    id: 'c3',
    name: 'Lucy Liu',
    title: '投资总监',
    experienceYears: 8,
    education: '宾夕法尼亚大学, 金融学',
    skills: ['PE/VC', '财务模型', '尽职调查', '医疗赛道'],
    currentSalary: '150万',
    targetSalary: '200万',
    status: '已入职',
    summary: '拥有顶级美元基金工作背景，主导过3个独角兽项目的B轮融资。',
  }
];

export const getInitialJobs = (): Job[] => [
  {
    id: 'j1',
    title: '首席营销官 (CMO)',
    company: '某AI独角兽企业',
    location: '上海',
    salaryRange: '150万 - 200万',
    requirements: ['10年以上经验', '有IPO经验优先', '英语流利'],
    tags: ['独家', 'Pre-IPO', '期权激励'],
    description: '负责独角兽企业的全球市场战略，直接向CEO汇报，推动品牌出海。寻找具有狼性和国际视野的顶级市场操盘手。',
    source: 'Exclusive',
    postDate: '2023-10-24'
  },
  {
    id: 'j2',
    title: '大模型算法科学家',
    company: 'Future Lab',
    location: '北京',
    salaryRange: '120万 - 180万',
    requirements: ['博士学历', '顶会论文', 'LLM微调经验'],
    tags: ['急招', '核心研发', '弹性工作'],
    description: '探索大规模语言模型的前沿边界，拥有顶级的计算资源支持。需要在NeurIPS/ICLR等顶会发表过一作论文。',
    source: 'Crawler',
    originalUrl: 'https://example.com/jobs/ai-researcher',
    postDate: '2023-10-22'
  },
  {
    id: 'j3',
    title: 'VP of Engineering',
    company: 'FinTech Secure',
    location: '深圳',
    salaryRange: '200万 - 300万',
    requirements: ['金融科技背景', '百人团队管理', '高频交易系统'],
    tags: ['保密招聘', '高额奖金'],
    description: '统筹管理整个工程团队，负责核心交易系统的稳定性与安全性。需要有处理日均百亿级资金流水的经验。',
    source: 'Exclusive',
    postDate: '2023-10-20'
  },
  {
    id: 'j4',
    title: '资深Java架构师',
    company: '云端科技',
    location: '杭州',
    salaryRange: '80万 - 120万',
    requirements: ['高并发', 'Spring Cloud', '电商背景'],
    tags: ['大厂背景', '双休'],
    description: '来自互联网公开招聘：负责电商中台的架构升级与性能优化。需要深入理解JVM底层原理。',
    source: 'Crawler',
    originalUrl: 'https://example.com/jobs/java-arch',
    postDate: '2023-10-25'
  },
   {
    id: 'j5',
    title: '自动驾驶感知算法负责人',
    company: 'EV Motors',
    location: '苏州',
    salaryRange: '180万 - 250万',
    requirements: ['计算机视觉', 'L4自动驾驶', '团队管理'],
    tags: ['独家', '造车新势力', '股票激励'],
    description: '负责视觉感知算法团队的搭建与管理，直接汇报给CTO。',
    source: 'Exclusive',
    postDate: '2023-10-26'
  }
];
