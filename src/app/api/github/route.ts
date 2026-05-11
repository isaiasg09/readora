import { generateReadme } from "@/lib/groq";
import { Octokit } from "@octokit/rest";
import { NextRequest, NextResponse } from "next/server";

// Inicializa o cliente do GitHub
// Sem token funciona para repositórios públicos (limite de 60 req/hora)
const octokit = new Octokit();

// Arquivos que vamos tentar ler do repositório para dar contexto à IA
// A ordem importa — os mais relevantes primeiro
const RELEVANT_FILES = [
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "README.md",
];

type RepoFile = {
  file: string;
  content: string;
};

type RepositoryAnalysis = {
  description: string;
  install: string;
  usage: string;
};

// Extrai o dono e o nome do repositório a partir da URL do GitHub
// Ex: "https://github.com/joao/meu-projeto" → { owner: "joao", repo: "meu-projeto" }
function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length < 2) return null;

    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

// Tenta buscar o conteúdo de um arquivo no repositório
// Retorna null se o arquivo não existir
async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  try {
    const response = await octokit.repos.getContent({ owner, repo, path });

    // A API do GitHub retorna o conteúdo em base64
    if (
      "content" in response.data &&
      typeof response.data.content === "string" // Garantia de que content é uma string (pode ser um array se for um diretório, mas nesse caso não esperamos isso)
    ) {
      // console.log(`[github] Arquivo "${path}" encontrado em ${owner}/${repo}`);
      return Buffer.from(response.data.content, "base64").toString("utf-8");
    }

    return null;
  } catch {
    // Arquivo não encontrado — ignora e segue para o próximo
    // console.log(
    //   `[github] Arquivo "${path}" não encontrado em ${owner}/${repo}`
    // );
    return null;
  }
}

function truncateContent(content: string, limit = 3000): string {
  // Evita enviar arquivos gigantes para o modelo quando não é necessário.
  return content.length <= limit ? content : `${content.slice(0, limit)}\n...`;
}

function extractFromPackageJson(content: string): {
  install: string;
  usage: string;
  stack: string;
  descriptionHint: string;
} {
  try {
    // O package.json é a melhor pista para descobrir stack, scripts e comando de instalação.
    const packageJson = JSON.parse(content) as {
      packageManager?: string;
      scripts?: Record<string, string>;
      description?: string;
      name?: string;
    };

    const packageManager = packageJson.packageManager?.toLowerCase() ?? "";
    const install = packageManager.startsWith("pnpm")
      ? "pnpm install"
      : packageManager.startsWith("yarn")
        ? "yarn install"
        : packageManager.startsWith("bun")
          ? "bun install"
          : "npm install";

    const scripts = packageJson.scripts ?? {};
    // Escolhe o script mais provável para execução local, priorizando desenvolvimento.
    const usage = scripts.dev
      ? `${install.startsWith("npm") ? "npm" : install.split(" ")[0]} run dev`
      : scripts.start
        ? `${install.startsWith("npm") ? "npm" : install.split(" ")[0]} start`
        : scripts.serve
          ? `${install.startsWith("npm") ? "npm" : install.split(" ")[0]} run serve`
          : scripts.build
            ? `${install.startsWith("npm") ? "npm" : install.split(" ")[0]} run build`
            : "";

    const stackParts = [packageJson.name, packageJson.description]
      .filter(Boolean)
      .join(" - ");

    return {
      install,
      usage,
      stack: packageManager || "JavaScript/TypeScript",
      descriptionHint: packageJson.description ?? stackParts,
    };
  } catch {
    return {
      install: "npm install",
      usage: "npm run dev",
      stack: "JavaScript/TypeScript",
      descriptionHint: "",
    };
  }
}

function extractReadmeHint(content: string): {
  descriptionHint: string;
  install: string;
  usage: string;
} {
  // Faz uma leitura leve do README para reaproveitar trechos que normalmente já
  // apontam instalação, uso e uma descrição melhor do projeto.
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const cleaned = lines.filter((line) => line && !/^!\[.*\]\(.*\)$/.test(line));

  const firstParagraph = cleaned.find(
    (line) =>
      !line.startsWith("#") &&
      !line.startsWith("```") &&
      !line.startsWith("[") &&
      !line.startsWith("<")
  );

  const installSectionIndex = cleaned.findIndex((line) =>
    /^#{1,6}\s*install/i.test(line)
  );
  const usageSectionIndex = cleaned.findIndex((line) =>
    /^#{1,6}\s*(usage|how to use|run)/i.test(line)
  );

  const maybeCodeBlockAt = (startIndex: number): string => {
    if (startIndex < 0) return "";

    for (let index = startIndex + 1; index < cleaned.length; index += 1) {
      if (cleaned[index].startsWith("```")) {
        const command = cleaned[index + 1]?.trim() ?? "";
        return command;
      }

      if (cleaned[index].startsWith("#")) {
        break;
      }
    }

    return "";
  };

  return {
    descriptionHint: firstParagraph ?? "",
    install: maybeCodeBlockAt(installSectionIndex),
    usage: maybeCodeBlockAt(usageSectionIndex),
  };
}

