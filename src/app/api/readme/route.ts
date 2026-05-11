import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET — retorna todos os READMEs salvos, do mais recente para o mais antigo.
// Isso alimenta a tela de histórico.
export async function GET() {
  try {
    // A ordenação descendente deixa o conteúdo recém-gerado no topo da lista.
    const readmes = await prisma.readme.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(readmes);
  } catch (error) {
    console.error("[readme] Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}

// DELETE — deleta um README pelo id passado como query param (?id=...).
// A rota é simples porque o histórico só precisa remover um registro por vez.
export async function DELETE(req: NextRequest) {
  try {
    // O id vem na query string para evitar criar um corpo desnecessário para essa operação.
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não informado" }, { status: 400 });
    }

    await prisma.readme.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[readme] Erro ao deletar README:", error);
    return NextResponse.json(
      { error: "Erro ao deletar README" },
      { status: 500 }
    );
  }
}
