import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

test("Bug C: rejects email without a domain suffix", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: "user@domain",
      password: "Test123!",
      business_name: "Test Business",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid email format");
});

test("Bug C: accepts a valid email format", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: "valid-email-test@example.com",
      password: "Test123!",
      business_name: "Test Business",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.email, "valid-email-test@example.com");
});
