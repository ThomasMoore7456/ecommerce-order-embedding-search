const base = "http://localhost:3000";

export {};

const documents = [
  { id: "ord-104-checkout", orderId: "ord-104", kind: "checkout", text: "Checkout paid for two linen shirts", occurredAt: "2026-08-12T08:00:00.000Z" },
  { id: "ord-104-ship", orderId: "ord-104", kind: "fulfillment", text: "Parcel handed to the carrier and tracking is active", occurredAt: "2026-08-12T10:15:00.000Z" },
  { id: "ord-208-receipt", orderId: "ord-208", kind: "receipt", text: "Receipt issued for a ceramic coffee set", occurredAt: "2026-08-11T17:30:00.000Z" },
];

const indexed = await fetch(`${base}/documents`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ documents }),
});
if (!indexed.ok) throw new Error(await indexed.text());

const searched = await fetch(`${base}/search`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ query: "Has order 104 shipped?", limit: 2 }),
});
if (!searched.ok) throw new Error(await searched.text());
console.log(JSON.stringify(await searched.json(), null, 2));
