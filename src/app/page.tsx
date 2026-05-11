"use client";

import ReadmeEditor from "@/components/ReadmeEditor";
import ReadmeForm from "@/components/ReadmeForm";
import ReadmePreview from "@/components/ReadmePreview";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  // Quando existe conteúdo gerado, a página entra no modo de edição/preview.
  const [generatedContent, setGeneratedContent] = useState("");
  // Guarda o id persistido para permitir abrir a versão completa do README depois.
  const [readmeId, setReadmeId] = useState("");

  function handleGenerate(content: string, id: string) {
    // A geração preenche os dois estados ao mesmo tempo: texto e referência no banco.
    setGeneratedContent(content);
    setReadmeId(id);
  }

  function handleSave(content: string) {
    // Mantém o preview sincronizado com o editor depois de salvar.
    setGeneratedContent(content);
  }

  // Modo editor — ocupa a tela toda
  if (generatedContent) {
    return (
      <div className="flex flex-col gap-4">
        {/* Barra superior com título e ações */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setGeneratedContent("")}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Gerar novo
          </button>
          {/* Abre a mesma leitura em uma tela dedicada, útil para edição mais confortável. */}
          <button
            onClick={() => router.push(`/editor/${readmeId}`)}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Abrir em tela cheia →
          </button>
        </div>

        {/* Editor e preview ocupando toda a largura disponível */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <ReadmeEditor
            id={readmeId}
            initialContent={generatedContent}
            onSave={handleSave}
          />
          <ReadmePreview content={generatedContent} />
        </div>
      </div>
    );
  }

  // Modo formulário — compacto e centralizado
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Gerar README</h1>
        <p className="text-zinc-400 text-sm">
          Preencha as informações do seu projeto e gere um README profissional
          com IA.
        </p>
      </div>

      <ReadmeForm onGenerate={handleGenerate} />
    </div>
  );
}
