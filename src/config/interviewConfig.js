export const INTERVIEW_CONFIG = {
  startUrl:
    import.meta.env.VITE_INTERVIEW_START_URL ||
    "http://localhost:8000/api/v1/interview/session/start",
  wsBaseUrl:
    import.meta.env.VITE_INTERVIEW_WS_URL || "ws://localhost:8000/ws/interview",
  userId: "user_1",
  jobRole: "Business Development Executive",
  experienceLevel: "mid",
  skills: ["Lead Generation", "Client Communication", "CRM"],
  language: "en-IN",
  parsedResume: {
    summary: "Managed B2B lead generation, client outreach, CRM follow-ups, and sales pipeline coordination.",
    skills: ["Lead Generation", "Cold Calling", "Client Communication", "CRM", "Negotiation", "Market Research"],
    projects: [
      {
        name: "Regional Client Acquisition Campaign",
        description: "Identified target accounts, managed outbound outreach, scheduled product demos, and tracked conversion status in CRM.",
        technologies: ["CRM", "Email Outreach", "LinkedIn Prospecting", "Sales Pipeline Tracking"]
      }
    ],
    workExperience: ["Business Development Associate", "Sales Development Representative"],
    education: ["Bachelor of Business Administration"],
    certifications: ["Sales and Negotiation Fundamentals"]
  },
  jobId: "business_development_executive_demo",
  jobDescription: "Generate qualified leads, manage client outreach, maintain CRM hygiene, schedule meetings, and support revenue growth.",
  requiredSkills: ["Lead Generation", "Client Communication", "Cold Calling", "CRM"],
  preferredSkills: ["Negotiation", "Market Research", "LinkedIn Prospecting"],
  responsibilities: ["Identify prospects", "Run outbound outreach", "Schedule client meetings", "Maintain CRM updates", "Support deal follow-ups"],
  requiredExperience: "3+ years",
  interviewDifficulty: "mid",
  interviewDuration: 30,
  interviewType: "business_development",
  companyInstructions: "Focus on lead quality, communication skills, pipeline ownership, objection handling, and measurable sales outcomes."
};

export function buildInterviewSessionPayload(overrides = {}) {
  return {
    userId: INTERVIEW_CONFIG.userId,
    jobRole: INTERVIEW_CONFIG.jobRole,
    experienceLevel: INTERVIEW_CONFIG.experienceLevel,
    skills: INTERVIEW_CONFIG.skills,
    language: INTERVIEW_CONFIG.language,
    parsedResume: INTERVIEW_CONFIG.parsedResume,
    jobId: INTERVIEW_CONFIG.jobId,
    jobDescription: INTERVIEW_CONFIG.jobDescription,
    requiredSkills: INTERVIEW_CONFIG.requiredSkills,
    preferredSkills: INTERVIEW_CONFIG.preferredSkills,
    responsibilities: INTERVIEW_CONFIG.responsibilities,
    requiredExperience: INTERVIEW_CONFIG.requiredExperience,
    interviewDifficulty: INTERVIEW_CONFIG.interviewDifficulty,
    interviewDuration: INTERVIEW_CONFIG.interviewDuration,
    interviewType: INTERVIEW_CONFIG.interviewType,
    companyInstructions: INTERVIEW_CONFIG.companyInstructions,
    ...overrides
  };
}
