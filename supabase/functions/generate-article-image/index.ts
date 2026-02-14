import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const categoryPrompts: Record<string, string> = {
  industry: "Professional editorial photograph of a modern cannabis industry facility. Show a clean, well-lit commercial dispensary or cultivation warehouse with professional staff in lab coats. Business-oriented, corporate feel with warm lighting. No text overlays. 16:9 aspect ratio. Ultra high resolution.",
  research: "Professional editorial photograph of a cannabis research laboratory. Show microscopes, glass vials with terpene extracts, scientific equipment, and researchers in white coats examining cannabis samples. Clinical, modern, and professional. No text overlays. 16:9 aspect ratio. Ultra high resolution.",
  blockchain: "Professional editorial photograph representing cannabis supply chain technology. Show a modern warehouse with digital tracking screens, QR codes on cannabis packaging, and supply chain logistics. Tech-forward and professional. No text overlays. 16:9 aspect ratio. Ultra high resolution.",
  regulation: "Professional editorial photograph of a government regulatory office setting related to cannabis policy. Show official documents, stamps, and a professional meeting environment. Clean, institutional, and authoritative. No text overlays. 16:9 aspect ratio. Ultra high resolution.",
  medical: "Professional editorial photograph of a compassionate medical cannabis consultation. Show a caring clinician in a modern clinic speaking with a patient, medical charts, cannabis-based medicine packaging, and a warm, reassuring clinical environment. Professional healthcare setting with soft natural lighting. No text overlays. 16:9 aspect ratio. Ultra high resolution.",
};

function buildPrompt(title: string, category: string): string {
  const base = categoryPrompts[category] || categoryPrompts.industry;
  return `${base} This image is for an article titled: "${title}". Make it editorially relevant to the topic. Photorealistic, magazine-quality photography.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, title, category, slug } = await req.json();

    if (!articleId || !title || !slug) {
      return new Response(
        JSON.stringify({ error: "articleId, title, and slug are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing required environment configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const prompt = buildPrompt(title, category || "industry");

    console.log(`Generating article image for: "${title}" [${category}]`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      const status = aiResponse.status === 429 ? 429 : aiResponse.status === 402 ? 402 : 500;
      return new Response(
        JSON.stringify({ error: status === 429 ? "Rate limit exceeded" : status === 402 ? "Payment required" : "AI generation failed" }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in response");
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload to storage
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const filename = `articles/${slug}.png`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filename, imageBuffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filename);

    const imageUrl = publicUrlData.publicUrl;

    // Update article
    const { error: updateError } = await supabase
      .from("articles")
      .update({ featured_image: imageUrl })
      .eq("id", articleId);

    if (updateError) {
      console.error("DB update error:", updateError);
    }

    console.log(`Image generated and saved: ${imageUrl}`);

    return new Response(
      JSON.stringify({ success: true, imageUrl, articleId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
