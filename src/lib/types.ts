// Represents a persisted README record in the database.
// Used across history viewing, dedicated editor screens, and API response typing.
export interface Readme {
  id: string;
  title: string;
  content: string;
  template: string;
  repoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Payload structure for the README generation request.
// Collects all user-defined parameters and context inferred from external repositories.
export interface ReadmeFormData {
  name: string;
  stack: string;
  description: string;
  install: string;
  usage: string;
  author: string;
  license: string;
  language: string;
  sections: string[];
  template: string;
  aiModel: string;
  chunkedGeneration: boolean;
  repoUrl?: string;
}

// Context object returned by the GitHub analysis endpoint.
// Encapsulates repository metadata and critical files fetched to bootstrap form state.
export interface GithubContext {
  name: string;
  description: string;
  install: string;
  usage: string;
  language: string;
  license: string;
  stars: number;
  files: { file: string; content: string }[];
  author: {
    name: string;
    avatar: string;
    url: string;
  };
}

// Represents selectable documentation sections in the UI.
export interface Section {
  id: string;
  label: string;
}

// Represents available structural templates/styles for README generation.
export interface Template {
  id: string;
  label: string;
  description: string;
}

// Predefined available sections for the README builder.
// Decouples internal identifier keys from displayable UI labels.
export const SECTIONS: Section[] = [
  { id: "features", label: "Features" },
  { id: "install", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "config", label: "Configuration" },
  { id: "demo", label: "Demo / Screenshot" },
  { id: "contributing", label: "Contributing" },
  { id: "license", label: "License" },
  { id: "badges", label: "Badges" },
  { id: "roadmap", label: "Roadmap" },
];

// Available templates influencing the tone and density of the generated documentation.
export const TEMPLATES: Template[] = [
  { id: "default", label: "Default", description: "Comprehensive and detailed structure" },
  { id: "minimal", label: "Minimal", description: "Clean, straightforward overview" },
  { id: "detailed", label: "Detailed", description: "In-depth sections with tables and examples" },
  { id: "creative", label: "Creative", description: "Fun, engaging tone with heavy emoji usage" },
  { id: "corporate", label: "Corporate", description: "Highly formal, enterprise-grade professional tone" },
  { id: "startup", label: "Startup", description: "Energetic, value-driven marketing style" },
  { id: "academic", label: "Academic", description: "Rigorous, methodological, and scientific focus" },
];

// Supported open-source licenses for badges and explicit documentation sections.
export const LICENSES = [
  "MIT",
  "Apache 2.0",
  "GPL-3.0",
  "BSD-3-Clause",
  "Unlicense",
];

// Available LLM engines configured for documentation generation workloads.
export const AI_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Versatile)", description: "Best overall capability and reasoning" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", description: "Exceptional reasoning performance" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Instant)", description: "Extremely fast generation for simpler tasks" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", description: "Alternative open architecture" },
];
