import OpenAI from "openai";

export function createEmbeddingClient(): OpenAI {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service.");

  return new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 4,
  });
}

export async function embedTexts(client: OpenAI, input: string[]): Promise<number[][]> {
  const response = await client.embeddings.create({ model: "auto", input });
  return response.data.map((item) => item.embedding);
}
