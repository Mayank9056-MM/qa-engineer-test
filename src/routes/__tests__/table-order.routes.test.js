
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app } from "../../app.js";
import { db, initDatabase } from "../../db/database.js";

describe("Bug F: Duplicate pending table orders", () => {
  beforeEach(() => {
    for (const key of Object.keys(db)) {
      if (Array.isArray(db[key])) {
        db[key].length = 0;
      }
    }

    initDatabase();
  });

  const createOrder = (overrides = {}) =>
    request(app).post("/api/table-orders").send({
      merchant_id: "merchant-test",
      table_number: 1,
      items: [{ name: "Coffee", price: 100, quantity: 1 }],
      ...overrides,
    });

  it("creates the first order for a table", async () => {
    const response = await createOrder();

    assert.equal(response.status, 201);
    assert.equal(response.body.data.status, "pending");
  });

  it("rejects a second pending order for the same merchant and table", async () => {
    const first = await createOrder();
    assert.equal(first.status, 201);

    const second = await createOrder();

    assert.equal(second.status, 409);
    assert.equal(
      second.body.error,
      "Table already has a pending order",
    );
    assert.equal(
      db.table_orders.filter(
        (order) =>
          order.merchant_id === "merchant-test" &&
          order.table_number === 1 &&
          order.status === "pending",
      ).length,
      1,
    );
  });

  it("allows an order for a different table", async () => {
    const first = await createOrder();
    assert.equal(first.status, 201);

    const second = await createOrder({ table_number: 2 });

    assert.equal(second.status, 201);
    assert.equal(db.table_orders.length, 2);
  });

  it("allows a new order after the previous order is cancelled", async () => {
    const first = await createOrder();
    assert.equal(first.status, 201);

    const existingOrder = db.table_orders.find(
      (order) => order.id === first.body.data.id,
    );
    existingOrder.status = "cancelled";

    const second = await createOrder();

    assert.equal(second.status, 201);
    assert.equal(db.table_orders.length, 2);
  });
});
