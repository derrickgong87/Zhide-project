import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, Job, MatchResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = "gemini-2.5-flash";
const MODEL_REASONING = "gemini-2.5-flash";

/**
 * 简历解析 (Resume Parsing) - Supports Text or Base64 PDF
 */
export const parseResumeWithAI = async (
  input: { type: 'text' | 'base64', data: string, mimeType?: string }
): Promise<Partial<Candidate>> => {
  try {
    const prompt = `
      你是一位资深的高端人才招聘专家。请分析这份简历并提取结构化数据。
      返回 JSON 格式。
      
      请提取以下字段：
      - name: 姓名
      - title: 当前或最近的职位头衔
      - experienceYears: 工作年限 (数字)
      - education: 最高学历 (格式: 学校, 专业/学位)
      - skills: 关键技能列表 (数组)
      - currentSalary: 目前薪资 (如有，否则估算或留空)
      - summary: 简短的专业能力摘要，突出亮点 (100字以内)
      - targetSalary: 期望薪资 (如有)
    `;

    let contents;
    if (input.type === 'base64') {
        contents = {
            parts: [
                { inlineData: { mimeType: input.mimeType || 'application/pdf', data: input.data } },
                { text: prompt }
            ]
        };
    } else {
        contents = `${prompt}\n\n简历内容:\n${input.data}`;
    }

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: contents,
      config: {
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
            summary: { type: Type.STRING, description: "简短的专业能力摘要，突出亮点" },
          },
          required: ["name", "title", "skills", "summary"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as Partial<Candidate>;
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Resume parsing failed:", error);
    // Fallback if AI fails (for demo purposes if key is invalid or quota exceeded)
    return {
      name: "解析失败-请手动输入",
      title: "",
      experienceYears: 0,
      education: "",
      skills: [],
      summary: "自动解析遇到问题，请手动补充信息。",
      currentSalary: "",
    };
  }
};

/**
 * 智能人岗匹配 (Intelligent Matching)
 */
export const matchCandidateToJobs = async (
  candidate: Candidate,
  jobs: Job[]
): Promise<MatchResult[]> => {
  try {
    const jobsJson = JSON.stringify(jobs.map(j => ({ 
      id: j.id, 
      title: j.title, 
      company: j.company, 
      requirements: j.requirements, 
      salary: j.salaryRange,
      desc: j.description.substring(0, 150),
      source: j.source
    })));
    const candidateJson = JSON.stringify(candidate);

    const prompt = `
      扮演一位顶级猎头顾问。
      分析候选人与职位列表的匹配度。
      只返回最匹配的 3 个职位（如果没有合适的，返回空数组）。
      
      评价标准：
      1. 硬性指标：薪资范围、工作年限、地点。
      2. 软性指标：行业赛道匹配度、技能栈重合度、教育背景。
      
      输出要求：
      1. score: 0-100 的匹配分数。
      2. reason: 用中文简练地解释为什么匹配，提及具体的技能或经验重合点。
      3. overlappingKeywords: 提取出简历和JD中重合的关键术语。
      
      候选人信息: ${candidateJson}
      职位列表: ${jobsJson}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_REASONING,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              jobId: { type: Type.STRING },
              score: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              overlappingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["jobId", "score", "reason", "overlappingKeywords"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as MatchResult[];
    }
    return [];
  } catch (error) {
    console.error("Matching failed:", error);
    return [];
  }
};

/**
 * 初始化模拟数据
 */
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