// O nome antigo do arquivo pode confundir, então deixamos explícito aqui:
// esta camada é a integração com o Groq usada pelo projeto para gerar texto.
import Groq from "groq-sdk";

// Inicializa o cliente do Groq com a chave de API do .env.
// Se a variável estiver ausente, a chamada vai falhar cedo ao tentar gerar conteúdo.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// Função central de geração de texto do projeto.
// Ela é reutilizada tanto para gerar o README final quanto para analisar o repositório.
export async function generateReadme(prompt: string): Promise<string> {
  const response = await groq.chat.completions.create({
    // Mantemos um modelo com boa relação entre qualidade e custo para gerar README completos.
    model: "openai/gpt-oss-120b",
    messages: [
      // O system prompt é curto de propósito: o comportamento real vem do prompt enviado pela rota.
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
    // Limite alto para caber um README completo sem truncar seções importantes.
    max_tokens: 6000,
  });

  // Extrai o texto da resposta; se a API não devolver conteúdo, retornamos string vazia.
  return response.choices[0]?.message?.content ?? "";
}
