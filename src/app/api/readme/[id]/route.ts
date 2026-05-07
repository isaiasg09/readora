import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET — retorna um README específico pelo id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // No Next.js 15 o params é uma Promise, então precisamos aguardar
    const { id } = await params;

    const readme = await prisma.readme.findUnique({ where: { id } });

    if (!readme) {
      return NextResponse.json(
        { error: "README não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(readme);
  } catch (error) {
    console.error("[readme/id] Erro ao buscar README:", error);
    return NextResponse.json(
      { error: "Erro ao buscar README" },
      { status: 500 }
    );
  }
}

// PATCH — atualiza o conteúdo de um README existente (usado no editor)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Conteúdo não informado" },
        { status: 400 }
      );
    }

    const updated = await prisma.readme.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[readme/id] Erro ao atualizar README:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar README" },
      { status: 500 }
    );
  }
}
