"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon, GoogleIcon } from "@hugeicons/core-free-icons";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex flex-col items-center gap-10 z-10 w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Link
            href="/"
            className="text-3xl font-extrabold tracking-tighter bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
          >
            readora
          </Link>
          <p className="text-zinc-400 text-sm">
            Sign in to save your READMEs and unlock advanced features.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error === "OAuthAccountNotLinked"
              ? "This email is already associated with another provider. Please sign in with the original provider."
              : "An error occurred during sign in. Please try again."}
          </div>
        )}

        {/* Sign-in card */}
        <div className="w-full flex flex-col gap-4 p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <button
            onClick={() => signIn("github", { callbackUrl })}
            className="flex items-center justify-center gap-3 w-full px-5 py-3 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <HugeiconsIcon icon={GithubIcon} size={18} color="currentColor" strokeWidth={1.5} />
            Continue with GitHub
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="flex items-center justify-center gap-3 w-full px-5 py-3 text-sm font-medium bg-white hover:bg-zinc-100 text-black rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <HugeiconsIcon icon={GoogleIcon} size={18} color="currentColor" strokeWidth={1.5} />
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-zinc-600 text-center leading-relaxed">
          By signing in, you agree to our terms.
          <br />
          Your data is stored securely and never shared.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
