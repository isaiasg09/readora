"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ZapIcon, Link01Icon, SparklesIcon } from "@hugeicons/core-free-icons";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] gap-20 relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-violet-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <div className="flex flex-col items-center gap-8 text-center z-10 max-w-3xl">
        {/* Animated gradient title */}
        <div className="flex flex-col items-center gap-4">
          <h1
            className="text-7xl sm:text-8xl font-extrabold tracking-tighter leading-none animate-shimmer bg-size-[200%_100%] bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(105deg, #e2e8f0 0%, #818cf8 25%, #c084fc 50%, #818cf8 75%, #e2e8f0 100%)",
            }}
          >
            readora
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-xl leading-relaxed">
            Generate stunning, production-grade{" "}
            <span className="text-white font-medium">README.md</span> files for
            your projects — powered by AI, delivered in seconds.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4 mt-2">
          <Link
            href="/generate"
            className="group relative px-8 py-3.5 bg-white text-black font-semibold rounded-xl text-sm tracking-wide overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <span className="relative z-10">Generate a README →</span>
          </Link>

          {!session && (
            <Link
              href="/signin"
              className="px-8 py-3.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium rounded-xl text-sm tracking-wide transition-all duration-300 hover:bg-white/5"
            >
              Sign In
            </Link>
          )}

          {session && (
            <Link
              href="/history"
              className="px-8 py-3.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium rounded-xl text-sm tracking-wide transition-all duration-300 hover:bg-white/5"
            >
              My History
            </Link>
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 z-10 max-w-4xl w-full px-4">
        <FeatureCard
          icon={ZapIcon}
          title="Lightning Fast"
          description="Generate comprehensive READMEs in under 10 seconds with our optimized AI pipeline."
        />
        <FeatureCard
          icon={Link01Icon}
          title="GitHub Import"
          description="Paste a repository URL and auto-populate fields from your project's metadata."
        />
        <FeatureCard
          icon={SparklesIcon}
          title="Deep Chunked Mode"
          description="Sign in to unlock section-by-section generation for unmatched depth and quality."
        />
      </div>

      {/* Subtle footer trust badge */}
      <p className="text-xs text-zinc-600 z-10">
        Open source • AI-powered • Built for developers
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
  title: string;
  description: string;
}) {
  return (
    <div className="group flex flex-col gap-3 p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm hover:border-zinc-700 hover:bg-zinc-900/60 transition-all duration-300">
      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
        <HugeiconsIcon icon={icon} size={20} color="#818cf8" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-white tracking-wide">
        {title}
      </h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}
