import { generateReadme } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Request interface defining expected client-side form submission payload parameters
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
  repoUrl?: string; // Optional context source tracking vector injected upon GitHub repo bootstrap
}

function getLanguageInstruction(language: string): string {
  // Mapping client locale keys to explicit instructions optimized for the LLM system prompt.
  if (language === "pt-BR") return "Portuguese (Brazilian Portuguese)";
  if (language === "en-US") return "English";
  return "the same language most consistent with the repository content";
}

export async function POST(req: NextRequest) {
  try {
    // Intercept incoming payload from client generation dispatcher
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

    // Guard clauses enforcing base contextual data requirements to guarantee generation quality.
    if (!name || !description) {
      return NextResponse.json(
        { error: "Project Name and Description are required" },
        { status: 400 }
      );
    }

    // Composing standard LLM generation prompt.
    // Encapsulating structured instructions to enforce strict output localized formatting.
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

    // Await completion buffer from remote Groq SDK inference endpoint
    const content = await generateReadme(prompt);

    // Persisting snapshot payload natively to SQL workspace storage to permit asynchronous reference
    const readme = await prisma.readme.create({
      data: {
        title: name,
        content,
        template,
        repoUrl: repoUrl ?? null,
      },
    });

    // Outputting successfully processed document string alongside database reference scalar
    return NextResponse.json({ content, id: readme.id });
  } catch (error) {
    console.error("[generate] Error generating README:", error);
    return NextResponse.json(
      { error: "Internal service error during generation lifecycle" },
      { status: 500 }
    );
  }
}
