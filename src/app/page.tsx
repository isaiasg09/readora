"use client";

import ReadmeEditor from "@/components/ReadmeEditor";
import ReadmeForm from "@/components/ReadmeForm";
import ReadmePreview from "@/components/ReadmePreview";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  // Active document state controller. Presence of content transitions view from form mode to split editor/preview layout.
  const [generatedContent, setGeneratedContent] = useState("");
  // Caches persisted record ID to allow routing to dedicated full-screen editor views.
  const [readmeId, setReadmeId] = useState("");

  function handleGenerate(content: string, id: string) {
    // Synchronizes dual state vectors simultaneously: the raw string content and database entity reference.
    setGeneratedContent(content);
    setReadmeId(id);
  }

  function handleSave(content: string) {
    // Keeps live preview layout perfectly synchronized with local state persistence updates.
    setGeneratedContent(content);
  }

  // Split view mode — dynamically renders workspace grid upon document presence
  if (generatedContent) {
    return (
      <div className="flex flex-col gap-4">
        {/* Navigation layout banner displaying action controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setGeneratedContent("")}
            className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Generate new
          </button>
          {/* Transitions document context to a clean, single-purpose full-screen editor tab */}
          <button
            onClick={() => router.push(`/editor/${readmeId}`)}
            className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Open full screen →
          </button>
        </div>

        {/* Side-by-side interactive code editing and markdown rendering layout */}
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

  // Initial compact central input configuration layout
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Generate README</h1>
        <p className="text-zinc-400 text-sm">
          Provide your project context to dynamically generate a premium, structured README.md using AI.
        </p>
      </div>

      <ReadmeForm onGenerate={handleGenerate} />
    </div>
  );
}
