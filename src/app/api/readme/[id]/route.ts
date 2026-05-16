import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET — Retrieves a README by ID. If it belongs to a user, only that user can access it.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const readme = await prisma.readme.findUnique({ where: { id } });

    if (!readme) {
      return NextResponse.json(
        { error: "Target document record not found" },
        { status: 404 }
      );
    }

    // If the readme has an owner, verify the current user matches
    if (readme.userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || session.user.id !== readme.userId) {
        return NextResponse.json(
          { error: "You do not have permission to view this README." },
          { status: 403 }
        );
      }
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

// PATCH — Updates a README. Only the owner can edit their own readmes.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Missing document update payload parameter" },
        { status: 400 }
      );
    }

    // Verify ownership before allowing edits
    const readme = await prisma.readme.findUnique({ where: { id } });

    if (!readme) {
      return NextResponse.json({ error: "README not found" }, { status: 404 });
    }

    if (readme.userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || session.user.id !== readme.userId) {
        return NextResponse.json(
          { error: "You do not have permission to edit this README." },
          { status: 403 }
        );
      }
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
