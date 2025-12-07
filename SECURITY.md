# Security Documentation

## Healing Buds Global - Security Best Practices

This document outlines the security configurations and best practices for the Healing Buds Global platform.

---

## Authentication Security (Supabase)

### Recommended Settings

1. **Leaked Password Protection**
   - Enable in Supabase Dashboard: Authentication → Settings → Security
   - This prevents users from signing up with passwords that have been exposed in known data breaches

2. **Password Policy**
   - Minimum password length: 8 characters (recommended: 12+)
   - Require at least one uppercase, lowercase, number, and special character
   - Enable password strength indicator in signup forms

3. **Session Settings**
   - JWT expiry: 3600 seconds (1 hour) recommended for sensitive applications
   - Enable refresh token rotation
   - Consider shorter session lengths for admin/elevated access

4. **Rate Limiting**
   - Enable built-in rate limiting for authentication endpoints
   - Contact form has custom rate limiting: 3 submissions per 15 minutes per IP/email

---

## Row Level Security (RLS)

All user-specific tables must have RLS enabled with appropriate policies:

### Profiles Table
- Users can only SELECT, INSERT, UPDATE their own profile
- No cross-user access permitted
- Anonymous users cannot access profiles

### General RLS Guidelines
1. Always enable RLS on new tables
2. Use `auth.uid()` for user-specific data
3. Test policies with different user scenarios
4. Never expose sensitive data without proper authentication

---

## API Security

### Edge Functions
- All edge functions validate input server-side
- Rate limiting implemented for public endpoints
- CORS headers configured appropriately
- Secrets stored in Supabase vault (never in code)

### Contact Form Protection
- Server-side validation mirrors client-side Zod schema
- IP-based rate limiting (3 requests per 15 minutes)
- Email-based rate limiting (additional protection)
- No sensitive information in error responses

---

## Environment Variables

### Never Expose
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access, never use in client code
- `RESEND_API_KEY` - Email service credentials
- Database connection strings

### Safe for Client
- `VITE_SUPABASE_URL` - Public project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Anon key (RLS protected)

---

## Production Checklist

Before deploying to production:

- [ ] Enable Leaked Password Protection in Supabase
- [ ] Configure strong password policy
- [ ] Verify all RLS policies are correct and tested
- [ ] Ensure no service role keys are exposed in client code
- [ ] Test rate limiting on public endpoints
- [ ] Validate email domain in Resend dashboard
- [ ] Enable HTTPS only
- [ ] Review CORS configuration
- [ ] Set appropriate session timeout
- [ ] Enable audit logging (if available)

---

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly by contacting the development team directly rather than opening a public issue.

---

*Last updated: December 2024*
