# Bug Reports

## Bug A: Payment Amount Returned as a String

**Issue:**  
The payment API returned the `amount` field as a string instead of a number.

**Steps to reproduce:**
1. Start the API server.
2. Send a GET request to the payment list endpoint.
3. Check the type of the `amount` field in the response.

**Expected result:**  
The `amount` field should be a JSON number.

**Actual result:**  
The `amount` field was returned as a string, such as `"25.5"`.

**Impact:**  
Clients may need extra conversion logic before performing calculations with payment amounts.

**Status:** Fixed. Automated tests were added to check the response type.

---

## Bug B: Payment Amount Limit Not Enforced

**Issue:**  
The API accepted payment amounts greater than €50,000.

**Steps to reproduce:**
1. Send a POST request to create a payment.
2. Set the amount to `50001`.
3. Check the response.

**Expected result:**  
Amounts greater than €50,000 should be rejected with HTTP 400.

**Actual result:**  
The API accepted an amount above the expected limit.

**Impact:**  
Payments above the permitted limit could be created.

**Status:** Fixed. Tests cover amounts above the limit, the exact limit, and negative amounts.

---

## Bug C: Invalid Email Accepted During Registration

**Issue:**  
The registration endpoint accepted an email address without a complete domain, such as `user@domain`.

**Steps to reproduce:**
1. Send a POST request to the registration endpoint.
2. Use `user@domain` as the email address.
3. Check the response.

**Expected result:**  
The API should reject the invalid email with HTTP 400.

**Actual result:**  
The API accepted the address and returned HTTP 201.

**Impact:**  
Invalid email addresses could be stored in user records.

**Status:** Fixed. Tests cover an invalid email and a valid email address.

---

## Bug D: Payment Webhook Accepted Invalid Signatures

**Issue:**  
The payment webhook did not properly verify the request signature before processing an event.

**Steps to reproduce:**
1. Send a POST request to `/payment-status`.
2. Include a payment ID and status in the request body.
3. Send an invalid value in the `x-webhook-signature` header.
4. Check the response and payment state.

**Expected result:**  
The API should reject an invalid or missing signature with HTTP 401 and leave the payment unchanged.

**Actual result:**  
An invalid signature could be accepted, allowing the payment to be updated.

**Impact:**  
An unauthorised request could change a payment's status.

**Status:** Fix implemented. Automated tests were added for valid, invalid, missing, and mismatched-payload signatures. Confirm the latest test run before submission.

---

## Bug E: Duplicate Payment Webhook Events

**Issue:**  
The API could process the same payment webhook event more than once.

**Steps to reproduce:**
1. Send a valid webhook event with an event ID.
2. Send the same event again.
3. Check the response and payment state.

**Expected result:**  
The API should recognise the duplicate and avoid processing it again.

**Actual result:**  
The API did not reliably prevent duplicate processing.

**Impact:**  
Repeated webhook events could cause the same operation to be applied more than once.

**Status:** Fix implemented. Automated tests cover duplicate events, missing event IDs, and payment state changes. The current implementation stores processed event IDs in memory, so it is not durable across restarts.

---

## Bug F: Duplicate Pending Table Orders

**Issue:**  
The API allowed a second pending order for the same merchant and table.

**Steps to reproduce:**
1. Create a table order with a merchant ID and table number.
2. Leave the order in `pending` status.
3. Submit another order for the same merchant and table.
4. Check the response.

**Expected result:**  
The second pending order should be rejected with HTTP 409.

**Actual result:**  
The API could create another pending order for the same table.

**Impact:**  
Duplicate orders could be created for a table that already has a pending order.

**Status:** Fix implemented. Tests cover duplicate orders, different tables, and creating a new order after the previous one is cancelled. Confirm the latest test run before submission.

---

## Bug G: Duplicate E-Invoice Submission

**Issue:**  
The API did not prevent an invoice that had already been submitted or accepted from being submitted again.

**Steps to reproduce:**
1. Authenticate as a user who owns an invoice.
2. Submit the invoice through the e-invoice endpoint.
3. Submit the same invoice again.
4. Check the response and submission ID.

**Expected result:**  
The API should reject the second submission with HTTP 409 and keep the existing submission ID unchanged.

**Actual result:**  
The API could attempt to submit the invoice again.

**Impact:**  
Duplicate submissions could cause processing problems with the tax authority.

**Status:** Fix implemented. Automated tests cover duplicate submissions, accepted invoices, and invalid SIRET values. The latest test run still needs to be confirmed after fixing authentication in the test setup.