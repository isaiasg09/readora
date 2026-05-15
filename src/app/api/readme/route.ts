import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET — Yields paginated/ordered persistence records sequentially sorted by insertion chronology.
// Ingested by proactive history layouts to reconstruct past generation streams.
export async function GET() {
  try {
    // Enforcing reverse chronological sorting indices to surface newly authored document blobs immediately.
    const readmes = await prisma.readme.findMany({
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

// DELETE — Evicts explicit README entities matching target UUID path strings.
// Operates idempotently to truncate standalone workspace artifacts on demand.
export async function DELETE(req: NextRequest) {
  try {
    // Intercepting target identifiers via search parameters to eliminate superfluous HTTP request bodies.
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing Target ID parameter" }, { status: 400 });
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
