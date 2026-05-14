"use client";

import { ReactNode } from "react";
import ReactMarkdown, { Components } from "react-markdown";

interface ReadmePreviewProps {
  content: string;
}

export default function ReadmePreview({ content }: ReadmePreviewProps) {
  // Custom element rendering configurations mapping markdown syntax nodes to localized design system tokens.
  // Enhances readability and aesthetics against the dark palette background.
  const components: Partial<Components> = {
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="text-2xl font-bold text-white border-b border-zinc-700 pb-2 mb-4 mt-6">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-xl font-bold text-white border-b border-zinc-700 pb-1 mb-3 mt-6">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-lg font-bold text-white mb-2 mt-4">{children}</h3>
    ),
    h4: ({ children }: { children?: ReactNode }) => (
      <h4 className="text-base font-bold text-white mb-2 mt-3">{children}</h4>
    ),
    p: ({ children }: { children?: ReactNode }) => (
      <p className="text-zinc-300 leading-relaxed my-3">{children}</p>
    ),
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="text-zinc-300 list-disc list-inside my-3 space-y-1">
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="text-zinc-300 list-decimal list-inside my-3 space-y-1">
        {children}
      </ol>
    ),
    li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
    code: ({ children }: { children?: ReactNode }) => (
      <code className="text-emerald-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    ),
    pre: ({ children }: { children?: ReactNode }) => (
      <pre className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 overflow-x-auto my-3">
        {children}
      </pre>
    ),
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:underline"
      >
        {children}
      </a>
    ),
    strong: ({ children }: { children?: ReactNode }) => (
      <strong className="text-white font-bold">{children}</strong>
    ),
    em: ({ children }: { children?: ReactNode }) => (
      <em className="text-zinc-200 italic">{children}</em>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-4 border-zinc-500 pl-4 text-zinc-400 italic my-3">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="border-zinc-700 my-6" />,
    img: ({ src, alt }: { src?: string | Blob; alt?: string }) => {
      // Identifying inline badge assets dynamically to prevent excessive width allocation.
      const imageSrc = typeof src === "string" ? src : "";
      const isBadge = imageSrc?.includes("shields.io");

      return (
        // Opting out of next/image optimizations to natively support arbitrary absolute markdown artifact URLs and SVGs
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt || ""}
          className={
            isBadge ? "inline-block my-1" : "max-w-full h-auto rounded-lg my-3"
          }
        />
      );
    },
    table: ({ children }: { children?: ReactNode }) => (
      <table className="border border-zinc-700 w-full text-sm text-zinc-300 my-3">
        {children}
      </table>
    ),
    thead: ({ children }: { children?: ReactNode }) => (
      <thead className="bg-zinc-800 border-b border-zinc-700">{children}</thead>
    ),
    tbody: ({ children }: { children?: ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    tr: ({ children }: { children?: ReactNode }) => (
      <tr className="border-b border-zinc-700">{children}</tr>
    ),
    th: ({ children }: { children?: ReactNode }) => (
      <th className="px-4 py-2 text-left text-white font-bold">{children}</th>
    ),
    td: ({ children }: { children?: ReactNode }) => (
      <td className="px-4 py-2">{children}</td>
    ),
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Side-by-side split container ensuring instantaneous output verification */}
      <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
        Preview
      </span>

      <div className="flex-1 min-h-125 bg-zinc-900 border border-zinc-700 rounded-lg px-6 py-4 overflow-y-auto">
        <ReactMarkdown components={components}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
