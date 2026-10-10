# EU Pay QA Engineer Assignment

This repository contains my work for the EU Pay QA Engineer test assignment.

I reviewed the API, reproduced the reported issues, and worked on fixes for Bugs A–G. The changes cover payment amount types, payment amount validation, email validation, webhook signature verification, duplicate webhook handling, duplicate table orders, and repeated e-invoice submissions.

I added automated tests using Node.js's built-in test runner and Supertest to check the affected endpoints and verify the expected behavior.

The assignment also includes bug reports, fix documentation, and a test plan covering positive cases, invalid inputs, boundary values, authentication, and duplicate requests.

To run the automated tests:

```bash
npm test
```

To run the assignment's bug verification script:

```bash
npm run verify-bugs
```

The final test results should be checked before submission. Any remaining failures or unverified scenarios should be recorded in the relevant documentation.
