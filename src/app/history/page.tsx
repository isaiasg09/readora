"use client";

import HistoryList from "@/components/HistoryList";
import { Readme } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const router = useRouter();
  // Client state array indexing fetched persistent document blobs alongside localized loading controls.
  const [readmes, setReadmes] = useState<Readme[]>([]);
  const [loading, setLoading] = useState(true);

  // Ingesting historical snapshot collections automatically on mounting phases.
  useEffect(() => {
    async function fetchHistory() {
      try {
        // Accessing base persistence endpoints to stream ordered historical generation histories.
        const res = await fetch("/api/readme");
        const data = await res.json();
        setReadmes(data);
      } catch {
        console.error("Error retrieving historical document streams");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  // Evicting specified entity keys deterministically client-side to bypass full data fetching cycles.
  function handleDelete(id: string) {
    // Purging view layers instantly following remote persistent deletion confirmations.
    setReadmes((prev) => prev.filter((r) => r.id !== id));
  }

  // Routing client view layout to dedicated full-screen editor paths targeting chosen entities.
  function handleEdit(readme: Readme) {
    // History stream items serve as direct dynamic routing hooks restoring past interactive spaces.
    router.push(`/editor/${readme.id}`);
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-zinc-400 text-sm">
          Persistent history buffer containing previously authored workspace README generations.
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm animate-pulse">Loading history buffer...</p>
      ) : (
        // Abstracting entity state manipulation bindings (mutations/routing) inside unified list components.
        <HistoryList
          readmes={readmes}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
