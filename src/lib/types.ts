// Representa um README salvo no banco de dados
export interface Readme {
  id: string;
  title: string;
  content: string;
  template: string;
  repoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Dados do formulário de geração
export interface ReadmeFormData {
  name: string;
  stack: string;
  description: string;
  install: string;
  usage: string;
  author: string;
  license: string;
  sections: string[];
  template: string;
  repoUrl?: string;
}

// Contexto retornado pela rota do GitHub
export interface GithubContext {
  name: string;
  description: string;
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

// Seções disponíveis para incluir no README
export interface Section {
  id: string;
  label: string;
}

// Templates disponíveis
export interface Template {
  id: string;
  label: string;
  description: string;
}

// Lista de seções disponíveis no formulário
export const SECTIONS: Section[] = [
  { id: "features", label: "Features" },
  { id: "install", label: "Instalação" },
  { id: "usage", label: "Uso" },
  { id: "config", label: "Configuração" },
  { id: "demo", label: "Demo / Screenshot" },
  { id: "contributing", label: "Contribuindo" },
  { id: "license", label: "Licença" },
  { id: "badges", label: "Badges" },
  { id: "roadmap", label: "Roadmap" },
];

// Lista de templates disponíveis
export const TEMPLATES: Template[] = [
  { id: "default", label: "Padrão", description: "Completo e detalhado" },
  { id: "minimal", label: "Minimal", description: "Simples e direto" },
  { id: "detailed", label: "Detalhado", description: "Com exemplos e tabelas" },
];

// Licenças disponíveis no formulário
export const LICENSES = [
  "MIT",
  "Apache 2.0",
  "GPL-3.0",
  "BSD-3-Clause",
  "Unlicense",
];
