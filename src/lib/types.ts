export type TrendCategory =
  | "Agents"
  | "LLMs"
  | "Prompting"
  | "Coding"
  | "Image & Video"
  | "RAG"
  | "Ops";

export const TREND_CATEGORIES: TrendCategory[] = [
  "Agents",
  "LLMs",
  "Prompting",
  "Coding",
  "Image & Video",
  "RAG",
  "Ops",
];

export interface TrendSource {
  title: string;
  url: string;
}

export type TrendOrigin = "web" | "instagram";

export interface Trend {
  id: string;
  title: string;
  category: TrendCategory;
  summary: string;
  whyItMatters: string;
  momentum: number; // 0-100
  isNew?: boolean;
  sources: number;
  readMinutes: number;
  sourceLinks?: TrendSource[];
  origin?: TrendOrigin; // where this card came from; defaults to "web"
}

/** A single saved post parsed from an Instagram data export. */
export interface SavedPost {
  handle: string; // account that posted it (best-effort)
  url: string; // permalink to the post
  savedAt: string | null; // ISO timestamp, if present in the export
}

export interface RadarState {
  trends: Trend[];
  lastRefreshedAt: string | null; // ISO timestamp
}

export interface ExplainerStep {
  heading: string;
  body: string;
  example: string; // code/prompt snippet, or "" if none
}

export interface Explainer {
  id: string;
  trendId?: string;
  title: string;
  category: TrendCategory;
  summary: string;
  readMinutes: number;
  overview: string;
  whenToUse: string;
  prerequisites: string[];
  steps: ExplainerStep[];
  pitfalls: string[];
  takeaways: string[];
  sandboxPrompt: string; // starter prompt for the Sandbox handoff
  createdAt: string;
}

/** What the model generates (id/trendId/createdAt are added server-side). */
export type GeneratedExplainer = Omit<
  Explainer,
  "id" | "trendId" | "createdAt"
>;

/* ---------------- Drills ---------------- */

export interface SkillArea {
  id: string;
  name: string;
  description: string;
}

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type QuestionType = "mcq" | "open";

export interface DrillQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[]; // mcq only; [] for open
  correctIndex: number; // mcq only; -1 for open
  idealAnswer: string; // open only; "" for mcq
  explanation: string;
}

export interface Drill {
  id: string;
  skillId: string;
  skillName: string;
  difficulty: Difficulty;
  title: string;
  questions: DrillQuestion[];
  createdAt: string;
}

export type GeneratedDrill = {
  title: string;
  questions: Omit<DrillQuestion, "id">[];
};

export type GradeVerdict = "correct" | "partial" | "incorrect";

export interface GradeResult {
  verdict: GradeVerdict;
  feedback: string;
}

export interface SkillProgress {
  mastery: number; // 0-100
  answered: number;
  correct: number; // can be fractional (partial credit)
  lastPracticed: string | null;
}

export interface Progress {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  totalAnswered: number;
  totalCorrect: number;
  skills: Record<string, SkillProgress>;
}

export interface CompleteResult {
  progress: Progress;
  xpEarned: number;
  leveledUp: boolean;
  masteryBefore: number;
  masteryAfter: number;
}

/* ---------------- Sandbox ---------------- */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface SandboxSession {
  id: string;
  title: string;
  model: string;
  system: string;
  messages: ChatMessage[];
  updatedAt: string;
}
