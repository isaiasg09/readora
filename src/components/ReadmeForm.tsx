"use client";

import {
  GithubContext,
  LICENSES,
  ReadmeFormData,
  SECTIONS,
  TEMPLATES,
} from "@/lib/types";
import { useState } from "react";

// Props do componente — recebe uma função que é chamada quando o README é gerado
interface ReadmeFormProps {
  onGenerate: (content: string, id: string) => void;
}

export default function ReadmeForm({ onGenerate }: ReadmeFormProps) {
  // Estado do formulário com valores padrão
  // Esses valores são enviados para a rota de geração e também podem ser
  // preenchidos automaticamente quando o usuário importa um repositório.
  const [form, setForm] = useState<ReadmeFormData>({
    name: "",
    stack: "",
    description: "",
    install: "",
    usage: "",
    author: "",
    license: "MIT",
    language: "pt-BR",
    sections: ["features", "install", "usage", "license", "badges"],
    template: "default",
  });

  // Estados de controle da UI
  // Eles servem apenas para feedback visual: carregamento, erro e URL do repo.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [loadingRepo, setLoadingRepo] = useState(false);

  // Atualiza um campo do formulário pelo nome
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Adiciona ou remove uma seção da lista de seções selecionadas
  function toggleSection(id: string) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.includes(id)
        ? prev.sections.filter((s) => s !== id)
        : [...prev.sections, id],
    }));
  }

  // Busca o repositório do GitHub e pré-preenche o formulário com os dados encontrados
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
        setError("Não foi possível buscar o repositório. Verifique a URL.");
        return;
      }

      // Pré-preenche o formulário com os dados do repositório.
      // A rota do GitHub já devolve o que conseguiu inferir dos arquivos lidos,
      // então aqui só copiamos para o formulário e deixamos o usuário revisar.
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
      setError("Erro ao buscar repositório.");
    } finally {
      setLoadingRepo(false);
    }
  }

  // Envia o formulário para a rota de geração
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Mantém a validação simples no cliente para evitar chamadas desnecessárias.
    if (!form.name || !form.description) {
      setError("Nome e descrição são obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      // Envia o estado inteiro do formulário; a API decide como transformar isso em README.
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar README.");
        return;
      }

      // Entrega o conteúdo gerado para o componente pai, que atualiza preview e editor.
      onGenerate(data.content, data.id);
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Seção de importação pelo GitHub */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Importar do GitHub
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://github.com/usuario/repositorio"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={handleFetchRepo}
            disabled={loadingRepo || !repoUrl}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-sm text-white rounded-lg transition-colors"
          >
            {loadingRepo ? "Buscando..." : "Importar"}
          </button>
        </div>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Idioma do README */}
      {/* Esse campo define o idioma final do texto gerado, mesmo quando o repo estiver em outro idioma. */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Idioma do README
        </label>
        <select
          name="language"
          value={form.language}
          onChange={handleChange}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
        >
          <option value="pt-BR">Português</option>
          <option value="en-US">Inglês</option>
          <option value="auto">Automático pelo repositório</option>
        </select>
        <p className="text-xs text-zinc-500">
          Use automático se quiser que a IA siga o idioma predominante do
          projeto.
        </p>
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Campos principais do formulário */}
      {/* Aqui ficam os dados que entram diretamente no prompt da IA. */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Nome do projeto *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="ex: my-cli-tool"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Stack / Linguagem
          </label>
          <input
            name="stack"
            value={form.stack}
            onChange={handleChange}
            placeholder="ex: Python, FastAPI, Docker"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2 col-span-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Descrição *
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="O que o projeto faz em 1-3 frases..."
            rows={3}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Instalação
          </label>
          <input
            name="install"
            value={form.install}
            onChange={handleChange}
            placeholder="ex: pip install mypkg"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Uso
          </label>
          <input
            name="usage"
            value={form.usage}
            onChange={handleChange}
            placeholder="ex: mypkg run --config file.yaml"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Autor / GitHub
          </label>
          <input
            name="author"
            value={form.author}
            onChange={handleChange}
            placeholder="ex: johndoe"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Licença
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

      {/* Seleção de template */}
      {/* Cada template muda a forma de organizar o README, sem alterar os dados coletados. */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Template
        </label>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, template: t.id }))}
              className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-colors ${
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

      {/* Seleção de seções */}
      {/* O usuário escolhe quais blocos o README final deve incluir. */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Seções
        </label>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSection(s.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
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

      {/* Mensagem de erro */}
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Botão de submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-slate-200 hover:bg-zinc-200 disabled:opacity-40 text-black font-medium rounded-lg transition-colors cursor-pointer"
      >
        {loading ? "Gerando..." : "Gerar README com IA →"}
      </button>
    </form>
  );
}
