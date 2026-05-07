"use client";

import HistoryList from "@/components/HistoryList";
import { Readme } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const router = useRouter();
  const [readmes, setReadmes] = useState<Readme[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca o histórico ao carregar a página
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/readme");
        const data = await res.json();
        setReadmes(data);
      } catch {
        console.error("Erro ao buscar histórico");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  // Remove o README deletado da lista local sem precisar rebuscar tudo
  function handleDelete(id: string) {
    setReadmes((prev) => prev.filter((r) => r.id !== id));
  }

  // Navega para a página de edição do README clicado
  function handleEdit(readme: Readme) {
    router.push(`/editor/${readme.id}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
        <p className="text-zinc-400 text-sm">
          Todos os READMEs gerados ficam salvos aqui.
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Carregando...</p>
      ) : (
        <HistoryList
          readmes={readmes}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
