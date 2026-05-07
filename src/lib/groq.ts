// O nome do arquivo ta como Gemini mas na verdade é o Groq, que é a IA que estamos usando para gerar o README
import Groq from "groq-sdk";

// Inicializa o cliente do Groq com a chave de API do .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// Função que recebe um prompt e retorna o texto gerado pela IA
// É async porque a chamada à API leva alguns segundos
export async function generateReadme(prompt: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b", // modelo rápido e gratuito do Groq
    messages: [
      { role: "system", content: "You are a helpful assistant." }, // so um contexto básico para a IA
      { role: "user", content: prompt },
    ],
    max_tokens: 6000, // limite de tokens para gerar um README completo
  });

  // Extrai o texto da resposta
  return response.choices[0]?.message?.content ?? "";
}
