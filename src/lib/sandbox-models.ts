export interface SandboxModel {
  id: string;
  name: string;
  supportsThinking: boolean;
  inputPer1M: number; // USD
  outputPer1M: number; // USD
}

export const SANDBOX_MODELS: SandboxModel[] = [
  {
    id: "claude-opus-4-7",
    name: "Claude Opus 4.7",
    supportsThinking: true,
    inputPer1M: 5,
    outputPer1M: 25,
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    supportsThinking: true,
    inputPer1M: 3,
    outputPer1M: 15,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    supportsThinking: false,
    inputPer1M: 1,
    outputPer1M: 5,
  },
];

export function getModel(id: string): SandboxModel {
  return SANDBOX_MODELS.find((m) => m.id === id) ?? SANDBOX_MODELS[0];
}

export interface TechniquePreset {
  name: string;
  description: string;
  system: string;
  starter: string; // optional starter text dropped into the input
}

export const TECHNIQUE_PRESETS: TechniquePreset[] = [
  {
    name: "Zero-shot",
    description: "Just ask. A clean baseline with no examples.",
    system: "You are a helpful, direct assistant. Answer concisely.",
    starter: "",
  },
  {
    name: "Few-shot",
    description: "Show 2-3 examples to steer format and tone.",
    system:
      "You are a careful assistant. Follow the pattern of the examples exactly, matching their format and tone.",
    starter:
      "Here are examples:\n\nInput: <example input>\nOutput: <example output>\n\nInput: <example input 2>\nOutput: <example output 2>\n\nNow do the same for:\nInput: ",
  },
  {
    name: "Chain-of-thought",
    description: "Ask the model to reason step by step before answering.",
    system:
      "Think step by step. Work through the problem carefully before giving a final answer, then clearly mark the final answer.",
    starter: "",
  },
  {
    name: "Role + constraints",
    description: "Assign a role and hard rules for sharper output.",
    system:
      "You are a world-class expert in the relevant domain. Rules:\n- Be precise and specific.\n- State assumptions explicitly.\n- If unsure, say so rather than guessing.",
    starter: "",
  },
];
