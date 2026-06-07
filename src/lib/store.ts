import fs from "node:fs";
import path from "node:path";
import type {
  RadarState,
  Trend,
  Explainer,
  Progress,
  CompleteResult,
  SandboxSession,
} from "@/lib/types";

// Local, git-ignored persistence for the Radar feed. Lives alongside config
// under .frontier/ on the same (D:) drive as the project. Single-user, so a
// plain JSON file is the right amount of machinery — no DB needed.

const DATA_DIR = path.join(process.cwd(), ".frontier");
const RADAR_FILE = path.join(DATA_DIR, "trends.json");
const EXPLAINERS_FILE = path.join(DATA_DIR, "explainers.json");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");
const SANDBOX_FILE = path.join(DATA_DIR, "sandbox.json");
const MAX_SESSIONS = 50;

const XP_PER_LEVEL = 500;

const DEFAULT_PROGRESS: Progress = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  totalAnswered: 0,
  totalCorrect: 0,
  skills: {},
};

function localDateStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const EMPTY: RadarState = { trends: [], lastRefreshedAt: null };

export function readRadar(): RadarState {
  try {
    const raw = fs.readFileSync(RADAR_FILE, "utf8");
    const parsed = JSON.parse(raw) as RadarState;
    return {
      trends: Array.isArray(parsed.trends) ? parsed.trends : [],
      lastRefreshedAt: parsed.lastRefreshedAt ?? null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeRadar(state: RadarState): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(RADAR_FILE, JSON.stringify(state, null, 2), "utf8");
}

/**
 * Merge freshly-imported trends into the radar feed without clobbering the
 * existing web-researched cards. De-dupes by source URL so re-importing the
 * same export is idempotent. Imported cards go to the top.
 */
export function mergeRadarTrends(incoming: Trend[]): RadarState {
  const current = readRadar();
  const seenUrls = new Set(
    current.trends.flatMap((t) => (t.sourceLinks ?? []).map((s) => s.url))
  );
  const fresh = incoming.filter(
    (t) => !(t.sourceLinks ?? []).some((s) => seenUrls.has(s.url))
  );
  const state: RadarState = {
    trends: [...fresh, ...current.trends],
    lastRefreshedAt: current.lastRefreshedAt,
  };
  writeRadar(state);
  return state;
}

export function readExplainers(): Explainer[] {
  try {
    const raw = fs.readFileSync(EXPLAINERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as { explainers?: Explainer[] };
    return Array.isArray(parsed.explainers) ? parsed.explainers : [];
  } catch {
    return [];
  }
}

function writeExplainers(explainers: Explainer[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    EXPLAINERS_FILE,
    JSON.stringify({ explainers }, null, 2),
    "utf8"
  );
}

export function getExplainer(id: string): Explainer | undefined {
  return readExplainers().find((e) => e.id === id);
}

export function findExplainerByTrend(trendId: string): Explainer | undefined {
  return readExplainers().find((e) => e.trendId === trendId);
}

export function addExplainer(explainer: Explainer): void {
  const all = readExplainers();
  all.unshift(explainer); // newest first
  writeExplainers(all);
}

export function readProgress(): Progress {
  try {
    const raw = fs.readFileSync(PROGRESS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { ...DEFAULT_PROGRESS, ...parsed, skills: parsed.skills ?? {} };
  } catch {
    return { ...DEFAULT_PROGRESS, skills: {} };
  }
}

function writeProgress(p: Progress): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2), "utf8");
}

/**
 * Apply a finished drill: award XP, update streak, and move the skill's mastery
 * toward the session accuracy (exponential moving average).
 * `score` is correct-answer credit (partials allowed), out of `total`.
 */
export function updateProgressOnComplete(
  skillId: string,
  skillName: string,
  score: number,
  total: number
): CompleteResult {
  const p = readProgress();
  const accuracy = total > 0 ? score / total : 0;

  // Streak
  const today = localDateStr();
  const yesterday = localDateStr(new Date(Date.now() - 86_400_000));
  if (p.lastActiveDate === today) {
    /* already counted today */
  } else if (p.lastActiveDate === yesterday) {
    p.streak += 1;
  } else {
    p.streak = 1;
  }
  p.lastActiveDate = today;

  // XP + level
  const xpEarned = Math.round(score * 15) + 10;
  const beforeLevel = p.level;
  p.xp += xpEarned;
  p.level = Math.floor(p.xp / XP_PER_LEVEL) + 1;

  // Totals
  p.totalAnswered += total;
  p.totalCorrect += score;

  // Skill mastery (EMA)
  const prev = p.skills[skillId] ?? {
    mastery: 0,
    answered: 0,
    correct: 0,
    lastPracticed: null,
  };
  const masteryBefore = prev.mastery;
  const masteryAfter = Math.round(prev.mastery * 0.6 + accuracy * 100 * 0.4);
  p.skills[skillId] = {
    mastery: masteryAfter,
    answered: prev.answered + total,
    correct: prev.correct + score,
    lastPracticed: new Date().toISOString(),
  };

  writeProgress(p);

  return {
    progress: p,
    xpEarned,
    leveledUp: p.level > beforeLevel,
    masteryBefore,
    masteryAfter,
  };
}

export { XP_PER_LEVEL };

export function readSandboxSessions(): SandboxSession[] {
  try {
    const raw = fs.readFileSync(SANDBOX_FILE, "utf8");
    const parsed = JSON.parse(raw) as { sessions?: SandboxSession[] };
    return Array.isArray(parsed.sessions) ? parsed.sessions : [];
  } catch {
    return [];
  }
}

export function upsertSandboxSession(session: SandboxSession): void {
  const all = readSandboxSessions().filter((s) => s.id !== session.id);
  all.unshift(session); // newest first
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    SANDBOX_FILE,
    JSON.stringify({ sessions: all.slice(0, MAX_SESSIONS) }, null, 2),
    "utf8"
  );
}
