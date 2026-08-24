import type { IndexedOrderDocument, SearchHit } from "./order_documents.js";

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) return 0;

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftMagnitude += a * a;
    rightMagnitude += b * b;
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : dot / denominator;
}

export function rankOrderDocuments(
  documents: IndexedOrderDocument[],
  queryEmbedding: number[],
  limit: number,
): SearchHit[] {
  return documents
    .map(({ embedding, ...document }) => ({
      ...document,
      score: cosineSimilarity(embedding, queryEmbedding),
    }))
    .sort((a, b) => b.score - a.score || b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
}
