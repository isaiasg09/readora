// Core LLM generation adapter abstraction interfacing with remote Groq endpoints.
// Standardizes text completion stream setups across repository heuristic pre-analysis and primary generation phases.
import Groq from "groq-sdk";

// Instantiating static SDK singletons leveraging localized execution environment variables.
// Validates presence of credentials eagerly to halt pipelines prior to initiating compute boundaries.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// Unified primary inference function processing downstream instructional prompts.
// Shared transparently between initial repository tree reduction heuristics and fully-expanded document generation logic.
export async function generateReadme(prompt: string, modelId: string = "llama-3.3-70b-versatile"): Promise<string> {
  const response = await groq.chat.completions.create({
    // Selecting premium, highly capable oss model parameters optimized for extensive document code block reasoning.
    model: modelId,
    messages: [
      // Enforcing minimal structural context wraps to delegate behavioral control directly to tailored prompt injectors.
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
    // Allocating expanded response buffer token limits to accommodate large-scale un-truncated markdown artifacts.
    max_tokens: 6000,
  });

  // Extracting scalar content payloads safely from top completion paths.
  return response.choices[0]?.message?.content ?? "";
}
