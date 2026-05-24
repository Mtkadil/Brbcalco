# Security Specification: MoMo BloCk BARber Cash Live

## 1. Data Invariants
- A chair document must have a `total` field of type `number` which must be `>= 0` and `<= 1000000`.
- The document ID for a chair must match the regular expression `^chair[1-4]$` (i.e. strictly `chair1`, `chair2`, `chair3`, or `chair4`).
- No other fields are allowed on the chair document except `total` and optionally `updatedAt`.
- Timestamps like `updatedAt` must match the server timestamp `request.time` on updates from the client.

## 2. The "Dirty Dozen" Payloads
These payloads attempt to bypass Firestore rules and inject corrupted, unsafe, or excessive data.

1. **Self-Created Unknown Chair Docs**: Creating `/chairs/chair99` with `total: 10`.
2. **Negative Balance Input**: Updating `/chairs/chair1` with `total: -500`.
3. **Invalid Data Type**: Updating `/chairs/chair1` with `total: 'one thousand'`.
4. **Denial of Wallet (Overly Large ID)**: Creating `/chairs/chair_very_long_junk_id_to_exhaust_billing_and_resources_that_has_more_than_one_hundred_characters_to_exploit` with `total: 0`.
5. **Additional Unwhitelisted Fields**: Updating `/chairs/chair1` with `{ total: 100, isPremiumDiscountApproved: true }`.
6. **Malicious Empty Payload**: Creating or updating a chair doc with `{}`.
7. **Spoofed Future Timestamp**: Updating `{ total: 100, updatedAt: timestamp('2030-01-01T00:00:00Z') }`.
8. **Malicious Total Overflow**: Updating `{ total: 999999999999 }` to break charts and layouts.
9. **Bypassing validation via Update Gap**: Sending `{ total: NaN }`.
10. **Document ID poisoning via special characters**: Creating `/chairs/chair1_.._evil`.
11. **Bulk Creation Attempts**: Trying to write into `/chairs/random` with an invalid ID.
12. **Tampering with Firestore Rules via clients**: Modifying chair collections with unexpected data structures.

## 3. Test Cases Summary
Each of these dirty payloads should return `PERMISSION_DENIED` under the generated security rules.
