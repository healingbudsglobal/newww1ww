

## Admin Portal Visual Refinement: Colour Harmony and Design Polish

### Research Findings

**2026 UI Colour Trends (from Updivision, TubikStudio, ProDesignSchool):**
- **Elevated Neutrals**: Replacing harsh white with warm sand, stone, oatmeal -- reducing eye strain for long admin sessions
- **Eco-Inspired Palettes**: Moss greens, ocean blues, terracotta, clay -- grounding and organic warmth
- **Soft Gradients 2.0**: Subtle, airy blends like light passing through glass -- not loud rainbows
- **Hyper-Saturated Accents**: Single bold accent on calm backgrounds for CTAs and key data
- **Adaptive Colour Systems**: Palettes that work beautifully in both light and dark modes

**Your Reference Image Analysis:**
All five palette references share a common thread: tropical/botanical greens paired with dusty sky blues and warm sand/parchment. The dominant harmony is:
- Soft sage-green (leaves in sunlight)
- Dusty steel-blue (sky)
- Deep forest-green (dark foliage)
- Warm sand/parchment (ground, warmth)
- Olive/lime accent (new growth)

### Colour Palette Refinement

The current admin tokens (`--admin-forest`, `--admin-fir`, `--admin-sage`, `--admin-parchment`) are a solid foundation. The refinement adds the **dusty blue** and **warm sand** tones visible in your palm tree references, plus softens some values for better eye comfort during long sessions.

**Updated/New Token Values:**

```text
Current                          Refined
--admin-forest: 144 22% 26%  -> 150 25% 24%   (slightly cooler, deeper)
--admin-forest-deep: 140 21% 30% -> 148 22% 28% (more green, less muddy)
--admin-fir: 130 22% 42%     -> 140 28% 40%   (richer, more saturated fir)
--admin-sage: 90 16% 63%     -> 95 18% 65%    (warmer sage, closer to olive)
--admin-parchment: 40 14% 83% -> 38 20% 90%   (lighter, warmer sand -- key change for backgrounds)
--admin-cool-sage: 192 7% 81% -> 200 14% 82%  (nudge toward dusty blue from palms)
--admin-soft-green: 148 13% 60% -> 148 16% 58% (slightly richer)
--admin-gold: 48 72% 49%     -> 45 65% 52%    (warmer, less electric gold)

NEW tokens:
--admin-sky: 205 25% 72%     (dusty sky blue from palm references)
--admin-sand: 35 25% 85%     (warm sand undertone)
--admin-olive: 78 30% 48%    (olive/lime accent for growth indicators)
```

### Visual Changes by File

#### 1. `src/styles/theme.css` -- Palette Token Update
- Refine existing admin token values as shown above
- Add 3 new tokens: `--admin-sky`, `--admin-sand`, `--admin-olive`
- Update dark mode admin variants to maintain harmony (deeper, more muted versions)
- Add a new `--admin-bg-gradient` for the main content background: subtle warm gradient from sand to cool-sage

#### 2. `src/layout/AdminLayout.tsx` -- Sidebar and Content Refinements
- **Sidebar gradient**: Shift from pure forest-to-forest-deep to include a subtle blue-green undertone at the bottom (forest -> forest-deep with a hint of sky)
- **Content area background**: Change from flat parchment to a very subtle gradient (`--admin-sand` at top fading to `--admin-parchment`) for depth
- **Page header**: Add a thin bottom border with a gradient accent using the new sky-blue token
- **Active nav indicator**: Use the refined fir green with a subtle left-border accent (3px solid) instead of just background change -- more modern, less heavy
- **Mobile header**: Add the dusty sky-blue as a secondary gradient colour in the top accent strip

#### 3. `src/pages/AdminDashboard.tsx` -- Dashboard KPI Cards
- Apply earthy palette to KPI card icon backgrounds: use `--admin-olive` for growth/success metrics, `--admin-sky` for info metrics, keep amber for warnings
- Add subtle card hover state with a `--admin-sand` background shift
- Sales Overview card: use the new olive accent for positive numbers
- Recent Activity: use `--admin-sky` for client events, `--admin-olive` for order events

#### 4. `src/components/admin/AdminClientManager.tsx` -- Metric Cards Colour Harmony
- Total Clients metric card icon: use `--admin-forest` (deep green) instead of generic primary
- Pending metric: keep amber (semantic)
- Verified metric: use `--admin-olive` (earthy green success) instead of generic green
- Rejected metric: keep red (semantic)
- Filter pill active state: use `--admin-fir` (already correct, just verify consistency)

#### 5. `src/pages/AdminOrders.tsx` -- Stats Card Harmony
- Total Orders card: use `--admin-forest` background
- Synced card: use `--admin-olive` instead of generic emerald
- Today card: use `--admin-sky` instead of generic blue
- Keep amber/red for pending/failed (semantic colours)

#### 6. `src/pages/AdminTeam.tsx` -- Tab Styling
- Tab list background: use `--admin-sand` instead of parchment for subtler warmth
- Active tab: already uses `--admin-fir` (good)

#### 7. `src/components/admin/TeamCommissions.tsx` -- Role Badge Colours
- Agent badge: use `--admin-sky` instead of generic blue
- Employee badge: keep purple (distinct)
- Referral badge: use `--admin-olive` instead of generic cyan

#### 8. `src/pages/AdminStrains.tsx` -- Card Consistency
- Apply consistent card border using `--admin-soft-green` tokens
- Use `--admin-fir` for strain-related action buttons

### Dark Mode Harmony

All new tokens get dark mode counterparts:
```text
.dark {
  --admin-sky: 205 18% 35%;
  --admin-sand: 35 10% 16%;
  --admin-olive: 78 20% 35%;
}
```

### Design Principles Applied
- **Elevated neutrals**: Warmer, lighter parchment/sand backgrounds reduce eye fatigue
- **Eco-inspired**: Palm-reference greens and blues create organic, trustworthy feel
- **Hyper-saturated accent**: Gold remains the single bold accent for commissions and important callouts
- **Consistency**: All admin pages use the same token vocabulary, no more generic Tailwind colours for admin-specific elements

### Files Modified

| File | Change |
|------|--------|
| `src/styles/theme.css` | Refine admin tokens, add sky/sand/olive, dark mode variants |
| `src/layout/AdminLayout.tsx` | Sidebar gradient refinement, content area gradient, nav active style |
| `src/pages/AdminDashboard.tsx` | KPI card colours aligned to palette |
| `src/components/admin/AdminClientManager.tsx` | Metric card colours aligned |
| `src/pages/AdminOrders.tsx` | Stats card colours aligned |
| `src/pages/AdminTeam.tsx` | Tab background refinement |
| `src/components/admin/TeamCommissions.tsx` | Role badge colours aligned |
| `src/pages/AdminStrains.tsx` | Card border consistency |

