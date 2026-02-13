

# Auto-Updating The Wire with Real Cannabis News

## Overview

Create a backend function that automatically fetches real cannabis industry news from RSS feeds and web sources, enriches titles/summaries with Healing Buds branding keywords, and inserts them into the `articles` table. The function can be called on-demand from admin or scheduled via a cron trigger.

## Data Flow

```text
RSS Feeds (Marijuana Moment, Leafly, etc.)
        |
        v
[fetch-wire-articles] Edge Function
        |
        +--> Parse RSS/Atom XML feeds
        +--> Extract title, summary, link, date, category
        +--> Enrich with Healing Buds keywords
        +--> Deduplicate by source_url
        +--> Insert into articles table
        |
        v
  articles table (auto-visible on The Wire page)
```

## Implementation Steps

### Step 1: Add `source_url` column to articles table
Add a nullable `source_url` text column so we can track original article links and deduplicate on re-fetch.

### Step 2: Create `fetch-wire-articles` Edge Function
A new backend function that:

1. **Fetches RSS feeds** from curated cannabis news sources:
   - Marijuana Moment (`https://www.marijuanamoment.net/feed/`)
   - Leafly News (`https://www.leafly.com/news/feed`)
   - Cannabis Health News (`https://cannabishealthnews.co.uk/feed/`)
   - MJBizDaily (`https://mjbizdaily.com/feed/`)

2. **Parses XML** using DOMParser (available in Deno) to extract articles

3. **Auto-categorises** each article based on keywords:
   - "study", "research", "clinical" --> `research`
   - "blockchain", "NFT", "traceability" --> `blockchain`
   - "market", "regulation", "license", "export" --> `industry`
   - Default --> `news`

4. **Enriches titles** with Healing Buds context where relevant:
   - Appends category tags like "[Research]", "[Industry Update]"
   - Keeps original title intact for authenticity

5. **Deduplicates** by checking if `source_url` already exists in the articles table

6. **Inserts new articles** with:
   - `title`: Original title
   - `slug`: Generated from title
   - `summary`: RSS description (stripped of HTML)
   - `content`: Full summary with source attribution
   - `source_url`: Link to original article
   - `category`: Auto-detected
   - `author`: Source name (e.g., "Marijuana Moment")
   - `published_at`: Original publish date from RSS

### Step 3: Seed initial articles
Insert 8 hand-curated real articles as initial content so The Wire has content immediately.

### Step 4: Update ArticleDetail page
Add a "Read Original Article" link when `source_url` is present, using the existing `readOriginal` i18n translation key.

### Step 5: Add admin trigger (optional)
Add a "Refresh News" button on the admin tools page that calls the edge function to pull latest articles on demand.

## RSS Sources and Keywords

| Source | Feed URL | Focus |
|--------|----------|-------|
| Marijuana Moment | marijuanamoment.net/feed/ | Policy, legislation, research |
| Leafly | leafly.com/news/feed | Strains, patient guides, industry |
| Cannabis Health News | cannabishealthnews.co.uk/feed/ | UK medical cannabis |
| MJBizDaily | mjbizdaily.com/feed/ | Business, market data |

## Keyword Enrichment Strategy

Articles are tagged with Healing Buds-relevant keywords for SEO:
- Medical cannabis, EU-GMP, patient access, cannabis research
- Portugal, regulated cannabis, seed-to-sale traceability
- Dr. Green, NFT, blockchain cannabis

These appear as metadata/tags, not injected into article text (keeps content authentic).

## Technical Details

### New Files
- `supabase/functions/fetch-wire-articles/index.ts` - RSS fetcher and article importer

### Modified Files
- `src/pages/ArticleDetail.tsx` - Add "Read Original Article" link with `source_url`

### Database Changes
- Add `source_url` (text, nullable) to `articles` table
- Insert 8 initial seed articles

### Security
- Edge function uses service role key to insert articles (bypasses RLS)
- No external API keys required (RSS feeds are public)
- Admin-only invocation via authorization header check

