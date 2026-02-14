

## Add Image Preview Before Publish to Both Generators

### Overview
Currently, both image generators (Article and Strain/Product) immediately save generated images to storage and update the database. This change adds a preview step so admins can see the AI-generated image first and choose to approve or regenerate before publishing.

### How It Works

The flow changes from:
```text
Generate --> Save to Storage + Update DB (automatic)
```
to:
```text
Generate --> Preview Image --> [Approve] --> Save to Storage + Update DB
                           --> [Regenerate] --> Generate again
                           --> [Reject/Skip] --> Discard
```

### Changes Required

**1. Update `generate-article-image` Edge Function**
- Add a `previewOnly` boolean parameter
- When `previewOnly: true`: generate the image via AI but return the raw base64 data instead of uploading to storage or updating the database
- When `previewOnly: false` (or absent): keep existing behavior (upload + save)
- This allows the frontend to call it twice: once for preview, once for publish

**2. Update `generate-product-image` Edge Function**
- Same pattern: add `previewOnly` parameter
- When true, skip storage upload and DB insert, just return the base64 image data
- When false, proceed as normal

**3. Redesign `ArticleImageGenerator.tsx` Component**
- Change the generate flow to a two-step process:
  - "Generate" calls the edge function with `previewOnly: true`
  - Store the returned base64 image URL in component state per article
  - Show a preview thumbnail next to each article row
  - Add "Publish" and "Regenerate" buttons per article
  - "Publish" calls the edge function again with `previewOnly: false` (full save)
  - "Regenerate" calls preview again to get a new image
- Add an image preview column to the table
- "Generate All" becomes "Preview All" which generates previews for all, then a "Publish All" button saves them

**4. Redesign `BatchImageGenerator.tsx` Component**
- After generation completes, show a grid of preview thumbnails for each strain
- Each result card shows the generated image with "Publish" and "Regenerate" buttons
- Add a "Publish All" button to save all approved images at once
- Results grid uses image cards instead of simple text rows

### Technical Details

- Base64 image data is stored temporarily in React state (not in the database) during preview
- The base64 data URI (`data:image/png;base64,...`) is used directly as `<img src>` for previews
- On "Publish", the same base64 data is sent back to the edge function along with metadata, which then uploads to storage and updates the DB
- To avoid re-generating on publish, the edge function will accept an optional `imageBase64` parameter -- if provided, it skips AI generation and just uploads the provided image
- Preview images are discarded if the user navigates away without publishing (no persistence needed)

### Files Modified
- `supabase/functions/generate-article-image/index.ts` -- add `previewOnly` and `imageBase64` params
- `supabase/functions/generate-product-image/index.ts` -- add `previewOnly` and `imageBase64` params
- `src/components/admin/ArticleImageGenerator.tsx` -- preview UI with thumbnails, approve/regenerate
- `src/components/admin/BatchImageGenerator.tsx` -- preview grid with thumbnails, approve/regenerate

