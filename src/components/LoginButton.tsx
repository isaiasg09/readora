"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon, GoogleIcon } from "@hugeicons/core-free-icons";

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-24 bg-zinc-800 animate-pulse rounded-md"></div>
    );
  }

  if (session && session.user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">
          Hi, <strong className="text-white">{session.user.name?.split(" ")[0]}</strong>
        </span>
        <button
          onClick={() => signOut()}
          className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => signIn("github")}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors cursor-pointer"
      >
        <HugeiconsIcon icon={GithubIcon} size={14} color="currentColor" strokeWidth={1.5} />
        GitHub
      </button>
      <button
        onClick={() => signIn("google")}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-200 text-black rounded-md transition-colors cursor-pointer"
      >
        <HugeiconsIcon icon={GoogleIcon} size={14} color="currentColor" strokeWidth={1.5} />
        Google
      </button>
    </div>
  );
}
