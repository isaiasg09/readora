import { generateReadme } from "@/lib/groq";
import { Octokit } from "@octokit/rest";
import { NextRequest, NextResponse } from "next/server";

// Feature flag to globally toggle verbose ingestion logs and LLM trace outputs.
const DEBUG = false;

// Instantiating dynamic Octokit client factories to perfectly inject runtime credentials.
// Bypasses static caching issues across dev hot reloads while forcing native Next.js custom fetch adapters.
function getOctokit() {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
    request: {
      fetch: (url: RequestInfo | URL, opts?: RequestInit) => {
        return fetch(url, { ...opts, cache: "no-store" });
      },
    },
  });
}

// Priority array defining candidate package/manifest configurations to seed contextual heuristics.
// Ordered sequentially by parsing confidence to optimize document extraction logic.
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

// Extracts owner namespace and repository identifier parameters from raw input URIs.
// Example: "https://github.com/facebook/react" -> { owner: "facebook", repo: "react" }
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

// Asynchronously accesses remote Git object trees to extract specified path blobs.
// Gracefully resolves to null upon encountering HTTP 404 boundaries to support sparse tree traversal.
async function fetchFileContent(
  client: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  try {
    const response = await client.repos.getContent({ owner, repo, path });

    // GitHub REST layer payloads encode non-directory target contents using standard Base64 payloads.
    if (
      "content" in response.data &&
      typeof response.data.content === "string"
    ) {
      return Buffer.from(response.data.content, "base64").toString("utf-8");
    }

    return null;
  } catch {
    // Suppress discrete missing artifact events to proceed evaluating downstream fallback candidates.
    return null;
  }
}

function truncateContent(content: string, limit = 3000): string {
  // Enforcing sliding window substring boundaries to respect context window token limitations.
  return content.length <= limit ? content : `${content.slice(0, limit)}\n...`;
}

