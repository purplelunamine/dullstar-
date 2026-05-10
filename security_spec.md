# Security Specification - dullStar Artist Hub

## Data Invariants
- An album must have a title, cover image, and artist name (dullStar).
- A song must belong to an album.
- Only the owner/admin can modify any data.
- Read access is public for all data.

## The Dirty Dozen (Test Payloads)
1. Unauthenticated write to `artists/dullstar`
2. Authenticated non-admin write to `albums/new-album`
3. Updating an album's `artistId` to something else (Immortality check)
4. Creating a song with a 1MB lyric string (Resource poisoning)
5. Modifying `monthlyListeners` without correctly formatted data
6. Creating an album with a missing `coverImageUrl`
7. Updating a song but trying to change its `albumId`
8. Deleting an artist record by an unauthenticated user
9. Batch write changing multiple albums by a regular user
10. Injecting PII into the public artist record
11. Spoofing admin status via client-side claims (which we don't use)
12. Creating a song with an invalid ID format

## Test Plan
- Use `firebase/rules-unit-testing` or manual verification.
- Enforce `isAdmin()` via email verification.
