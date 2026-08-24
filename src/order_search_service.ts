import { createServer, type ServerResponse } from "node:http";
import { ZodError } from "zod";
import { createEmbeddingClient, embedTexts } from "./infrai_embeddings.js";
import {
  indexRequestSchema,
  searchRequestSchema,
  type IndexedOrderDocument,
} from "./order_documents.js";
import { rankOrderDocuments } from "./order_relevance.js";

const documents = new Map<string, IndexedOrderDocument>();
const client = createEmbeddingClient();

function reply(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request: AsyncIterable<Uint8Array>): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/documents") {
      const body = indexRequestSchema.parse(await readJson(request));
      const embeddings = await embedTexts(client, body.documents.map((document) => document.text));
      body.documents.forEach((document, index) => {
        const embedding = embeddings[index];
        if (!embedding) throw new Error("Embedding response did not cover every document.");
        documents.set(document.id, { ...document, embedding });
      });
      reply(response, 200, { indexed: body.documents.length });
      return;
    }

    if (request.method === "POST" && request.url === "/search") {
      const body = searchRequestSchema.parse(await readJson(request));
      const [queryEmbedding] = await embedTexts(client, [body.query]);
      if (!queryEmbedding) throw new Error("Embedding response did not include the query.");
      const hits = rankOrderDocuments([...documents.values()], queryEmbedding, body.limit);
      reply(response, 200, { query: body.query, hits });
      return;
    }

    reply(response, 404, { error: "Route not found" });
  } catch (error) {
    if (error instanceof ZodError) {
      reply(response, 400, { error: "Invalid request body", issues: error.issues });
      return;
    }
    const message = error instanceof Error ? error.message : "Unexpected request error";
    reply(response, 500, { error: message });
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Order search listening on http://localhost:${port}`));
