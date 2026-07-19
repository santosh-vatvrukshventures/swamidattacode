# Security Specification for Swamidatta Traders Firestore

This document outlines the security invariants, threat modeling payloads ("Dirty Dozen"), and rules validation strategy for the private internal management app of Swamidatta Traders.

## 1. Data Invariants

1. **Authenticated Access**: Only authenticated operators (`request.auth != null`) with a verified email address (`request.auth.token.email_verified == true`) are permitted to read or write any business data (zero-trust model).
2. **Item Integrity**: Inventory item purchase prices and selling prices (retail/wholesale) must always be positive numbers. Current stock quantity cannot be negative.
3. **Transaction Immutability**: Once a sale or warehouse inward log is written, it is immutable (`allow update: if false` and `allow delete: if false`). Transactions cannot be altered or removed to prevent financial tampering.
4. **Expense Immutability**: Once logged, operating expenses cannot be edited or deleted, ensuring continuous accounting audits.
5. **Stock Validation**: Item stock quantities can only be modified through validated updates.

---

## 2. The "Dirty Dozen" Threat Payloads (Test Suite Cases)

These 12 payloads represent malicious or invalid operations that the security rules MUST block with `PERMISSION_DENIED`.

### Pillar 1: Identity Spoofing & Verification Bypasses
1. **Unauthenticated Item Creation**
   - *Payload*: Attempt to create a document in `/items/` with no auth token.
   - *Expectation*: `PERMISSION_DENIED`
2. **Unverified Email Access**
   - *Payload*: Authenticated user whose token has `email_verified == false` attempts to read `/items`.
   - *Expectation*: `PERMISSION_DENIED`

### Pillar 2: Schema Violations & Value Poisoning
3. **Negative Price Poisoning**
   - *Payload*: Create item with `purchase_price = -150`.
   - *Expectation*: `PERMISSION_DENIED`
4. **Invalid Customer Type**
   - *Payload*: Log a sale with `customer_type = "VIP_Guest"` instead of "Retail" or "Wholesale".
   - *Expectation*: `PERMISSION_DENIED`
5. **Oversized Field Injections (Denial of Wallet / Resource Poisoning)**
   - *Payload*: Log an expense with a `remarks` string that is 1.5MB in size.
   - *Expectation*: `PERMISSION_DENIED` (Rule enforces `.size() <= 1000` on remarks).

### Pillar 3: Identifier Integrity (ID Poisoning)
6. **ID Injection Attack**
   - *Payload*: Attempt to create an item with a document ID containing special characters or SQL-style parameters like `item_id = "paper_cups;DROP_TABLE_items"`.
   - *Expectation*: `PERMISSION_DENIED` (Matches `'^[a-zA-Z0-9_\-]+$'` limit).

### Pillar 4: State & Lifecycle Tampering
7. **Retroactive Sale Pricing Edit**
   - *Payload*: Attempt to update an existing invoice in `/sales/` to reduce the `net_amount_payable`.
   - *Expectation*: `PERMISSION_DENIED` (Sales are immutable).
8. **Item Price Tampering via Sales Form**
   - *Payload*: Create a sale record where an item is sold, but injecting a negative `unit_price` in the nested `items_sold` list to trick accounting.
   - *Expectation*: `PERMISSION_DENIED` (Items sold must have `unit_price >= 0`).

### Pillar 5: Cardinality & Bounding Limits
9. **Empty Transaction Logging**
   - *Payload*: Log a sale invoice with an empty `items_sold` list.
   - *Expectation*: `PERMISSION_DENIED` (Items sold array must have `.size() > 0`).
10. **Massive Array Injection**
    - *Payload*: Log a warehouse inward shipment with 5,000 line items in a single list, triggering performance issues.
    - *Expectation*: `PERMISSION_DENIED` (Items received array limited to `.size() <= 100`. Excess items should be split into multiple documents).

### Pillar 6: Temporal Violations
11. **Future-Dated Invoices**
    - *Payload*: Log a sale invoice with a client-side date set to 5 years in the future to spoof financial tracking.
    - *Expectation*: `PERMISSION_DENIED` (Enforces `date == request.time`).

### Pillar 7: PII / Privacy Protection
12. **Blanket Collection Scraping**
    - *Payload*: A low-level verified operator attempts a blanket, unfiltered read of the entire `expenses` collection to scrape historical accounts.
    - *Expectation*: Allowed only if utilizing strict query conditions or administrative access, otherwise restricted to standard structured views.

---

## 3. Rules Validation Test Suite Concept (`firestore.rules.test.ts`)

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';

let testEnv: RulesTestEnvironment;

describe('Swamidatta Traders Firestore Rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'swamidatta-traders-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('blocks unauthenticated operator write', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      unauthDb.collection('items').doc('paper_plates_6').set({
        item_id: 'paper_plates_6',
        name: 'Paper Plates 6 inch',
        category: 'Disposables',
        purchase_price: 2.50,
        selling_price_retail: 3.50,
        selling_price_wholesale: 3.00,
        current_stock_qty: 500,
        min_stock_alert: 50,
      })
    );
  });

  it('blocks authenticated operator with unverified email', async () => {
    const unverifiedDb = testEnv.authenticatedContext('operator_1', {
      email: 'operator@swamidatta.com',
      email_verified: false,
    }).firestore();

    await assertFails(
      unverifiedDb.collection('items').doc('paper_plates_6').set({
        item_id: 'paper_plates_6',
        name: 'Paper Plates 6 inch',
        category: 'Disposables',
        purchase_price: 2.50,
        selling_price_retail: 3.50,
        selling_price_wholesale: 3.00,
        current_stock_qty: 500,
        min_stock_alert: 50,
      })
    );
  });

  it('permits verified operator item logging', async () => {
    const verifiedDb = testEnv.authenticatedContext('operator_1', {
      email: 'operator@swamidatta.com',
      email_verified: true,
    }).firestore();

    await assertSucceeds(
      verifiedDb.collection('items').doc('paper_plates_6').set({
        item_id: 'paper_plates_6',
        name: 'Paper Plates 6 inch',
        category: 'Disposables',
        purchase_price: 2.50,
        selling_price_retail: 3.50,
        selling_price_wholesale: 3.00,
        current_stock_qty: 500,
        min_stock_alert: 50,
      })
    );
  });

  it('blocks negative price values on items', async () => {
    const verifiedDb = testEnv.authenticatedContext('operator_1', {
      email: 'operator@swamidatta.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      verifiedDb.collection('items').doc('paper_plates_6').set({
        item_id: 'paper_plates_6',
        name: 'Paper Plates 6 inch',
        category: 'Disposables',
        purchase_price: -2.50, // Invalid
        selling_price_retail: 3.50,
        selling_price_wholesale: 3.00,
        current_stock_qty: 500,
        min_stock_alert: 50,
      })
    );
  });

  it('blocks sales document updates (immutability check)', async () => {
    const verifiedDb = testEnv.authenticatedContext('operator_1', {
      email: 'operator@swamidatta.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      verifiedDb.collection('sales').doc('sale_101').update({
        gross_total: 0, // Malicious update
      })
    );
  });
});
```
