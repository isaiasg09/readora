"use client";

import ReadmeEditor from "@/components/ReadmeEditor";
import ReadmePreview from "@/components/ReadmePreview";
import { Readme } from "@/lib/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditorPage() {
  // Pega o id da URL — ex: /editor/abc123 → id = "abc123"
  const { id } = useParams<{ id: string }>();

  const [readme, setReadme] = useState<Readme | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Busca o README pelo id ao carregar a página
  useEffect(() => {
    async function fetchReadme() {
      try {
        const res = await fetch(`/api/readme/${id}`);

        if (!res.ok) {
          setError("README não encontrado.");
          return;
        }

        const data: Readme = await res.json();
        setReadme(data);
        setContent(data.content);
      } catch {
        setError("Erro ao carregar README.");
      } finally {
        setLoading(false);
      }
    }

    fetchReadme();
  }, [id]);

  // Atualiza o conteúdo local após salvar no editor
  function handleSave(newContent: string) {
    setContent(newContent);
  }

  if (loading) {
    return <p className="text-zinc-500 text-sm">Carregando...</p>;
  }

  if (error || !readme) {
    return (
      <p className="text-red-400 text-sm">
        {error || "README não encontrado."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{readme.title}</h1>
        <p className="text-zinc-500 text-sm">
          Edite o README gerado e exporte quando estiver pronto.
        </p>
      </div>

      {/* Editor e preview lado a lado em tela cheia */}
      <div className="grid grid-cols-2 gap-6">
        <ReadmeEditor id={id} initialContent={content} onSave={handleSave} />
        <ReadmePreview content={content} />
      </div>
    </div>
  );
}
