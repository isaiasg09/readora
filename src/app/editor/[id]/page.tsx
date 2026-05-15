"use client";

import ReadmeEditor from "@/components/ReadmeEditor";
import ReadmePreview from "@/components/ReadmePreview";
import { Readme } from "@/lib/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditorPage() {
  // Extracting active database target identifier parameter from routing hooks.
  // Example: /editor/abc123 -> id = "abc123"
  const { id } = useParams<{ id: string }>();

  // Buffer holding dynamic state vectors for server persistence records alongside layout loading states.
  const [readme, setReadme] = useState<Readme | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Resolving record snapshot content asynchronously upon component initialization.
  useEffect(() => {
    async function fetchReadme() {
      try {
        // Invoking direct storage retrieval endpoint to hydrate localized client editors.
        const res = await fetch(`/api/readme/${id}`);

        if (!res.ok) {
          setError("Document record not found.");
          return;
        }

        const data: Readme = await res.json();
        setReadme(data);
        setContent(data.content);
      } catch {
        setError("Error connecting to data storage service.");
      } finally {
        setLoading(false);
      }
    }

    fetchReadme();
  }, [id]);

  // Synchronize local workspace state variables immediately upon client persistence completion.
  function handleSave(newContent: string) {
    // Elevating state updates upstream to guarantee rendering synchronization across adjacent split panes.
    setContent(newContent);
  }

  if (loading) {
    return <p className="text-zinc-500 text-sm animate-pulse">Loading workspace...</p>;
  }

  if (error || !readme) {
    return (
      <p className="text-red-400 text-sm">
        {error || "Target README document could not be resolved."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{readme.title}</h1>
        <p className="text-zinc-500 text-sm">
          Fine-tune generated artifact code structures and export markdown client-side.
        </p>
      </div>

      {/* Side-by-side interactive split preview engine layout spanning entire client screen boundaries */}
      {/* Guarantees zero latency verification rendering code changes instantaneously */}
      <div className="grid grid-cols-2 gap-6">
        <ReadmeEditor id={id} initialContent={content} onSave={handleSave} />
        <ReadmePreview content={content} />
      </div>
    </div>
  );
}