function buildFallbackAnalysis(
  repoName: string,
  repoDescription: string,
  packageHints: ReturnType<typeof extractFromPackageJson>,
  readmeHints: ReturnType<typeof extractReadmeHint>
): RepositoryAnalysis {
  // Se a IA não responder com JSON válido, usamos um fallback determinístico.
  const description =
    readmeHints.descriptionHint ||
    packageHints.descriptionHint ||
    repoDescription ||
    repoName;

  return {
    description,
    install: readmeHints.install || packageHints.install,
    usage: readmeHints.usage || packageHints.usage,
  };
}

function parseAnalysisResponse(content: string): RepositoryAnalysis | null {
  try {
    const normalized = content
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "");

    const parsed = JSON.parse(normalized) as Partial<RepositoryAnalysis>;

    if (!parsed.description || !parsed.install || !parsed.usage) {
      return null;
    }

    return {
      description: parsed.description,
      install: parsed.install,
      usage: parsed.usage,
    };
  } catch {
    return null;
  }
}

async function analyzeRepository(
  repoName: string,
  repoDescription: string,
  files: RepoFile[]
): Promise<RepositoryAnalysis> {
  // A ideia dessa etapa é usar os arquivos lidos como contexto estruturado
  // antes de chamar a IA principal da geração do README.
  const packageJson = files.find(
    (file) => file.file === "package.json"
  )?.content;
  const readme = files.find((file) => file.file === "README.md")?.content;

  const packageHints = packageJson
    ? extractFromPackageJson(packageJson)
    : {
        install: "npm install",
        usage: "npm run dev",
        stack: "JavaScript/TypeScript",
        descriptionHint: "",
      };

  const readmeHints = readme
    ? extractReadmeHint(readme)
    : { descriptionHint: "", install: "", usage: "" };
  const fallback = buildFallbackAnalysis(
    repoName,
    repoDescription,
    packageHints,
    readmeHints
  );

  const analysisPrompt = `
You are analyzing a GitHub repository for a README generator.

Return ONLY valid JSON with the exact shape:
{
  "description": "string",
  "install": "string",
  "usage": "string"
}

Rules:
- Use the repository README and package.json to infer the best values.
- Prefer commands mentioned in the files.
- If install or usage are explicit in README, use them.
- If not explicit, infer the most likely command from scripts/package manager.
- Description should be a concise but useful summary based on the repository files, not just the GitHub description.
- Do not wrap the response in markdown fences.

This prompt exists only to normalize the repository files into structured data.
The final README generation uses a separate prompt later in the flow.

Repository name: ${repoName}
Repository description: ${repoDescription || "not provided"}

package.json:
${packageJson ? truncateContent(packageJson) : "not found"}

README.md:
${readme ? truncateContent(readme) : "not found"}
`.trim();

  try {
    // A IA funciona como refinamento: ela organiza o que já foi lido dos arquivos.
    const analysisText = await generateReadme(analysisPrompt);
    const parsed = parseAnalysisResponse(analysisText);

    if (!parsed) {
      // Se a IA responder algo fora do formato esperado, caímos no fallback sem interromper o fluxo.
      return fallback;
    }

    return {
      description: parsed.description || fallback.description,
      install: parsed.install || fallback.install,
      usage: parsed.usage || fallback.usage,
    };
  } catch {
    return fallback;
  }
}

// Rota POST para receber a URL do repositório, buscar os dados e arquivos relevantes, e retornar um contexto para o frontend
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL não informada" }, { status: 400 });
    }

    // Extrai owner e repo da URL para transformar a URL pública em parâmetros de API.
    const parsed = parseGithubUrl(url);

    if (!parsed) {
      return NextResponse.json(
        { error: "URL do GitHub inválida" },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Busca informações gerais do repositório (descrição, linguagem, licença etc.).
    // Esses metadados ajudam a completar o formulário antes mesmo de analisar os arquivos.
    const { data: repoData } = await octokit.repos.get({ owner, repo });

    // Tenta ler cada arquivo relevante em paralelo para ser mais rápido.
    // Aqui buscamos sinais práticos de uso do projeto, não apenas metadados do GitHub.
    const fileContents = await Promise.all(
      RELEVANT_FILES.map(async (file) => {
        const content = await fetchFileContent(owner, repo, file);
        return content ? { file, content } : null;
      })
    );

    // Remove os arquivos que não foram encontrados
    const foundFiles = fileContents.filter(Boolean) as RepoFile[];

    // Usa os arquivos mais importantes para inferir instalação, uso e uma descrição melhor.
    // Esse contexto é o que alimenta o pré-preenchimento do formulário.
    const analysis = await analyzeRepository(
      repoData.name,
      repoData.description ?? "",
      foundFiles
    );

    // Monta um resumo do repositório para enviar de volta ao frontend.
    // O frontend usa isso para preencher campos e deixar a geração menos manual.
    const context = {
      name: repoData.name,
      description: analysis.description,
      install: analysis.install,
      usage: analysis.usage,
      language: repoData.language ?? "",
      license: repoData.license?.spdx_id ?? "MIT",
      stars: repoData.stargazers_count,
      files: foundFiles,
      author: {
        name: repoData.owner.login,
        avatar: repoData.owner.avatar_url,
        url: repoData.owner.html_url,
      },
    };

    return NextResponse.json(context);
  } catch (error) {
    console.error("[github] Erro ao buscar repositório:", error);
    return NextResponse.json(
      {
        error:
          "Erro ao buscar repositório. Verifique se o repositório é público.",
      },
      { status: 500 }
    );
  }
}
