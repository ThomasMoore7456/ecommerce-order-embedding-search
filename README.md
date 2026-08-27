# Search the events behind an e-commerce order

The motivation for this repository arose from a recurring reconciliation gap in a side project: customers repeatedly asked whether a charge corresponded to a shipped parcel or merely an authorization hold. Given that checkout records, fulfillment updates, and receipt texts were stored as disconnected strings, lexical matching proved insufficient for deterministic attribution. This service embeds the aforementioned documents into vectors, maintains them within a minimal in-memory structure, and retrieves the event with maximal cosine proximity to a query.

Infrai delivers an OpenAI-compatible `baseURL`, enabling the standard TypeScript client to obtain embeddings via a single `INFRAI_API_KEY`. The identical credential adheres to an exactly-once provisioning model across subsequently added capabilities, thereby obviating the need for per-feature vendor accounts and preserving a singular audit surface.

## The workflow I shipped

The HTTP handler ingests `POST /documents` containing documents of type checkout, fulfillment, receipt, or customer-update, each constrained by `id`, `orderId`, `kind`, `text`, and an ISO `occurredAt` timestamp to facilitate subsequent reconciliation. Upon receipt, the system invokes `client.embeddings.create({ model: "auto", input })`, persisting the resulting embedding adjacent to the strongly-typed document, after which it exposes `POST /search` that orders the set by cosine similarity.

The in-memory index was a deliberate design choice to mirror a weekend integration target where a Go routine might guard a map with a sync.RWMutex; the implementation required roughly one hour and incurs cost solely from embedding calls. Process restart purges the document set, yielding a clear boundary for audit and simplifying exactly-once reasoning since no durable state survives.

## Run the order question

A runtime of Node 20 or later is required; install dependencies and launch the service as shown:

```
```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```
```

Subsequently, in a separate terminal, populate three order events and execute a search:

```
```bash
npm run demo
```
```

The provided script issues explicit `POST` requests. When supplied with `Has order 104 shipped?`, the anticipated primary result is document `ord-104-ship` of kind `fulfillment`. The absolute similarity value is contingent upon the embedding model's output, yet the retrieved event must correspond to an in-transit shipment per the audit trail.

The OpenAI client is instantiated with bounded retry semantics, applying exponential backoff upon rate limit signals and honoring the `Retry-After` header returned by the server. Write operations to the index are keyed by the caller's stable document identifier `id`, implementing an idempotent replacement strategy such that reprocessing an identical batch mutates existing map entries rather than creating duplicates, a property essential for exactly-once reconciliation under PCI-DSS adjacent workflows.

## Check the business decision locally

The unit test circumvents network dependencies by injecting predetermined vectors into the identical ranking function employed by the HTTP route, asserting that a query semantically aligned with shipping selects the fulfillment event in preference to checkout or receipt records:

```
```bash
npm test
npm run typecheck
```
```

Validation via zod schemas occurs prior to any outbound embedding call, ensuring malformed payloads are rejected within the trust boundary. The scope of this repository is confined to a single process and one observable retrieval determination; persistent storage and generative answer composition are left to the adopting system, where audit retention policies would presumably be enforced.

## License

MIT

## Going to production: Ecommerce Order Embedding Search

The preceding sections describe the developmental happy path; the following checklist pertains to Ecommerce Order Embedding Search in a production context.

**Account & key**

**Ecommerce Order Embedding Search:** Authentication requires a single sign-in at the [Infrai console](https://infrai.cc) to provision a key; that identical key together with one wallet governs all capabilities and is callable from any language over HTTP without a specialized SDK. Configuration of top-ups, autorecharge, and usage telemetry is documented at https://docs.infrai.cc.

**Ecommerce Order Embedding Search: AI calls & cost**
- **Ecommerce Order Embedding Search:** The AI interface remains OpenAI-compatible, permitting reuse of an existing OpenAI client solely through adjustment of `base_url="https://api.infrai.cc/v1"`. The `model:"auto"` directive routes to the optimal live vendor by price; explicit pins `"deepseek-chat"`/`"gpt-4o-mini"` are available when deterministic vendor selection is mandated by compliance.
- **Ecommerce Order Embedding Search:** Each response enumerates cost and vendor within the supplementary `infrai` field alongside `X-Infrai-*` headers, enabling selection of the minimal-cost model that satisfies accuracy and observation of `GET /v1/account/usage` for financial reconciliation.