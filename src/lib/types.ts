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
];

// Supported open-source licenses for badges and explicit documentation sections.
export const LICENSES = [
  "MIT",
  "Apache 2.0",
  "GPL-3.0",
  "BSD-3-Clause",
  "Unlicense",
];
