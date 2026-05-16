"use client";

import {
  AI_MODELS,
  GithubContext,
  LICENSES,
  ReadmeFormData,
  SECTIONS,
  TEMPLATES,
} from "@/lib/types";
import { useSession } from "next-auth/react";
import { useState } from "react";

// Component props receiving a callback triggered upon successful README generation
interface ReadmeFormProps {
  onGenerate: (content: string, id: string) => void;
}

export default function ReadmeForm({ onGenerate }: ReadmeFormProps) {
  // Form state initialized with default parameters.
  // These map directly to the generation prompt payload and can be bootstrapped via GitHub import.
  const [form, setForm] = useState<ReadmeFormData>({
    name: "",
    stack: "",
    description: "",
    install: "",
    usage: "",
    author: "",
    license: "MIT",
    language: "pt-BR", // Retaining pt-BR as default output option for convenience
    sections: ["features", "install", "usage", "license", "badges"],
    template: "default",
    aiModel: "llama-3.3-70b-versatile",
    chunkedGeneration: false,
  });

  // UI state controllers managing asynchronous feedback, error messages, and repository input
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [loadingRepo, setLoadingRepo] = useState(false);

  // User session state
  const { data: session } = useSession();
  const isAuth = !!session?.user;

  // Updates specific form input fields dynamically
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Toggles section inclusions within the selected documentation array
  function toggleSection(id: string) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.includes(id)
        ? prev.sections.filter((s) => s !== id)
        : [...prev.sections, id],
    }));
  }

  // Analyzes the provided GitHub repository URL to pre-populate relevant fields automatically
  async function handleFetchRepo() {
    if (!repoUrl) return;

    setLoadingRepo(true);
    setError("");

    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl }),
      });

      const data: GithubContext = await res.json();

      if (!res.ok) {
        setError("Could not fetch repository. Please verify the URL.");
        return;
      }

      // Populate form state using context extracted from repository files.
      // Keeps manual overrides available so the user can refine inferred metadata.
      setForm((prev) => ({
        ...prev,
        name: data.name,
        description: data.description,
        stack: data.language,
        license: data.license,
        install: data.install,
        usage: data.usage,
        author: data.author.name,
        repoUrl,
      }));
    } catch {
      setError("Error fetching repository metadata.");
    } finally {
      setLoadingRepo(false);
    }
  }

  // Dispatches form payload to trigger AI documentation generation
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Enforcing minimal client-side validation to ensure base context exists
    if (!form.name || !form.description) {
      setError("Project Name and Description are required.");
      return;
    }

    setLoading(true);

    try {
      // Sending full form state to the API layer where instructions are parsed for the LLM
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error generating README.");
        return;
      }

      // Yield generated payload to parent component to update editor and preview tabs
      onGenerate(data.content, data.id);
    } catch {
      setError("Error connecting to the generation service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* External Repository Context Bootstrapping */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Import from GitHub
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={handleFetchRepo}
            disabled={loadingRepo || !repoUrl}
            className="px-4 py-2.5 bg-indigo-700 hover:bg-zinc-700 disabled:opacity-40 text-sm text-white rounded-lg transition-colors cursor-pointer"
          >
            {loadingRepo ? "Fetching..." : "Import"}
          </button>
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Target Output Language Selection */}
      {/* Explicitly instructs the LLM on the exact output localization regardless of source repository content */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          README Output Language
        </label>
        <select
          name="language"
          value={form.language}
          onChange={handleChange}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
        >
          <option value="pt-BR">Portuguese</option>
          <option value="en-US">English</option>
          <option value="auto">Auto (Infer from repository)</option>
        </select>
        <p className="text-xs text-zinc-500">
          Select auto to let the AI follow the repository&apos;s predominant
          language.
        </p>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Primary Project Metadata Core */}
      {/* Direct mapping vectors for the core prompt context payload */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Project Name *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g., my-cli-tool"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Stack / Language
          </label>
          <input
            name="stack"
            value={form.stack}
            onChange={handleChange}
            placeholder="e.g., Python, FastAPI, Docker"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2 col-span-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Description *
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="A detailed description of your project, its purpose, and core mechanics..."
            rows={3}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Installation Command
          </label>
          <input
            name="install"
            value={form.install}
            onChange={handleChange}
            placeholder="e.g., pip install mypkg"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Usage Command
          </label>
          <input
            name="usage"
            value={form.usage}
            onChange={handleChange}
            placeholder="e.g., mypkg run --config file.yaml"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Author / GitHub
          </label>
          <input
            name="author"
            value={form.author}
            onChange={handleChange}
            placeholder="e.g., johndev"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            License
          </label>
          <select
            name="license"
            value={form.license}
            onChange={handleChange}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
          >
            {LICENSES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Primary Inference Engine Selection */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          AI Model Engine
        </label>
        <div className="grid grid-cols-2 gap-3">
          {AI_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, aiModel: m.id }))}
              className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                form.aiModel === m.id
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <span
                className={`text-sm font-medium ${form.aiModel === m.id ? "text-indigo-400" : "text-white"}`}
              >
                {m.label}
              </span>
              <span className="text-xs text-zinc-500">{m.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Structural Template Configuration */}
      {/* Varies layout structure and sections order without mutating source data */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Template Style
        </label>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, template: t.id }))}
              className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                form.template === t.id
                  ? "border-white bg-zinc-800"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <span className="text-sm font-medium text-white">{t.label}</span>
              <span className="text-xs text-zinc-500">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Section Blocks Selection */}
      {/* Allows users to explicitly include or exclude documentation sections */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Included Sections
        </label>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSection(s.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
                form.sections.includes(s.id)
                  ? "border-white bg-zinc-800 text-white"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Advanced Generation Architecture Selection */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Generation Architecture
        </label>
        <button
          type="button"
          disabled={!isAuth}
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              chunkedGeneration: !prev.chunkedGeneration,
            }))
          }
          className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-all ${
            !isAuth
              ? "border-zinc-800 bg-zinc-900/30 opacity-50 cursor-not-allowed"
              : form.chunkedGeneration
                ? "border-indigo-500 bg-indigo-500/10 cursor-pointer"
                : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 cursor-pointer"
          }`}
        >
          <div
            className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
              form.chunkedGeneration && isAuth
                ? "bg-indigo-600 border-indigo-600"
                : "border-zinc-600 bg-zinc-900"
            }`}
          >
            {form.chunkedGeneration && isAuth && (
              <svg
                viewBox="0 0 14 14"
                fill="none"
                className="w-3.5 h-3.5 text-white"
              >
                <path
                  d="M3 8L6 11L11 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <span
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                form.chunkedGeneration && isAuth
                  ? "text-indigo-400"
                  : "text-zinc-200"
              }`}
            >
              Deep Chunked Generation (High Quality)
              {!isAuth && (
                <span className="text-[10px] uppercase bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full text-zinc-400 tracking-wider">
                  Requires Login
                </span>
              )}
            </span>
            <span className="text-xs text-zinc-500 leading-relaxed">
              When enabled, the AI generates the README section by section
              rather than all at once. This avoids AI truncation limits and
              massively increases depth, but{" "}
              <strong className="font-medium text-zinc-400">
                may take 30-40 seconds
              </strong>
              . Leave disabled for ultra-fast standard generation.
            </span>
          </div>
        </button>
      </div>

      {/* Error Feedback Block */}
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Premium Submission Core Trigger */}
      {/* Integrating subtle dark multi-stop background transfers using oversized continuous background positioning */}
      <button
        type="submit"
        disabled={loading}
        className={`relative group w-full py-4 bg-size-[200%_auto] border border-white/5 hover:border-white/10 text-white font-medium rounded-xl shadow-md shadow-slate-600 active:shadow-none transition-all duration-700 overflow-hidden active:scale-[0.97] ${
          loading
            ? "bg-linear-to-r from-red-500 via-yellow-400 via-green-500 via-blue-600 via-pink-500 to-purple-600 animate-pulse bg-left hover:bg-right cursor-wait opacity-90"
            : "bg-linear-to-r from-blue-950 via-indigo-950 to-slate-900 bg-left hover:bg-right cursor-pointer"
        }`}
      >
        {/* Absolute subtle hardware glow filter overlay on hover */}
        <div className="absolute inset-0 w-full h-full bg-linear-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
        <span className="relative z-10 flex items-center justify-center gap-2 text-sm tracking-wider uppercase text-zinc-300 group-hover:text-white transition-colors">
          {loading ? "Generating Magic..." : "Generate README with AI →"}
        </span>
      </button>
    </form>
  );
}
