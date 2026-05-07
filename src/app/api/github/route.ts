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

// Rota POST para receber a URL do repositório, buscar os dados e arquivos relevantes, e retornar um contexto para o frontend
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL não informada" }, { status: 400 });
    }

    // Extrai owner e repo da URL
    const parsed = parseGithubUrl(url);

    if (!parsed) {
      return NextResponse.json(
        { error: "URL do GitHub inválida" },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Busca informações gerais do repositório (descrição, linguagem, licença etc.)
    const { data: repoData } = await octokit.repos.get({ owner, repo });

    // Tenta ler cada arquivo relevante em paralelo para ser mais rápido
    const fileContents = await Promise.all(
      RELEVANT_FILES.map(async (file) => {
        const content = await fetchFileContent(owner, repo, file);
        return content ? { file, content } : null;
      })
    );

    // Remove os arquivos que não foram encontrados
    const foundFiles = fileContents.filter(Boolean);

    // Monta um resumo do repositório para enviar de volta ao frontend
    // Esse contexto será usado para pré-preencher o formulário
    const context = {
      name: repoData.name,
      description: repoData.description ?? "",
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
