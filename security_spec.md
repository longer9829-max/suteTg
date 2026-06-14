# Security Specification - Messenger App

## Data Invariants
1. A message must belong to a valid chat.
2. Only the sender can set their `senderId` in a message.
3. User profile updates are restricted to the owner of that profile.
4. Timestamps (`createdAt`, `updatedAt`, `lastSeen`) must be server-generated.

## The "Dirty Dozen" Payloads (Denial Expected)
1. Message with forged `senderId`.
2. Message with extremely large `text` (oversize).
3. Chat room creation by unauthenticated user.
4. User profile update of someone else's profile.
5. Message creation with a client-side `createdAt` timestamp.
6. Chat room update modifying `createdBy` field (immutable).
7. Message with injected malicious scripts in `text` (prevented by strict string validation and size limits, though scrubbing is UI-side).
8. User private info read by another user.
9. Message update (messages should be immutable once sent in this app).
10. Chat room update adding a "ghost" field like `isAdmin: true`.
11. User public profile creation with a fake `uid`.
12. Message creation in a chat room ID that contains path traversal characters (e.g., `../`).

## Test Runner
A `firestore.rules.test.ts` would normally be used here to automate these checks.
