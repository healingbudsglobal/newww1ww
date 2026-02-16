

## Admin Portal Visual Refinement: Colour Harmony and Design Polish

### Overview
Apply the refined earthy green palette (inspired by your tropical/botanical reference images) across all admin portal pages for visual consistency, better eye comfort, and a modern 2026 aesthetic.

### Colour Token Changes

**Refined existing tokens and 3 new tokens in `src/styles/theme.css`:**

| Token | Current | New | Reason |
|-------|---------|-----|--------|
| `--admin-forest` | 144 22% 26% | 150 25% 24% | Cooler, deeper green |
| `--admin-forest-deep` | 140 21% 30% | 148 22% 28% | Less muddy |
| `--admin-fir` | 130 22% 42% | 140 28% 40% | Richer saturation |
| `--admin-sage` | 90 16% 63% | 95 18% 65% | Warmer, closer to olive |
| `--admin-parchment` | 40 14% 83% | 38 20% 90% | Lighter, warmer sand |
| `--admin-cool-sage` | 192 7% 81% | 200 14% 82% | Nudge toward dusty blue |
| `--admin-soft-green` | 148 13% 60% | 148 16% 58% | Slightly richer |
| `--admin-gold` | 48 72% 49% | 45 65% 52% | Warmer gold |
| **NEW** `--admin-sky` | -- | 205 25% 72% | Dusty sky blue |
| **NEW** `--admin-sand` | -- | 35 25% 85% | Warm sand |
| **NEW** `--admin-olive` | -- | 78 30% 48% | Olive accent |

Dark mode counterparts for new tokens included.

### Files Modified

| File | Change |
|------|--------|
| `src/styles/theme.css` | Refine all admin tokens, add sky/sand/olive, dark variants |
| `src/layout/AdminLayout.tsx` | Sidebar gradient with sky undertone, content area sand gradient, nav active left-border style, page header gradient accent |
| `src/pages/AdminDashboard.tsx` | KPI card icon colours aligned (olive for growth, sky for info) |
| `src/components/admin/AdminClientManager.tsx` | Metric card colours (forest, olive, amber, red) |
| `src/pages/AdminOrders.tsx` | Stats cards (forest, olive, sky for Today) |
| `src/pages/AdminTeam.tsx` | Tab list background uses sand token |
| `src/components/admin/TeamCommissions.tsx` | Role badges (sky for agent, olive for referral) |
| `src/pages/AdminStrains.tsx` | Consistent card borders and action button colours |

### Design Principles
- Elevated neutrals for reduced eye strain
- Eco-inspired palette from your palm/botanical references
- Gold remains the single bold accent for commissions
- All admin pages share the same token vocabulary

