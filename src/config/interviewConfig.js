export const INTERVIEW_CONFIG = {
  startUrl:
    import.meta.env.VITE_INTERVIEW_START_URL ||
    "http://localhost:8000/api/v1/interview/session/start",
  wsBaseUrl:
    import.meta.env.VITE_INTERVIEW_WS_URL || "ws://localhost:8000/ws/interview",
  userId: "user_1",
  jobRole: "Backend Developer",
  experienceLevel: "mid",
  skills: ["Python", "FastAPI", "MongoDB"],
  language: "en-IN"
};
