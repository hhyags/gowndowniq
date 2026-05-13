# Firebase Security Specification

## Data Invariants
1. Users must have a profile in the `users` collection.
2. Only Admins can modify product details and warehouse configurations.
3. Staff can update stock levels but not product metadata (brand, model, etc.).
4. Transactions are immutable logs once created.
5. Every write must be authenticated.

## The Dirty Dozen Payloads (Targeting Rejection)
1. **Identity Spoofing**: Attempt to create a user profile for a different UID.
2. **Privilege Escalation**: Attempt to set one's own role to 'admin'.
3. **Data Poisoning**: Attempt to set a product quantity to -100.
4. **ID Poisoning**: Attempt to use a 2MB string as a document ID.
5. **Schema Violation**: Attempt to update a product with an invalid field type (e.g., brand as number).
6. **Relational Break**: Attempt to create a transaction for a non-existent product.
7. **Immutability Breach**: Attempt to update a transaction record.
8. **Unauthorized Deletion**: Staff attempting to delete a warehouse.
9. **Email Spoofing**: Unverified user attempting to perform sensitive writes (if enforced).
10. **Shadow Update**: Attempting to add a 'isVerified' field to a product.
11. **Orphaned Record**: Attempting to create a product without a warehouseId.
12. **Out-of-Order Update**: Attempting to change a transaction timestamp to the past.
