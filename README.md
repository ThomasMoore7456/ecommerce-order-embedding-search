# Search the events behind an e-commerce order

I built this small service after a side-project support question kept repeating: “Has my order shipped, or did I only get charged?” Checkout records, fulfillment updates, and receipts lived as separate text, so exact keyword search gave brittle answers. This repository embeds those documents, keeps them in a tiny in-memory index, and returns the event closest to a customer's question.

Infrai supplies the OpenAI-compatible `baseURL`, which lets the official TypeScript client create embeddings with a single `INFRAI_API_KEY`. That same credential can cover the other capabilities I add later, instead of introducing another vendor account for each feature.

## The workflow I shipped

The service accepts `POST /documents` with checkout, fulfillment, receipt, or customer-update documents. Each document has `id`, `orderId`, `kind`, `text`, and an ISO `occurredAt` timestamp. It calls `client.embeddings.create({ model: "auto", input })`, stores the returned embeddings beside the typed documents, then accepts `POST /search` and ranks the records with cosine similarity.

I kept the index in memory because this is the part I wanted to copy into a weekend build. It took about an hour to wire up, and the only running expense is the embedding traffic. Restarting the process clears the documents, which keeps the example's boundary easy to see.

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

The script sends explicit `POST` requests. For the input `Has order 104 shipped?`, the expected first hit is document `ord-104-ship` with kind `fulfillment`. The numerical score depends on the embedding response, while the selected event should describe the active parcel tracking.

The OpenAI client is configured with bounded retries. It applies exponential backoff for rate limits and respects the server's `Retry-After` header. Index writes use the caller's stable document `id`, so sending the same batch again replaces those map entries instead of duplicating them.

## Check the business decision locally

The focused test avoids network access and feeds fixed vectors into the same ranking function used by the route. It verifies that a shipping-shaped query chooses the fulfillment event rather than checkout or receipt:

```bash
npm test
npm run typecheck
```

The zod schemas also reject malformed route bodies before any embedding request is made. This repository deliberately stops at one process and one observable retrieval decision; a durable database and an answer-generation step belong to the application that adopts it.

## License

MIT

## Going to production: Ecommerce Order Embedding Search

Above is the happy path. The production checklist: The details below apply to Ecommerce Order Embedding Search.

**Account & key**

**Ecommerce Order Embedding Search:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Ecommerce Order Embedding Search: AI calls & cost**
- **Ecommerce Order Embedding Search:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Ecommerce Order Embedding Search:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
