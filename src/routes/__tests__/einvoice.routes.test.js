import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app } from "../../app.js";
import { db, initDatabase } from "../../db/database.js";

import jwt from "jsonwebtoken";

const JWT_SECRET = "test-secret-key-do-not-use-in-production";

function getAuthToken() {
  const user = db.users[0];

  assert.ok(user, "A seeded test user must exist");

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: user.type,
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
}

describe("Bug G: Duplicate e-invoice submissions", () => {
  beforeEach(() => {
    for (const key of Object.keys(db)) {
      if (Array.isArray(db[key])) {
        db[key].length = 0;
      }
    }

    initDatabase();
  });

  it("rejects a second submission for an already submitted invoice", async () => {
    const invoiceId = "invoice-bug-g-test";
    const payload = {
      invoice_id: invoiceId,
      customer_siret: "12345678901234",
    };

    const firstResponse = await request(app)
      .post("/api/einvoice/submit")
      .set("Authorization", `Bearer ${getAuthToken()}`)
      .send(payload);

    assert.equal(firstResponse.status, 200);

    const originalSubmissionId = firstResponse.body.data.submission_id;

    const secondResponse = await request(app)
      .post("/api/einvoice/submit")
      .set("Authorization", `Bearer ${getAuthToken()}`)
      .send(payload);

    assert.equal(secondResponse.status, 409);
    assert.equal(
      secondResponse.body.error,
      "Invoice already submitted to tax authority",
    );

    const invoice = db.invoices.find((item) => item.id === invoiceId);

    assert.equal(invoice.einvoice_submission_id, originalSubmissionId);
    assert.equal(invoice.einvoice_status, "submitted");
  });

  it("allows the initial submission of an invoice", async () => {
    const response = await request(app)
      .post("/api/einvoice/submit")
      .set("Authorization", `Bearer ${getAuthToken()}`)
      .send({
        invoice_id: "invoice-initial-submit-test",
        customer_siret: "12345678901234",
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, "submitted");
    assert.ok(response.body.data.submission_id);
  });

  it("rejects a resubmission when the invoice is already accepted", async () => {
    const invoiceId = "invoice-accepted-test";

    const firstResponse = await request(app)
      .post("/api/einvoice/submit")
      .set("Authorization", `Bearer ${getAuthToken()}`)
      .send({
        invoice_id: invoiceId,
        customer_siret: "12345678901234",
      });

    assert.equal(firstResponse.status, 200);

    const invoice = db.invoices.find((item) => item.id === invoiceId);
    invoice.einvoice_status = "accepted";

    const response = await request(app)
      .post("/api/einvoice/submit")
      .set("Authorization", `Bearer ${getAuthToken()}`)
      .send({
        invoice_id: invoiceId,
        customer_siret: "12345678901234",
      });

    assert.equal(response.status, 409);
  });

  it("rejects an invalid SIRET before submission", async () => {
    const response = await request(app)
      .post("/api/einvoice/submit")
      .set("Authorization", `Bearer ${getAuthToken()}`)
      .send({
        invoice_id: "invoice-invalid-siret-test",
        customer_siret: "12345",
      });

    assert.equal(response.status, 400);
  });
});
