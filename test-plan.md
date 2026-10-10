# EU Pay API — Test Plan

## 1. Purpose

This test plan describes how I tested the EU Pay API and what should be checked before submission. The main focus is payment handling, input validation, webhook security, duplicate requests, table orders, and e-invoice submissions.

Testing includes valid requests, invalid inputs, boundary values, and repeated requests.

## 2. Test Environment

- **Runtime:** Node.js
- **Framework:** Express.js
- **Test runner:** Node.js `node:test`
- **HTTP testing:** Supertest
- **Database:** In-memory database provided with the assignment
- **Manual testing URL:** `http://localhost:3000`
- **Authentication:** JWT bearer token for protected endpoints

## 3. Payment API Tests

| ID | Test scenario | Expected result |
|---|---|---|
| PAY-01 | Retrieve the payment list | HTTP 200 with payment data |
| PAY-02 | Retrieve an existing payment by ID | HTTP 200 with payment details |
| PAY-03 | Check the amount type in the payment list | Amount is a JSON number |
| PAY-04 | Check the amount type in payment details | Amount is a JSON number |
| PAY-05 | Request a protected payment endpoint without a token | Request is rejected |
| PAY-06 | Create a payment above €50,000 | HTTP 400 |
| PAY-07 | Create a payment for exactly €50,000 | Accepted if other fields are valid |
| PAY-08 | Create a payment with a zero or negative amount | HTTP 400 |

## 4. Authentication Tests

| ID | Test scenario | Expected result |
|---|---|---|
| AUTH-01 | Register with a valid email address | Registration succeeds if other fields are valid |
| AUTH-02 | Register with `user@domain` | HTTP 400 |
| AUTH-03 | Register with another invalid email format | Request is rejected |
| AUTH-04 | Log in with incorrect credentials | HTTP 401 or the documented authentication error |

## 5. Webhook Tests

These tests cover signature verification and duplicate event handling for `POST /api/webhooks/payment-status`.

| ID | Test scenario | Expected result |
|---|---|---|
| WH-01 | Send an event with a valid HMAC-SHA256 signature | Event is processed |
| WH-02 | Send an event with an invalid signature | HTTP 401; payment remains unchanged |
| WH-03 | Send an event without a signature | HTTP 401 |
| WH-04 | Sign the event using the wrong secret | HTTP 401 |
| WH-05 | Change the payload after signing it | HTTP 401 |
| WH-06 | Send a signature with an invalid format or length | Request is rejected without crashing |
| WH-07 | Send the same `event_id` twice | Second delivery does not process the event again |
| WH-08 | Send an event without `event_id` | HTTP 400 |
| WH-09 | Send an empty request body | Request is rejected |
| WH-10 | Send malformed JSON | Appropriate client error |
| WH-11 | Send a validly signed event with an unsupported status | Request is handled according to the API's validation rules |
| WH-12 | Simulate a processing failure | Failure is reported; event is not incorrectly marked as processed |
| WH-13 | Send two requests concurrently with the same `event_id` | At most one processing operation takes effect |
| WH-14 | Retry an event after a processing failure | Retry follows the intended processing rules |

### Webhook testing notes

- Generate valid signatures using the application's configured secret and signing format.
- Verify the signature before changing payment data.
- Check that rejected requests do not change payment state.
- Reuse the same `event_id` when testing duplicate deliveries.
- Check retry behavior after failed processing.
- Treat concurrent requests as a separate test because a simple sequential duplicate test does not prove concurrency safety.

The current implementation uses an in-memory collection for processed webhook IDs. Concurrent processing and persistence across server restarts require additional verification.

## 6. Table Order Tests

These tests cover `POST /api/table-orders`.

| ID | Test scenario | Expected result |
|---|---|---|
| ORDER-01 | Create a valid table order | HTTP 201 |
| ORDER-02 | Create another pending order for the same merchant and table | HTTP 409 |
| ORDER-03 | Create an order for a different table | HTTP 201 if the request is valid |
| ORDER-04 | Create a new order after the previous order is cancelled | HTTP 201 |

The duplicate-order check should apply to the same merchant and table when an existing order is still pending.

## 7. E-Invoice Tests

These tests cover `POST /api/einvoice/submit`.

| ID | Test scenario | Expected result |
|---|---|---|
| INV-01 | Submit a valid invoice | HTTP 200 |
| INV-02 | Submit the same invoice again | HTTP 409 |
| INV-03 | Submit an invoice without `invoice_id` | HTTP 400 |
| INV-04 | Submit an invoice with an invalid SIRET | HTTP 400 |
| INV-05 | Resubmit an invoice whose status is `accepted` | HTTP 409 |
| INV-06 | Check the status of an existing invoice | HTTP 200 with the current status |

Protected endpoints must be tested with a valid JWT. Tests should also check that rejected duplicate submissions do not replace the original submission ID.

## 8. Automation Approach

Automated tests use Node.js's built-in test runner and Supertest to send requests to the Express application.

Tests should verify more than HTTP status codes. Where relevant, they should also check:

- Response body and error messages.
- JSON data types.
- Database changes after successful requests.
- Unchanged state after rejected requests.
- Duplicate-event and duplicate-submission behavior.
- Authentication and input validation.

Test data should be reset between independent test cases so that one test does not affect another. Protected endpoints should use the authentication flow expected by the application.

## 9. Running the Tests

Run the automated test suite:

```bash
npm test
```

Run the assignment's original-bug verification script:

```bash
npm run verify-bugs
```

The verification script checks for the original defects. If it reports that a defect is no longer present, that may be expected after a fix. Use the automated regression tests to check that the corrected behavior works.

## 10. Execution Results

Record the latest actual results before submitting the assignment.

| Check | Current record |
|---|---|
| Payment and authentication tests | Previously passed in the reported run |
| Bug D signature tests | Previously passed in the reported run |
| Bug E idempotency tests | Previously passed in the reported run |
| Bug F table-order tests | Confirm against the latest test output |
| Bug G e-invoice tests | Rerun after updating the JWT authentication setup |
| Full test suite | Rerun and record the final totals |

The latest test run available during documentation preparation reported 20 passing tests and 4 failing tests. The four failures were in the e-invoice tests because requests did not include authentication credentials. JWT authentication was then added to the test setup, but the final result still needs to be confirmed.

## 11. Submission Checklist

- [ ] All seven reported bugs have been reviewed.
- [ ] Automated tests pass after the final changes.
- [ ] At least 10 meaningful automated tests are included.
- [ ] At least 12 webhook scenarios are documented.
- [ ] Bug reports describe the observed behavior and impact.
- [ ] Fix documentation matches the implementation.
- [ ] Test results reflect the latest run.
- [ ] Remaining limitations and unverified scenarios are documented.
