import { generateReadme } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Define o tipo dos dados que essa rota espera receber no body da requisição
interface GenerateRequestBody {
  name: string;
  stack: string;
  description: string;
  install: string;
  usage: string;
  author: string;
  license: string;
  language: string;
  sections: string[];
  template: string;
  repoUrl?: string; // opcional — só preenchido se o usuário informar um repo do GitHub
}

function getLanguageInstruction(language: string): string {
  // Traduz a escolha do seletor para uma instrução clara no prompt.
  if (language === "pt-BR") return "Portuguese (Brazilian Portuguese)";
  if (language === "en-US") return "English";
  return "the same language most consistent with the repository content";
}

export async function POST(req: NextRequest) {
  try {
    // Extrai os dados enviados pelo formulário
    const body: GenerateRequestBody = await req.json();

    const {
      name,
      stack,
      description,
      install,
      usage,
      author,
      license,
      language,
      sections,
      template,
      repoUrl,
    } = body;

    // Validação básica — nome e descrição são obrigatórios.
    // São os campos mínimos para a IA ter contexto suficiente sem gerar ruído.
    if (!name || !description) {
      return NextResponse.json(
        { error: "Nome e descrição são obrigatórios" },
        { status: 400 }
      );
    }

    // Monta o prompt que será enviado para o generateReadme.
    // A ideia aqui é transformar o estado do formulário em instruções objetivas para a IA,
    // reduzindo ambiguidades e forçando a saída no idioma escolhido.
    const prompt = `
      You are a technical writer. Generate a professional, well-structured README.md in Markdown for the following project.

      Write the entire README in ${getLanguageInstruction(language)}.
      Keep headings, sections, explanatory text, and notes in that language.
      If language is set to auto, infer the best language from the repository context.

      Project info:
      - Name: ${name}
      - Stack: ${stack || "not specified"}
      - Description: ${description}
      - Install command: ${install || "not specified"}
      - Usage command: ${usage || "not specified"}
      - Author/GitHub: ${author || "not specified"}
      - License: ${license}
      - Sections to include: ${sections.join(", ")}
      - Template style: ${template}

      Rules:
      - Use proper Markdown with headers, code blocks, and badges where relevant
      - Badges should use shields.io format
      - Be concise but complete
      - Do not add placeholder text like "add your description here"
      - If a section's info was not provided, write a sensible placeholder based on the project context
      - Output ONLY the raw Markdown, no explanation, no code fences
    `;

    // Chama o generateReadme() e aguarda o README gerado.
    // O retorno já vem pronto para salvar no banco e exibir no preview.
    const content = await generateReadme(prompt);

    // Salva o README gerado no banco de dados para o histórico.
    // Isso permite voltar depois e editar/exportar sem refazer a geração.
    const readme = await prisma.readme.create({
      data: {
        title: name,
        content,
        template,
        repoUrl: repoUrl ?? null,
      },
    });

    // Retorna o README gerado e o id salvo no banco
    return NextResponse.json({ content, id: readme.id });
  } catch (error) {
    console.error("[generate] Erro ao gerar README:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar o README" },
      { status: 500 }
    );
  }
}
