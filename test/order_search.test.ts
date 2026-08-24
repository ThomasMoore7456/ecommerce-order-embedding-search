import assert from "node:assert/strict";
import test from "node:test";
import { rankOrderDocuments } from "../src/order_relevance.js";

test("a shipping question selects the fulfillment update", () => {
  const hits = rankOrderDocuments([
    { id: "checkout", orderId: "ord-104", kind: "checkout", text: "Payment accepted", occurredAt: "2026-08-12T08:00:00.000Z", embedding: [1, 0] },
    { id: "shipped", orderId: "ord-104", kind: "fulfillment", text: "Parcel shipped", occurredAt: "2026-08-12T10:15:00.000Z", embedding: [0, 1] },
    { id: "receipt", orderId: "ord-208", kind: "receipt", text: "Receipt issued", occurredAt: "2026-08-11T17:30:00.000Z", embedding: [-1, 0] },
  ], [0, 1], 1);

  assert.equal(hits[0]?.id, "shipped");
  assert.equal(hits[0]?.kind, "fulfillment");
  assert.equal(hits[0]?.score, 1);
});
