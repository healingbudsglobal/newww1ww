
## Add AI-Generated Featured Images to The Wire Articles

### Overview
Create a new edge function specifically for generating professional cannabis industry article images, then use it to populate the 3 articles currently missing featured images. The existing `generate-product-image` function is designed for product jar photography -- we need article-specific imagery instead.

### Articles Needing Images

| Article | Category | Slug |
|---------|----------|------|
| South Africa's Cannabis Industry Hits R2 Billion Market Milestone | industry | `south-africa-cannabis-market-milestone` |
| New Terpene Research Reveals Key Role in Cannabis Therapeutic Effects | research | `terpene-research-therapeutic-effects` |
| Thailand Updates Medical Cannabis Framework with Stricter Quality Controls | industry | `thailand-medical-cannabis-quality-update` |

### Implementation Steps

**Step 1 -- Create `generate-article-image` Edge Function**

A new backend function at `supabase/functions/generate-article-image/index.ts` that:
- Accepts `articleId`, `title`, `category`, and `slug` as inputs
- Uses the Lovable AI image generation API (`google/gemini-2.5-flash-image`) with article-specific prompts
- Generates professional, editorial-style cannabis industry photography (not product jars)
- Uploads the result to the `product-images` storage bucket under `articles/` prefix
- Updates the `articles` table `featured_image` column directly with the public URL
- Includes per-category prompt templates for appropriate imagery:
  - **industry**: business/market imagery -- facilities, dispensaries, professional settings
  - **research**: lab/science imagery -- microscopes, terpene molecules, clinical environments
  - **blockchain**: tech/supply-chain imagery -- digital overlays, traceability visuals

**Step 2 -- Add a "Generate Missing Images" button to Admin Tools**

Add a small UI section (or extend existing admin tooling) that:
- Lists articles missing featured images
- Provides a "Generate All" button that calls the edge function for each
- Shows progress and results

**Step 3 -- Generate images for the 3 missing articles**

Call the new edge function for each article, which will:
1. Generate an AI image with an editorial prompt tailored to the article title and category
2. Upload to storage at `articles/{slug}.jpg`
3. Update the database row with the public URL

### Technical Details

- **AI Model**: `google/gemini-2.5-flash-image` (available via `LOVABLE_API_KEY`, already configured)
- **Storage**: Reuses existing `product-images` bucket with `articles/` prefix
- **Image style**: Professional editorial photography, 16:9 aspect ratio suggestion in prompt, clean and modern
- **No new database tables needed** -- just updates `featured_image` on existing `articles` rows
