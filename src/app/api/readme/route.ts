import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET — Returns only the logged-in user's readmes, or 401 if not authenticated.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required to access history." },
        { status: 401 }
      );
    }

    // Enforcing reverse chronological sorting indices scoped to the authenticated user.
    const readmes = await prisma.readme.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(readmes);
  } catch (error) {
    console.error("[readme] Error querying record history:", error);
    return NextResponse.json(
      { error: "Internal service exception querying history collection" },
      { status: 500 }
    );
  }
}

// DELETE — Evicts README entities only if they belong to the authenticated user.
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing Target ID parameter" }, { status: 400 });
    }

    // Verify ownership before deletion
    const readme = await prisma.readme.findUnique({ where: { id } });

    if (!readme || readme.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this README." }, { status: 403 });
    }

    await prisma.readme.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[readme] Error evicting document entity:", error);
    return NextResponse.json(
      { error: "Failed to purge database persistence record" },
      { status: 500 }
    );
  }
}
