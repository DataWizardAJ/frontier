import type { SkillArea } from "@/lib/types";

export const SKILL_AREAS: SkillArea[] = [
  {
    id: "prompting",
    name: "Prompt engineering",
    description: "Crafting prompts that get reliable, high-quality output.",
  },
  {
    id: "agents",
    name: "Agentic workflows",
    description: "Tool use, agent loops, planning, and orchestration.",
  },
  {
    id: "rag",
    name: "RAG & retrieval",
    description: "Grounding models in your own data, retrieval, and context.",
  },
  {
    id: "evals",
    name: "Evals & quality",
    description: "Measuring, testing, and improving model output reliably.",
  },
  {
    id: "cost",
    name: "Cost & latency",
    description: "Caching, model choice, and shipping fast, affordable AI.",
  },
  {
    id: "models",
    name: "Models & releases",
    description: "Keeping current on model capabilities and tradeoffs.",
  },
];

export function getSkill(id: string): SkillArea | undefined {
  return SKILL_AREAS.find((s) => s.id === id);
}
