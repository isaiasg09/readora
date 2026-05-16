"use client";

import HistoryList from "@/components/HistoryList";
import { Readme } from "@/lib/types";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { NotebookIcon, GithubIcon, GoogleIcon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Client state array indexing fetched persistent document blobs alongside localized loading controls.
  const [readmes, setReadmes] = useState<Readme[]>([]);
  const [loading, setLoading] = useState(true);

  // Ingesting historical snapshot collections automatically on mounting phases (only when authenticated).
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      setLoading(false);
      return;
    }

    async function fetchHistory() {
      try {
        const res = await fetch("/api/readme");
        if (res.ok) {
          const data = await res.json();
          setReadmes(data);
        }
      } catch {
        console.error("Error retrieving historical document streams");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [session, status]);

  // Evicting specified entity keys deterministically client-side to bypass full data fetching cycles.
  function handleDelete(id: string) {
    setReadmes((prev) => prev.filter((r) => r.id !== id));
  }

  // Routing client view layout to dedicated full-screen editor paths targeting chosen entities.
  function handleEdit(readme: Readme) {
    router.push(`/editor/${readme.id}`);
  }

  // Unauthenticated state — premium login prompt
  if (status !== "loading" && !session?.user) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <HugeiconsIcon icon={NotebookIcon} size={28} color="#818cf8" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Your README History</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Sign in to save and manage your generated READMEs across devices. 
            Your documents are stored securely and accessible anytime.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => signIn("github")}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={GithubIcon} size={16} color="currentColor" strokeWidth={1.5} />
            Sign in with GitHub
          </button>
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-white hover:bg-zinc-200 text-black rounded-lg transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={GoogleIcon} size={16} color="currentColor" strokeWidth={1.5} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-zinc-400 text-sm">
          Your previously generated README documents, saved and ready to edit.
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm animate-pulse">Loading history...</p>
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
