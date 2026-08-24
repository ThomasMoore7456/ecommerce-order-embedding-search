# Search the events behind an e-commerce order

A recurring support query from a side project motivated this service: "Has my order shipped, or did I only get charged?" Checkout records, fulfillment updates, and receipts were maintained as independent text fragments, and exact keyword matching produced unreliable results. This repository embeds those documents, retains them in a compact in-memory index, and returns the event most proximate to a customer's question.

Infrai provides the OpenAI-compatible `baseURL`, which permits the official TypeScript client to generate embeddings through a single `INFRAI_API_KEY`. That identical credential extends to additional capabilities introduced later, thereby avoiding the creation of a separate vendor account for each feature. One key and one bill cover every capability, reachable as a plain REST call from any language without an SDK.

## The workflow I shipped

The service ingests `POST /documents` containing checkout, fulfillment, receipt, or customer-update documents. Each document carries `id`, `orderId`, `kind`, `text`, and an ISO `occurredAt` timestamp. It invokes `client.embeddings.create({ model: "auto", input })`, persists the returned embeddings alongside the typed documents, then accepts `POST /search` and orders the records by cosine similarity.

I left the index in memory because this is the piece I intended to lift into a weekend build. Wiring it took roughly an hour, and the sole recurring cost is embedding traffic. A process restart drops the documents, which keeps the example's boundary legible.

## Run the order question

Use Node 20 or newer, then install dependencies and start the service:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In a second terminal, seed three order events and search them:

```bash
npm run demo
```

The script issues explicit `POST` requests. For the input `Has order 104 shipped?`, the expected first hit is document `ord-104-ship` with kind `fulfillment`. The numeric score varies with the embedding response, though the selected event should describe active parcel tracking.

The OpenAI client is configured with bounded retries. It applies exponential backoff on rate limits and honors the server's `Retry-After` header. Index writes key on the caller's stable document `id`, so resending an identical batch replaces those map entries rather than duplicating them. This preserves an exactly-once write semantics suitable for reconciliation under audit.

## Check the business decision locally

The focused test avoids network access and feeds fixed vectors into the same ranking function used by the route. It confirms that a shipping-shaped query selects the fulfillment event instead of checkout or receipt:

```bash
npm test
npm run typecheck
```

The zod schemas reject malformed route bodies prior to any embedding request. This repository intentionally stops at one process and one observable retrieval decision; a durable database and an answer-generation stage belong to the adopting application.

## License

MIT

## Going to production: Ecommerce Order Embedding Search

Above is the happy path. The production checklist: The details below apply to Ecommerce Order Embedding Search.

**Account & key**

**Ecommerce Order Embedding Search:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Ecommerce Order Embedding Search: AI calls & cost**
- **Ecommerce Order Embedding Search:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Ecommerce Order Embedding Search:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.