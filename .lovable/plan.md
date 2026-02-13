

# Update Country Code for scott.k1@outlook.com

Run a single SQL update to change the `country_code` from `PT` to `ZA` for the client record associated with `scott.k1@outlook.com`.

```sql
UPDATE drgreen_clients
SET country_code = 'ZA', updated_at = now()
WHERE email = 'scott.k1@outlook.com';
```

No code file changes required -- this is a data-only fix.

