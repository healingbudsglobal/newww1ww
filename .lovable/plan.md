

## Fix: Move `pg_net` Extension Out of Public Schema

### Current State

The security scanner flags "Extensions in Public Schema." After investigation, **only one extension remains in `public`**:

| Extension | Current Schema | Status |
|-----------|---------------|--------|
| pg_net | public | Needs moving |
| pgcrypto | extensions | Already correct |
| uuid-ossp | extensions | Already correct |
| pg_graphql | graphql | Already correct |
| pg_cron | pg_catalog | Already correct |

### What Is `pg_net`?

`pg_net` provides HTTP client functions (`net.http_get`, `net.http_post`, etc.) used internally by the platform for webhook delivery and scheduled tasks. Its actual objects live in the `net` schema, but the extension registration points to `public`.

### Why This Is Flagged

Extensions in the public schema can pollute the namespace, create naming conflicts, and expose internal functions to application queries. Best practice is to isolate extensions in a dedicated schema.

### Fix

Run a single database migration:

```sql
ALTER EXTENSION pg_net SET SCHEMA extensions;
```

### Risk Assessment

- **Low risk**: `pg_net` objects already live in the `net` schema, so moving the extension registration should not break anything
- **Possible blocker**: Lovable Cloud may restrict this operation at the platform level. If the migration fails with a permissions error, we confirm it truly is platform-managed and update the security finding accordingly
- **No application code references `pg_net` directly** -- it is used internally by the platform

### Outcome

- If successful: the security warning is resolved and the finding is deleted
- If blocked by permissions: we update the finding to confirm it cannot be fixed at the application level and mark it as permanently ignored with a clear explanation

### Technical Details

| Item | Detail |
|------|--------|
| Migration SQL | `ALTER EXTENSION pg_net SET SCHEMA extensions;` |
| Files modified | One new migration file only |
| Code changes | None |
| Rollback | `ALTER EXTENSION pg_net SET SCHEMA public;` |

