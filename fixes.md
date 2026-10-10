# Fixes

This document describes the changes made to address Bugs A–G and the tests added for them.

## Bug A: Payment Amount Type

**Change made:**  
Updated the payment response to return `amount` as a number instead of converting it to a string.

**Tests added:**
- Payment list returns numeric amounts.
- Payment details return numeric amounts.

**Files changed:**
- `src/routes/payment.routes.js`
- `src/routes/__tests__/payment.routes.test.js`

---

## Bug B: Maximum Payment Amount

**Change made:**  
Added validation to reject amounts that are not finite numbers, are zero or negative, or exceed €50,000.

**Tests added:**
- Amount above €50,000 is rejected.
- Amount of exactly €50,000 is accepted.
- Negative amount is rejected.

**Files changed:**
- `src/routes/payment.routes.js`
- Payment route tests.

---

## Bug C: Email Validation

**Change made:**  
Updated the email validation pattern to require a dot in the domain portion of the address.

**Tests added:**
- An incomplete domain such as `user@domain` is rejected.
- A valid email address is accepted.

**Files changed:**
- Authentication route implementation.
- `src/routes/__tests__/auth.routes.test.js`

**Note:**  
This is a basic validation improvement, not a complete implementation of every email-address rule.

---

## Bug D: Webhook Signature Verification

**Change made:**  
Added HMAC-SHA256 signature verification for `/payment-status`. The API checks the signature format, compares signatures using `crypto.timingSafeEqual`, and rejects invalid or missing signatures before changing the payment.

**Tests added:**
- Valid signature is accepted.
- Invalid signature is rejected.
- Missing signature is rejected.
- A payload changed after signing is rejected.

**Files changed:**
- `src/routes/webhook.routes.js`
- `src/routes/__tests__/webhook.routes.test.js`

---

## Bug E: Webhook Idempotency

**Change made:**  
Added an `event_id` requirement and a check against previously processed event IDs. When an event has already been processed, the API returns HTTP 200 without applying the event again.

**Tests added:**
- A new event is processed and recorded.
- A duplicate event is not processed again.
- A duplicate event with a different status does not change the original payment state.
- Missing event ID is rejected.
- An invalid signature does not change the payment.

**Files changed:**
- `src/routes/webhook.routes.js`
- `src/routes/__tests__/webhook.routes.test.js`

**Limitation:**  
Processed event IDs are stored in memory. They are lost when the server restarts, and the check is not atomic under concurrent requests. A production implementation should use persistent storage with a unique constraint or another atomic deduplication mechanism.

---

## Bug F: Duplicate Pending Table Orders

**Change made:**  
Added a check before creating an order. If a pending order already exists for the same merchant and table, the API returns HTTP 409.

**Tests added:**
- A new table order is created successfully.
- A second pending order for the same merchant and table is rejected.
- An order for a different table is allowed.
- A new order is allowed after the previous order is cancelled.

**Files changed:**
- `src/routes/table-order.routes.js`
- `src/routes/__tests__/table-order.routes.test.js`

**Limitation:**  
The check uses in-memory data and is not atomic under concurrent requests. A production implementation should enforce the rule at the data layer where possible.

---

## Bug G: Duplicate E-Invoice Submission

**Change made:**  
Added a check before generating a new submission ID. If the invoice status is already `submitted` or `accepted`, the API returns HTTP 409 instead of submitting it again.

**Tests added:**
- An invoice can be submitted initially.
- A second submission is rejected and the original submission ID remains unchanged.
- An accepted invoice cannot be submitted again.
- An invalid SIRET value is rejected.

**Files changed:**
- `src/routes/einvoice.routes.js`
- `src/routes/__tests__/einvoice.routes.test.js`

**Testing note:**  
The initial test run returned HTTP 401 because the tests did not include authentication. A JWT was added to the test setup, but the complete suite must be run again to confirm the final result.

---

## Final Verification

Run the following commands before submitting:

```bash
npm test
git diff --check
git status
```

Check that all tests pass and that the intended source files, tests, and documentation are included in the submission.

The `npm run verify-bugs` command checks for the original bugs. Since these changes are intended to fix those bugs, its results should be interpreted according to what that script is designed to verify.