"use client";

import { Readme } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

interface HistoryListProps {
  // Lista de READMEs salvos vindos do servidor
  readmes: Readme[];
  // Chamada quando o usuário deletar um README para atualizar a lista
  onDelete: (id: string) => void;
  // Chamada quando o usuário clicar em editar um README
  onEdit: (readme: Readme) => void;
}

export default function HistoryList({
  readmes,
  onDelete,
  onEdit,
}: HistoryListProps) {
  // Guarda o id do README que está sendo deletado para mostrar loading no botão certo
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const res = await fetch(`/api/readme?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Erro ao deletar README.");
        return;
      }

      // Avisa o componente pai para remover o item da lista
      onDelete(id);
    } catch {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setDeletingId(null);
    }
  }

  // Lista vazia
  if (readmes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-zinc-500 text-sm">Nenhum README gerado ainda.</p>
        <p className="text-zinc-600 text-xs">
          Gere seu primeiro README na página principal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {readmes.map((readme) => (
        <div
          key={readme.id}
          className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
        >
          {/* Informações do README */}
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-medium text-white truncate">
              {readme.title}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">
                {formatDate(new Date(readme.createdAt))}
              </span>
              {/* Mostra o template usado como badge */}
              <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                {readme.template}
              </span>
              {/* Mostra a URL do repo se existir */}
              {readme.repoUrl && (
                <span className="text-xs text-zinc-600 truncate max-w-50">
                  {readme.repoUrl}
                </span>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 shrink-0 ml-4">
            <button
              onClick={() => onEdit(readme)}
              className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition-colors cursor-pointer"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(readme.id)}
              disabled={deletingId === readme.id}
              className="px-3 py-1.5 text-sm border border-red-900 text-red-500 hover:bg-red-900/20 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
            >
              {deletingId === readme.id ? "Deletando..." : "Deletar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
