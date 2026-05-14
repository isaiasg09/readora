"use client";

import { useState } from "react";

interface ReadmeEditorProps {
  id: string;
  initialContent: string;
  // Invoked upon persisting local edits to keep surrounding context updated
  onSave: (content: string) => void;
}

export default function ReadmeEditor({
  id,
  initialContent,
  onSave,
}: ReadmeEditorProps) {
  // Local state buffering ensures seamless keystroke latency without triggering premature server communications.
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Persists edited markdown payload via PATCH /api/readme/[id]
  async function handleSave() {
    // Orchestrating state locks to guarantee data consistency during network transit.
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
        setError("Error saving modifications. Please try again.");
        return;
      }

      // Propagate updated state payload to upstream layout listeners
      onSave(content);
      setSaved(true);

      // Dismiss positive confirmation feedback automatically after delay
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Error connecting to persistent storage service.");
    } finally {
      setSaving(false);
    }
  }

  // Generates instantaneous downloadable standard markdown client-side
  function handleExport() {
    // Instantiating local static blobs to avoid unnecessary back-end rendering invocations.
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();

    // Cleaning up dynamically generated object references to prevent memory leaks
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Editor control header */}
      {/* Grouping primary output interfaces: state synchronization and artifact export */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Editor
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition-colors cursor-pointer"
          >
            Export .md
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-white hover:bg-zinc-200 disabled:opacity-40 text-black rounded-lg transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>

      {/* Code editing workspace */}
      {/* Decoupling raw editing view from high-fidelity dynamic markdown preview pane */}
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
