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
  aiModel: string;
  chunkedGeneration: boolean;
  repoUrl?: string; // Optional context source tracking vector injected upon GitHub repo bootstrap
}

function getLanguageInstruction(language: string): string {
  // Mapping client locale keys to explicit instructions optimized for the LLM system prompt.
  if (language === "pt-BR") return "Portuguese (Brazilian Portuguese)";
  if (language === "en-US") return "English";
  return "the same language most consistent with the repository content";
}

function getTemplateInstruction(template: string): string {
  // Enforcing dynamic stylistic boundaries based on user-selected aesthetics without breaking standard markdown compatibility.
  if (template === "minimal") {
    return "Adopt a clean, concise, and minimalist aesthetic. Focus on brief paragraphs. You may use exactly one clean table if highly beneficial, but generally avoid heavy visual clutter.";
  }
  if (template === "detailed") {
    return "Be extremely thorough and exhaustive. Include detailed configuration tables, deep architectural overviews (if applicable), and rich markdown elements like blockquotes, multi-level lists, and feature grids.";
  }
  if (template === "creative") {
    return "Adopt an informal, playful, and highly engaging tone. Use emojis generously throughout headers and paragraphs to make the reading experience fun. Focus on building a community-friendly atmosphere.";
  }
  if (template === "corporate") {
    return "Use a highly formal, authoritative, and enterprise-grade professional tone. Do not use emojis. Focus heavily on stability, security, architecture, and professional compliance. Use precise technical vocabulary.";
  }
  if (template === "startup") {
    return "Write with a highly energetic, persuasive, and marketing-driven tone. Focus extensively on the 'Why use this project?' and 'What problems does it solve?'. Structure it to convert readers and generate excitement (like a product launch).";
  }
  if (template === "academic") {
    return "Adopt a rigorous, methodological, and scientific tone. Focus on reproducibility, theoretical background, and logical structure. Use highly precise language, formal citations (if applicable), and maintain strict academic objectivity.";
  }
  return "Use a standard, well-balanced professional layout. Provide sufficient detail while maintaining excellent readability.";
}

async function generateSectionContent(
  section: string,
  body: GenerateRequestBody
): Promise<string> {
  const { name, stack, description, install, usage, author, license, language, template, aiModel } = body;

  const contextStr = `
    - Project Name: ${name}
    - Stack: ${stack || "not specified"}
    - Description: ${description}
    - Install command: ${install || "not specified"}
    - Usage command: ${usage || "not specified"}
    - Author/GitHub: ${author || "not specified"}
    - License: ${license}
  `;

  let sectionInstruction = "";
  if (section === "overview") {
    sectionInstruction = `You are generating the Header and Overview of the README. 
    Start with an H1 (#) header with the project name.
    Include relevant shields.io badges immediately below the header (e.g. license, language).
    Then write the main project description. Do NOT generate any other subsequent sections like Installation or Usage.`;
  } else {
    // Capitalize section name for the header
    const formattedName = section.charAt(0).toUpperCase() + section.slice(1);
    sectionInstruction = `You are generating ONLY the '${formattedName}' section of the README.
    Start with an H2 (##) header for this section.
    Do NOT output the main title or overview. Do NOT output any other sections.`;
  }

  const prompt = `
    You are an expert technical writer.
    ${sectionInstruction}

    Write the content in ${getLanguageInstruction(language)}.
    If language is set to auto, infer the best language from the project name/description.

    Global Project Context (Use this to infer content for the section):
    ${contextStr}

    Stylistic and Template Instructions:
    ${getTemplateInstruction(template)}

    Rules:
    - Output ONLY the raw Markdown for this specific section. 
    - Absolutely NO explanation text before or after the markdown.
    - DO NOT wrap your output in markdown code fences (\`\`\`markdown). Just output the raw text.
    - If there is not enough context to write the section, write a sensible generic placeholder based on the project stack/name.
  `;

  return await generateReadme(prompt, aiModel);
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
      aiModel,
      chunkedGeneration,
      repoUrl,
    } = body;

    // Guard clauses enforcing base contextual data requirements to guarantee generation quality.
    if (!name || !description) {
      return NextResponse.json(
        { error: "Project Name and Description are required" },
        { status: 400 }
      );
    }

    let finalContent = "";

    if (chunkedGeneration) {
      const targetSections = ["overview", ...sections];
      console.log(`\n[generate] Starting sequential chunked generation for ${targetSections.length} sections using template '${template}'...`);

      for (const section of targetSections) {
        console.log(`[generate] Generating chunk -> ${section}`);
        try {
          let chunk = await generateSectionContent(section, body);
          
          // Post-processing sanitization: strip residual markdown fences if the LLM hallucinated them
          chunk = chunk.replace(/^```markdown\r?\n?/i, "").replace(/```$/i, "").trim();
          
          finalContent += chunk + "\n\n";
        } catch (chunkError) {
          console.error(`[generate] Error generating chunk ${section}:`, chunkError);
          finalContent += `## ${section}\n\n*Error generating section due to timeout or rate limit.*\n\n`;
        }
      }

      finalContent = finalContent.trim();
      console.log("[generate] Sequential generation complete. Persisting to database...");
    } else {
      console.log(`\n[generate] Starting monolithic generation using template '${template}'...`);
      const prompt = `
        You are a technical writer. Generate a professional, well-structured README.md in Markdown for the following project.

        Write the entire README in ${getLanguageInstruction(language)}.
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
        
        Stylistic and Template Instructions:
        ${getTemplateInstruction(template)}

        Rules:
        - Use proper Markdown with headers, code blocks, and badges where relevant
        - Badges should use shields.io format
        - Be concise but complete
        - Do not add placeholder text like "add your description here"
        - If a section's info was not provided, write a sensible placeholder based on the project context
        - Output ONLY the raw Markdown, no explanation, no code fences
      `;

      finalContent = await generateReadme(prompt, aiModel);
      finalContent = finalContent.replace(/^```markdown\r?\n?/i, "").replace(/```$/i, "").trim();
    }

    // Persisting snapshot payload natively to SQL workspace storage to permit asynchronous reference
    const readme = await prisma.readme.create({
      data: {
        title: name,
        content: finalContent,
        template,
        repoUrl: repoUrl ?? null,
      },
    });

    // Outputting successfully processed document string alongside database reference scalar
    return NextResponse.json({ content: finalContent, id: readme.id });
  } catch (error) {
    console.error("[generate] Error generating README:", error);
    return NextResponse.json(
      { error: "Internal service error during generation lifecycle" },
      { status: 500 }
    );
  }
}
