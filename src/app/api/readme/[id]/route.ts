import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET — Retrieves explicit README entity payloads targeted by primary database identifier tuples.
// Consumed by standalone editor boundaries to restore local editing snapshots.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js App Router dynamic route parameters are evaluated asynchronously to support streaming middleware.
    const { id } = await params;

    // Fetching unique database record matching active workspace session targets.
    const readme = await prisma.readme.findUnique({ where: { id } });

    if (!readme) {
      return NextResponse.json(
        { error: "Target document record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(readme);
  } catch (error) {
    console.error("[readme/id] Error fetching target document entity:", error);
    return NextResponse.json(
      { error: "Internal service exception while loading entity record" },
      { status: 500 }
    );
  }
}

// PATCH — Updates underlying storage snapshots for persistent workspace documents.
// Invoked dynamically by live editing loops to enforce source of truth alignment.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Intercepting targeted update payloads to mutate raw markdown text fields selectively.
    const { id } = await params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Missing document update payload parameter" },
        { status: 400 }
      );
    }

    const updated = await prisma.readme.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[readme/id] Error committing update payload:", error);
    return NextResponse.json(
      { error: "Failed to persist document edits to primary storage" },
      { status: 500 }
    );
  }
}
