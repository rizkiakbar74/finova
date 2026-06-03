# RLS Test Steps — Finova Phase 3

## Goal

Prove that User A can only access User A data and User B can only access User B data.

## Required Test Users

- `user_a@example.com`
- `user_b@example.com`

## Test 1 — Auth Bootstrap

1. Register User A.
2. Confirm rows exist in:
   - `profiles`
   - `user_settings`
   - `notification_preferences`
3. Register User B.
4. Confirm separate rows exist for User B.

## Test 2 — Wallet Isolation

1. User A creates a wallet.
2. User B opens wallets page/API.
3. User B must not see User A wallet.
4. User B must not update/archive User A wallet by direct ID.

## Test 3 — Category Isolation

1. User A creates income and expense categories.
2. User B must not see User A categories.
3. User B must not update/archive User A categories.

## Test 4 — Transaction Ownership

1. User A creates wallet, category, and transaction.
2. User B must not read User A transaction.
3. User B must not update/delete User A transaction.
4. User B must not create transaction using User A wallet ID.
5. User B must not create transaction using User A category ID.

## Test 5 — Category Type Validation

1. Try to create an `expense` transaction with an `income` category.
2. It must fail.
3. Try to create an `income` transaction with an `expense` category.
4. It must fail.

## Test 6 — Budget Category Validation

1. Try to create budget item with an income category.
2. It must fail.
3. Budget items must only accept expense categories.

## Test 7 — Storage Isolation

1. User A uploads receipt to path `{user_a_id}/{transaction_id}/receipt.pdf`.
2. User B must not read that file.
3. Bucket `receipts` must not be public.

## Launch Rule

No RLS, no launch.
