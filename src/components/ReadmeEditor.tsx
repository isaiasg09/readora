"use client";

import { useState } from "react";

interface ReadmeEditorProps {
  id: string;
  initialContent: string;
  // Chamada quando o usuário salvar as alterações
  onSave: (content: string) => void;
}

export default function ReadmeEditor({
  id,
  initialContent,
  onSave,
}: ReadmeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Salva o conteúdo editado chamando a rota PATCH /api/readme/[id]
  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/readme/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        setError("Erro ao salvar. Tente novamente.");
        return;
      }

      // Avisa o componente pai que o conteúdo foi atualizado
      onSave(content);
      setSaved(true);

      // Remove o feedback de "salvo" após 2 segundos
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  // Faz o download do conteúdo como arquivo .md
  function handleExport() {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();

    // Libera a URL criada da memória após o download
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Barra de ações */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Editor
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition-colors"
          >
            Exportar .md
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-white hover:bg-zinc-200 disabled:opacity-40 text-black rounded-lg transition-colors"
          >
            {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar"}
          </button>
        </div>
      </div>

      {/* Área de edição do markdown */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 min-h-[500px] bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white font-mono leading-relaxed focus:outline-none focus:border-zinc-500 resize-none"
        spellCheck={false}
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}
    </div>
  );
}