function extractFromPackageJson(content: string): {
  install: string;
  usage: string;
  stack: string;
  descriptionHint: string;
} {
  try {
    // Parsing native NPM/Node manifest schemas to deterministically resolve execution scripts and dependencies.
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
    // Prioritizing primary local development loops to populate workspace execution steps.
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

function extractFromPython(
  pyproject: string | undefined,
  requirements: string | undefined
): {
  install: string;
  usage: string;
  stack: string;
  descriptionHint: string;
} {
  let install = "pip install -r requirements.txt";
  let usage = "python main.py";
  let descriptionHint = "";

  if (pyproject) {
    if (pyproject.includes("[tool.poetry]")) {
      install = "poetry install";
      usage = "poetry run python main.py";
    } else if (pyproject.includes("[project]")) {
      install = "pip install .";
    }
    // Attempt basic parsing of description/name if present
    const descMatch = pyproject.match(/description\s*=\s*["']([^"']+)["']/i);
    if (descMatch && descMatch[1]) {
      descriptionHint = descMatch[1];
    }
  } else if (requirements) {
    install = "pip install -r requirements.txt";
  }

  return {
    install,
    usage,
    stack: "Python",
    descriptionHint,
  };
}

function extractFromRust(content: string): {
  install: string;
  usage: string;
  stack: string;
  descriptionHint: string;
} {
  let descriptionHint = "";
  const descMatch = content.match(/description\s*=\s*["']([^"']+)["']/i);
  if (descMatch && descMatch[1]) {
    descriptionHint = descMatch[1];
  }

  return {
    install: "cargo build",
    usage: "cargo run",
    stack: "Rust",
    descriptionHint,
  };
}

function extractFromGo(content: string): {
  install: string;
  usage: string;
  stack: string;
  descriptionHint: string;
} {
  let descriptionHint = "";
  const modMatch = content.match(/module\s+([^\s]+)/i);
  if (modMatch && modMatch[1]) {
    descriptionHint = `Go module: ${modMatch[1]}`;
  }

  return {
    install: "go mod download",
    usage: "go run .",
    stack: "Go",
    descriptionHint,
  };
}

function extractFromPhp(content: string): {
  install: string;
  usage: string;
  stack: string;
  descriptionHint: string;
} {
  let descriptionHint = "";
  try {
    const parsed = JSON.parse(content) as { description?: string };
    if (parsed.description) {
      descriptionHint = parsed.description;
    }
  } catch {
    // Ignore JSON parse errors for heuristic extraction
  }

  return {
    install: "composer install",
    usage: "php -S localhost:8000",
    stack: "PHP",
    descriptionHint,
  };
}

function extractReadmeHint(content: string): {
  descriptionHint: string;
  install: string;
  usage: string;
} {
  // Lightweight native string scanner scanning existing Markdown block elements to harvest initial sections.
  // Serves as an immediate zero-latency extraction pass bypassing remote compute logic.
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
  stackHints: {
    install: string;
    usage: string;
    stack: string;
    descriptionHint: string;
  },
  readmeHints: ReturnType<typeof extractReadmeHint>
): RepositoryAnalysis {
  // Composing structural fallback objects if remote LLM parsing yields malformed scalar responses.
  const description =
    readmeHints.descriptionHint ||
    stackHints.descriptionHint ||
    repoDescription ||
    repoName;

  return {
    description,
    install: readmeHints.install || stackHints.install,
    usage: readmeHints.usage || stackHints.usage,
  };
}

function parseAnalysisResponse(content: string): RepositoryAnalysis | null {
  try {
    // Locating raw JSON boundaries dynamically via bounding brace lookup indices.
    // Guarantees reliable payload resolution even if models prepend polite conversational strings.
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      return null;
    }

    const jsonSubstring = content.slice(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonSubstring) as Partial<RepositoryAnalysis>;

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
  // Cross-referencing fetched manifests to assemble highly coherent input directives
  // prior to issuing requests to the core secondary document generation AI model.
  const packageJson = files.find((f) => f.file === "package.json")?.content;
  const pyproject = files.find((f) => f.file === "pyproject.toml")?.content;
  const requirements = files.find(
    (f) => f.file === "requirements.txt"
  )?.content;
  const cargoToml = files.find((f) => f.file === "Cargo.toml")?.content;
  const goMod = files.find((f) => f.file === "go.mod")?.content;
  const composerJson = files.find((f) => f.file === "composer.json")?.content;
  const readme = files.find((f) => f.file === "README.md")?.content;

  let stackHints = {
    install: "npm install",
    usage: "npm run dev",
    stack: "JavaScript/TypeScript",
    descriptionHint: "",
  };

  let activeManifestName = "package.json";
  let activeManifestContent = packageJson;

  if (packageJson) {
    stackHints = extractFromPackageJson(packageJson);
    activeManifestName = "package.json";
    activeManifestContent = packageJson;
  } else if (pyproject || requirements) {
    stackHints = extractFromPython(pyproject, requirements);
    activeManifestName = pyproject ? "pyproject.toml" : "requirements.txt";
    activeManifestContent = pyproject || requirements;
  } else if (cargoToml) {
    stackHints = extractFromRust(cargoToml);
    activeManifestName = "Cargo.toml";
    activeManifestContent = cargoToml;
  } else if (goMod) {
    stackHints = extractFromGo(goMod);
    activeManifestName = "go.mod";
    activeManifestContent = goMod;
  } else if (composerJson) {
    stackHints = extractFromPhp(composerJson);
    activeManifestName = "composer.json";
    activeManifestContent = composerJson;
  }

  const readmeHints = readme
    ? extractReadmeHint(readme)
    : { descriptionHint: "", install: "", usage: "" };

  const fallback = buildFallbackAnalysis(
    repoName,
    repoDescription,
    stackHints,
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
- Use the repository README and primary project manifest (${activeManifestName}) to infer the best values.
- Prefer commands mentioned in the files.
- If install or usage are explicit in README, use them.
- If not explicit, infer the most likely command from scripts/package manager standard conventions.
- Description should be a concise but useful summary based on the repository files, not just the GitHub description.
- Do not wrap the response in markdown fences.

This prompt exists only to normalize the repository files into structured data.
The final README generation uses a separate prompt later in the flow.

Repository name: ${repoName}
Repository description: ${repoDescription || "not provided"}

${activeManifestName}:
${activeManifestContent ? truncateContent(activeManifestContent) : "not found"}

README.md:
${readme ? truncateContent(readme) : "not found"}
`.trim();

  try {
    if (files.length === 0) {
      if (DEBUG) console.log("[github] Bypassing AI generation: No files available in offline/fallback state.");
      return fallback;
    }

    if (DEBUG) {
      console.log("\n=================== [AI PRE-ANALYSIS PROMPT] ===================");
      console.log(analysisPrompt);
      console.log("===============================================================\n");
    }

    // Issuing synchronous analytical pre-processing context inferences to structure disparate file states.
    const analysisText = await generateReadme(analysisPrompt);

    if (DEBUG) {
      console.log("\n=================== [AI RAW OUTPUT] ===================");
      console.log(analysisText);
      console.log("=======================================================\n");
    }

    const parsed = parseAnalysisResponse(analysisText);

    if (DEBUG) {
      console.log("\n=================== [AI PARSED JSON RESULT] ===================");
      console.log(JSON.stringify(parsed, null, 2));
      console.log("===============================================================\n");
    }

    if (!parsed) {
      // Revert instantly to native static deterministic fallbacks to preserve client pipeline execution.
      return fallback;
    }

    return {
      description: parsed.description || fallback.description,
      install: parsed.install || fallback.install,
      usage: parsed.usage || fallback.usage,
    };
  } catch (aiError) {
    console.error("[github] AI Pre-analysis exception encountered:", aiError);
    return fallback;
  }
}

// Ingestion controller bootstrapping repository analysis workflows from client provided target vectors.
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "Missing Target URL" },
        { status: 400 }
      );
    }

    // Resolving raw web links into discrete Octokit API identification tuples.
    const parsed = parseGithubUrl(url);

    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub Repository Link" },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Dynamically instantiate authenticated Octokit client per request execution trace.
    const client = getOctokit();

    let isOfflineFallback = false;

    try {
      // Diagnostic check validating authenticated context access and API connectivity metrics.
      const authTarget = await client.rest.users.getAuthenticated();
      if (DEBUG) {
        console.log("[github] Authenticated successfully as:", authTarget.data.login);
        const limits = await client.rest.rateLimit.get();
        console.log("[github] Remaining Core Requests:", limits.data.resources.core.remaining);
      }
    } catch (authError) {
      if (DEBUG) {
        console.warn("[github] Early authentication connectivity test timed out. Forcing offline fallback mode instantly to bypass redundant connection blocks.");
      }
      isOfflineFallback = true;
    }

    let repoName = repo;
    let repoDescription = "";
    let language = "";
    let licenseId = "MIT";
    let stars = 0;
    let authorName = owner;
    let authorAvatar = "";
    let authorUrl = `https://github.com/${owner}`;

    let foundFiles: RepoFile[] = [];

    // If online connectivity is verified, query main repository payload attributes.
    // If unreachable, bypass secondary round-trip delays immediately to preserve client UI continuity.
    if (!isOfflineFallback) {
      try {
        const { data: repoData } = await client.repos.get({ owner, repo });
        repoName = repoData.name;
        repoDescription = repoData.description ?? "";
        language = repoData.language ?? "";
        licenseId = repoData.license?.spdx_id ?? "MIT";
        stars = repoData.stargazers_count ?? 0;
        authorName = repoData.owner.login;
        authorAvatar = repoData.owner.avatar_url;
        authorUrl = repoData.owner.html_url;
      } catch (repoError) {
        if (DEBUG) {
          console.warn(
            "[github] Secondary repository query failed, reverting to offline wrapper parameters:",
            repoError
          );
        }
        isOfflineFallback = true;
      }

      if (!isOfflineFallback) {
        const fileContents = await Promise.all(
          RELEVANT_FILES.map(async (file) => {
            const content = await fetchFileContent(client, owner, repo, file);
            return content ? { file, content } : null;
          })
        );
        foundFiles = fileContents.filter(Boolean) as RepoFile[];
      }
    }

    // Executing heuristic synthesis loop to output highly coherent project instructions.
    const analysis = await analyzeRepository(
      repoName,
      repoDescription,
      foundFiles
    );

    // Yielding aggregated structured metadata maps downstream to pre-populate reactive form views.
    const context = {
      name: repoName,
      description: analysis.description,
      install: analysis.install,
      usage: analysis.usage,
      language,
      license: licenseId,
      stars,
      files: foundFiles,
      author: {
        name: authorName,
        avatar: authorAvatar,
        url: authorUrl,
      },
    };

    return NextResponse.json(context);
  } catch (error) {
    console.error("[github] Error fetching remote repository context:", error);
    return NextResponse.json(
      {
        error:
          "Error retrieving repository context. Please verify that the repository is public.",
      },
      { status: 500 }
    );
  }
}
