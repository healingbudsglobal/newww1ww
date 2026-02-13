import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DRGREEN_API_URL = "https://api.drgreennft.com/api/v1";
const S3_BASE = 'https://prod-profiles-backend.s3.amazonaws.com/';

/**
 * Check if a string is valid Base64
 */
function isBase64(str: string): boolean {
  if (!str || str.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(str);
}

/**
 * Decode Base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sign query string using HMAC-SHA256 (matching drgreen-proxy)
 * Uses decoded key bytes if the key is Base64-encoded
 */
async function signQueryString(queryString: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Use decoded key bytes if key is Base64-encoded
  let keyBytes: Uint8Array;
  if (isBase64(secretKey)) {
    try {
      keyBytes = base64ToBytes(secretKey);
    } catch {
      keyBytes = encoder.encode(secretKey);
    }
  } else {
    keyBytes = encoder.encode(secretKey);
  }
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Sign the query string
  const queryData = encoder.encode(queryString);
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, queryData);
  
  // Convert ArrayBuffer to base64 string
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binary += String.fromCharCode(signatureBytes[i]);
  }
  return btoa(binary);
}

/**
 * Make authenticated GET request to Dr Green API with query string signing
 */
async function drGreenRequestQuery(
  endpoint: string,
  queryParams: Record<string, string | number>
): Promise<Response> {
  const apiKey = Deno.env.get("DRGREEN_API_KEY");
  const secretKey = Deno.env.get("DRGREEN_PRIVATE_KEY");
  
  if (!apiKey || !secretKey) {
    throw new Error("Dr Green API credentials not configured");
  }
  
  // Build query string exactly like WordPress: http_build_query
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    params.append(key, String(value));
  }
  const queryString = params.toString();
  
  // Sign the query string (not the body)
  const signature = await signQueryString(queryString, secretKey);
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-auth-apikey": apiKey,
    "x-auth-signature": signature,
  };
  
  const url = `${DRGREEN_API_URL}${endpoint}?${queryString}`;
  console.log(`[DrGreen API - Sync] GET ${url}`);
  console.log(`[DrGreen API] Query for signing: ${queryString}`);
  
  return fetch(url, {
    method: "GET",
    headers,
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Starting strain sync from Dr Green API...");
    
    // Parse request body for optional parameters
    let countryCodes = ['PRT'];
    let take = 100;
    let page = 1;
    let multiCountry = false;
    let skipIfFreshHours = 0;
    
    try {
      const body = await req.json();
      if (body.multiCountry) {
        multiCountry = true;
        countryCodes = ['ZAF', 'PRT', 'GBR', 'THA'];
      } else if (body.countryCode) {
        countryCodes = [body.countryCode];
      }
      if (body.take) take = body.take;
      if (body.page) page = body.page;
      if (body.skipIfFreshHours) skipIfFreshHours = body.skipIfFreshHours;
    } catch {
      // No body or invalid JSON, use defaults
    }
    
    // Freshness check: skip sync if data is recent enough
    if (skipIfFreshHours > 0) {
      const cutoff = new Date(Date.now() - skipIfFreshHours * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('strains')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', cutoff);
      
      if ((count ?? 0) > 0) {
        console.log(`[Sync] ${count} strains updated within ${skipIfFreshHours}h, skipping sync`);
        return new Response(
          JSON.stringify({ success: true, message: 'Strains are fresh, sync skipped', skipped: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    let totalSynced = 0;
    let totalErrors = 0;
    let totalStrains = 0;
    
    for (const countryCode of countryCodes) {
      console.log(`\n--- Syncing strains for ${countryCode} ---`);
      
      // Fetch strains from Dr Green API using query string signing
      const queryParams: Record<string, string | number> = {
        orderBy: 'desc',
        take: take,
        page: page,
      };
      
      let response = await drGreenRequestQuery("/strains", { ...queryParams, countryCode });
      
      if (!response.ok) {
        console.log(`Country-specific request failed for ${countryCode}, trying global catalog...`);
        response = await drGreenRequestQuery("/strains", queryParams);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Dr Green API error for ${countryCode}:`, response.status, errorText);
        totalErrors++;
        continue;
      }
      
      const data = await response.json();
      const strains = data?.data?.strains || [];
      console.log(`Received ${strains.length} strains for ${countryCode}`);
      if (strains.length === 0) {
        console.log(`No strains returned for ${countryCode}`);
        continue;
      }
      
      let syncedCount = 0;
      let errorCount = 0;
      
      for (const strain of strains) {
        try {
          // Build full image URL
          let imageUrl = null;
          if (strain.imageUrl) {
            imageUrl = strain.imageUrl.startsWith('http') 
              ? strain.imageUrl 
              : `${S3_BASE}${strain.imageUrl}`;
          } else if (strain.image) {
            imageUrl = strain.image.startsWith('http')
              ? strain.image
              : `${S3_BASE}${strain.image}`;
          }
          
          // Parse effects/feelings
          let feelings: string[] = [];
          if (Array.isArray(strain.feelings)) {
            feelings = strain.feelings;
          } else if (typeof strain.feelings === 'string') {
            feelings = strain.feelings.split(',').map((s: string) => s.trim());
          } else if (Array.isArray(strain.effects)) {
            feelings = strain.effects;
          }
          
          // Parse flavors
          let flavors: string[] = [];
          if (Array.isArray(strain.flavour)) {
            flavors = strain.flavour;
          } else if (typeof strain.flavour === 'string') {
            flavors = strain.flavour.split(',').map((s: string) => s.trim());
          } else if (Array.isArray(strain.flavors)) {
            flavors = strain.flavors;
          }
          
          // Parse helps_with
          let helpsWith: string[] = [];
          if (Array.isArray(strain.helpsWith)) {
            helpsWith = strain.helpsWith;
          } else if (typeof strain.helpsWith === 'string') {
            helpsWith = strain.helpsWith.split(',').map((s: string) => s.trim());
          }
          
          const location = strain.strainLocations?.[0];
          const isAvailable = location?.isAvailable ?? strain.isAvailable ?? strain.availability ?? true;
          const stock = location?.stockQuantity ?? strain.stock ?? strain.stockQuantity ?? 100;
          
          const retailPrice = 
            parseFloat(strain.retailPrice) || 
            parseFloat(strain.pricePerGram) || 
            parseFloat(strain.price) || 
            parseFloat(location?.retailPrice) ||
            0;
          
          const thcContent = 
            parseFloat(strain.thc) || 
            parseFloat(strain.thcContent) || 
            parseFloat(strain.THC) ||
            0;
          const cbdContent = 
            parseFloat(strain.cbd) || 
            parseFloat(strain.cbdContent) || 
            parseFloat(strain.CBD) ||
            0;
          const cbgContent =
            parseFloat(strain.cbg) ||
            parseFloat(strain.cbgContent) ||
            0;
          
          const strainData = {
            id: strain.id,
            sku: strain.batchNumber || strain.sku || strain.id,
            name: strain.name,
            description: strain.description || '',
            type: strain.category || strain.type || 'Hybrid',
            thc_content: thcContent,
            cbd_content: cbdContent,
            cbg_content: cbgContent,
            retail_price: retailPrice,
            availability: isAvailable,
            stock: stock,
            image_url: imageUrl,
            feelings: feelings,
            flavors: flavors,
            helps_with: helpsWith,
            brand_name: strain.brandName || 'Dr. Green',
            is_archived: false,
            updated_at: new Date().toISOString(),
          };
          
          const { error: upsertError } = await supabase
            .from('strains')
            .upsert(strainData, { onConflict: 'id' });
          
          if (upsertError) {
            console.error(`Error upserting strain ${strain.name}:`, upsertError);
            errorCount++;
          } else {
            syncedCount++;
          }
        } catch (strainError) {
          console.error(`Error processing strain ${strain.name}:`, strainError);
          errorCount++;
        }
      }
      
      console.log(`[${countryCode}] Synced ${syncedCount}, errors ${errorCount}`);
      totalSynced += syncedCount;
      totalErrors += errorCount;
      totalStrains += strains.length;
    }
    
    console.log(`\nSync complete: ${totalSynced} synced, ${totalErrors} errors across ${countryCodes.length} countries`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${totalSynced} strains from Dr Green API`,
        synced: totalSynced,
        errors: totalErrors,
        total: totalStrains,
        countries: countryCodes,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Sync strains error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
