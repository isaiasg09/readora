"use client";

import { Readme } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

interface HistoryListProps {
  // Persistence array containing remote workspace records delivered by parent data feeds
  readmes: Readme[];
  // Invoked upon successful entity eviction to let parent streams truncate local vectors
  onDelete: (id: string) => void;
  // Invoked to transition application context to full-screen editor layouts
  onEdit: (readme: Readme) => void;
}

export default function HistoryList({
  readmes,
  onDelete,
  onEdit,
}: HistoryListProps) {
  // Caching target deletion key scalars locally to restrict spinners exclusively to active mutations.
  // Preserves full interactive layout availability across adjacent history entries.
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    // Isolating visual state feedback indices cleanly to the specific target block.
    setDeletingId(id);

    try {
      const res = await fetch(`/api/readme?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Error purging target workspace entity.");
        return;
      }

      // Propagating successful eviction scalar indices upstream to synchronize state loops
      onDelete(id);
    } catch {
      alert("Error communicating with workspace persistence endpoint.");
    } finally {
      setDeletingId(null);
    }
  }

  // Gracefully fallback to informative blank canvas viewports if collection buffers yield zero length
  if (readmes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-zinc-500 text-sm">No persistent README records generated yet.</p>
        <p className="text-zinc-600 text-xs">
          Bootstrap your first professional document layer via the primary entry point.
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
          {/* Entity layout payload descriptor */}
          {/* Surfacing dense meta properties to let rows serve as standalone fast-lookup badges */}
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-medium text-white truncate">
              {readme.title}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">
                {formatDate(new Date(readme.createdAt))}
              </span>
              {/* Surfacing chosen generation architecture templates */}
              <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                {readme.template}
              </span>
              {/* Render remote context repository URIs if bound during bootstrap streams */}
              {readme.repoUrl && (
                <span className="text-xs text-zinc-600 truncate max-w-50">
                  {readme.repoUrl}
                </span>
              )}
            </div>
          </div>

          {/* Lifecycle control interfaces */}
          {/* Side-by-side positioning ensuring minimal mouse trajectory loops */}
          <div className="flex gap-2 shrink-0 ml-4">
            <button
              onClick={() => onEdit(readme)}
              className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition-colors cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(readme.id)}
              disabled={deletingId === readme.id}
              className="px-3 py-1.5 text-sm border border-red-900 text-red-500 hover:bg-red-900/20 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
            >
              {deletingId === readme.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
