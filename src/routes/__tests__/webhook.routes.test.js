import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import request from "supertest";

import { app } from "../../app.js";
import { db, initDatabase } from "../../db/database.js";

const WEBHOOK_SECRET = "test-webhook-secret-key";
const WEBHOOK_URL = "/api/webhooks/payment-status";

function signWebhook(payload) {
  return crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
}

function sendWebhook(payload) {
  return request(app)
    .post(WEBHOOK_URL)
    .set("x-webhook-signature", signWebhook(payload))
    .send(payload);
}

describe("Bug E: Payment webhook idempotency", () => {
  beforeEach(() => {
    // Reset database state before each test.
    for (const key of Object.keys(db)) {
      if (Array.isArray(db[key])) {
        db[key].length = 0;
      }
    }

    initDatabase();
  });

  it("processes the first delivery of an event", async () => {
    const payment = db.payments[0];

    const payload = {
      payment_id: payment.id,
      status: "processing",
      event_id: "evt_first_delivery",
    };

    const response = await sendWebhook(payload);

    assert.equal(response.status, 200);
    assert.equal(payment.status, "processing");
    assert.ok(db.processed_webhooks.includes(payload.event_id));
  });

  it("does not process the same event twice", async () => {
    const payment = db.payments[0];

    const payload = {
      payment_id: payment.id,
      status: "processing",
      event_id: "evt_duplicate_delivery",
    };

    const firstResponse = await sendWebhook(payload);
    assert.equal(firstResponse.status, 200);

    const processedAt = payment.webhook_received_at;

    const secondResponse = await sendWebhook(payload);

    assert.equal(secondResponse.status, 200);
    assert.equal(secondResponse.body.message, "Webhook already processed");
    assert.equal(
      db.processed_webhooks.filter((eventId) => eventId === payload.event_id)
        .length,
      1,
    );
    assert.equal(payment.webhook_received_at, processedAt);
  });

  it("does not change payment status when a duplicate event has a different status", async () => {
    const payment = db.payments[0];

    const firstPayload = {
      payment_id: payment.id,
      status: "processing",
      event_id: "evt_status_unchanged",
    };

    const firstResponse = await sendWebhook(firstPayload);
    assert.equal(firstResponse.status, 200);
    assert.equal(payment.status, "processing");

    const duplicatePayload = {
      ...firstPayload,
      status: "failed",
    };

    const duplicateResponse = await sendWebhook(duplicatePayload);

    assert.equal(duplicateResponse.status, 200);
    assert.equal(payment.status, "processing");
  });

  it("rejects a request without an event ID", async () => {
    const payment = db.payments[0];

    const payload = {
      payment_id: payment.id,
      status: "processing",
    };

    const response = await sendWebhook(payload);

    assert.equal(response.status, 400);
    assert.notEqual(payment.status, "processing");
  });

  it("does not modify payment when the signature is invalid", async () => {
    const payment = db.payments[0];
    const originalStatus = payment.status;

    const payload = {
      payment_id: payment.id,
      status: "processing",
      event_id: "evt_invalid_signature",
    };

    const response = await request(app)
      .post(WEBHOOK_URL)
      .set("x-webhook-signature", "invalid-signature")
      .send(payload);

    assert.equal(response.status, 401);
    assert.equal(payment.status, originalStatus);
    assert.equal(db.processed_webhooks.includes(payload.event_id), false);
  });
});
