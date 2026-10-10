import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { db, initDatabase } from "../db/database.js";

const JWT_SECRET = "test-secret-key-do-not-use-in-production";

let token;

before(async () => {
  // Reset the in-memory database before the tests.
  db.users.length = 0;
  db.payments.length = 0;
  db.sessions.length = 0;
  db.table_orders.length = 0;
  db.invoices.length = 0;
  db.processed_webhooks.length = 0;

  initDatabase();

  // The seeded hash in the supplied database may be invalid.
  db.users[0].password = await bcrypt.hash("Test123!", 10);

  token = jwt.sign(
    { id: "1", email: "merchant@test.com", type: "merchant" },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
});

test("GET /api/payments returns amounts as numbers", async () => {
  const response = await request(app)
    .get("/api/payments")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.data[0].amount, "number");
  assert.equal(response.body.data[0].amount, 25.5);
});

test("GET /api/payments/:id returns amount as a number", async () => {
  const response = await request(app)
    .get("/api/payments/1")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.data.amount, "number");
  assert.equal(response.body.data.amount, 25.5);
});

test("Bug B: rejects payment above 50000", async () => {
  const response = await request(app)
    .post("/api/payments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: 50001,
      currency: "EUR",
      customer_email: "customer@test.com",
    });

  assert.equal(response.status, 400);
});

test("Bug B: accepts payment at maximum limit", async () => {
  const response = await request(app)
    .post("/api/payments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: 50000,
      currency: "EUR",
      customer_email: "customer@test.com",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.amount, 50000);
});

test("Bug B: rejects negative payment amount", async () => {
  const response = await request(app)
    .post("/api/payments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      amount: -100,
      currency: "EUR",
      customer_email: "customer@test.com",
    });

  assert.equal(response.status, 400);
});
