import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use production API
const DRGREEN_API_URL = "https://api.drgreennft.com/api/v1";

// Sign payload using the private key
async function signPayload(payload: string, privateKey: string): Promise<string> {
  try {
    // Import the private key for signing
    const privateKeyBuffer = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, data);
    return base64Encode(signature);
  } catch (error: unknown) {
    // Fallback to SHA-256 hash if RSA signing fails
    console.log("RSA signing failed, using fallback:", error);
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + privateKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return base64Encode(hashBuffer);
  }
}

// Make authenticated request to Dr Green Dapp API
async function drGreenRequest(
  endpoint: string,
  method: string,
  body?: object
): Promise<Response> {
  const apiKey = Deno.env.get("DRGREEN_API_KEY");
  const privateKey = Deno.env.get("DRGREEN_PRIVATE_KEY");
  
  if (!apiKey || !privateKey) {
    throw new Error("Dr Green API credentials not configured");
  }
  
  const payload = body ? JSON.stringify(body) : "";
  const signature = await signPayload(payload, privateKey);
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-auth-apikey": apiKey,
    "x-auth-signature": signature,
  };
  
  const url = `${DRGREEN_API_URL}${endpoint}`;
  console.log(`Dr Green API request: ${method} ${url}`);
  
  const response = await fetch(url, {
    method,
    headers,
    body: payload || undefined,
  });
  
  return response;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Remove "drgreen-proxy" from path
    const apiPath = pathParts.slice(1).join("/");
    
    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        body = await req.json();
      } catch {
        body = undefined;
      }
    }
    
    // Route handling
    const action = body?.action || apiPath;
    
    console.log(`Processing action: ${action}`, { method: req.method, body });
    
    let response: Response;
    
    switch (action) {
      // ==========================================
      // DAPP ADMIN ENDPOINTS
      // ==========================================
      
      // Dashboard Summary
      case "dashboard-summary": {
        response = await drGreenRequest("/dapp/dashboard/summary", "GET");
        break;
      }
      
      // Dashboard Analytics
      case "dashboard-analytics": {
        const { startDate, endDate, filterBy, orderBy } = body || {};
        let queryParams = `?orderBy=${orderBy || 'asc'}`;
        if (startDate) queryParams += `&startDate=${startDate}`;
        if (endDate) queryParams += `&endDate=${endDate}`;
        if (filterBy) queryParams += `&filterBy=${filterBy}`;
        response = await drGreenRequest(`/dapp/dashboard/analytics${queryParams}`, "GET");
        break;
      }
      
      // Sales Summary
      case "sales-summary": {
        response = await drGreenRequest("/dapp/sales/summary", "GET");
        break;
      }
      
      // Get All Dapp Clients (paginated)
      case "dapp-clients": {
        const { page, take, orderBy, search, searchBy, status, kyc, adminApproval } = body || {};
        let queryParams = `?orderBy=${orderBy || 'desc'}&take=${take || 10}&page=${page || 1}`;
        if (search) queryParams += `&search=${encodeURIComponent(search)}`;
        if (searchBy) queryParams += `&searchBy=${searchBy}`;
        if (status) queryParams += `&status=${status}`;
        if (kyc) queryParams += `&kyc=${kyc}`;
        if (adminApproval) queryParams += `&adminApproval=${adminApproval}`;
        response = await drGreenRequest(`/dapp/clients${queryParams}`, "GET");
        break;
      }
      
      // Get Client Details
      case "dapp-client-details": {
        const { clientId } = body || {};
        if (!clientId) throw new Error("clientId is required");
        response = await drGreenRequest(`/dapp/clients/${clientId}`, "GET");
        break;
      }
      
      // Verify/Reject Client
      case "dapp-verify-client": {
        const { clientId, action: verifyAction } = body || {};
        if (!clientId || !verifyAction) throw new Error("clientId and action are required");
        response = await drGreenRequest(`/dapp/clients/${clientId}/${verifyAction}`, "PATCH");
        break;
      }
      
      // Get All Dapp Orders
      case "dapp-orders": {
        const { page, take, orderBy, search, searchBy, adminApproval, clientIds } = body || {};
        let queryParams = `?orderBy=${orderBy || 'desc'}&take=${take || 10}&page=${page || 1}`;
        if (search) queryParams += `&search=${encodeURIComponent(search)}`;
        if (searchBy) queryParams += `&searchBy=${searchBy}`;
        if (adminApproval) queryParams += `&adminApproval=${adminApproval}`;
        if (clientIds) queryParams += `&clientIds=${JSON.stringify(clientIds)}`;
        response = await drGreenRequest(`/dapp/orders${queryParams}`, "GET");
        break;
      }
      
      // Get Order Details
      case "dapp-order-details": {
        const { orderId } = body || {};
        if (!orderId) throw new Error("orderId is required");
        response = await drGreenRequest(`/dapp/orders/${orderId}`, "GET");
        break;
      }
      
      // Update Order Status
      case "dapp-update-order": {
        const { orderId, orderStatus, paymentStatus } = body || {};
        if (!orderId) throw new Error("orderId is required");
        response = await drGreenRequest(`/dapp/orders/${orderId}`, "PATCH", { orderStatus, paymentStatus });
        break;
      }
      
      // Get All Carts
      case "dapp-carts": {
        const { page, take, orderBy, search, searchBy } = body || {};
        let queryParams = `?orderBy=${orderBy || 'desc'}&take=${take || 10}&page=${page || 1}`;
        if (search) queryParams += `&search=${encodeURIComponent(search)}`;
        if (searchBy) queryParams += `&searchBy=${searchBy}`;
        response = await drGreenRequest(`/dapp/carts${queryParams}`, "GET");
        break;
      }
      
      // Get NFTs
      case "dapp-nfts": {
        response = await drGreenRequest("/dapp/users/nfts", "GET");
        break;
      }
      
      // Dapp Strains by Country
      case "dapp-strains": {
        const { countryCode, orderBy, search, searchBy } = body || {};
        let queryParams = `?orderBy=${orderBy || 'desc'}`;
        if (countryCode) queryParams += `&countryCode=${countryCode}`;
        if (search) queryParams += `&search=${encodeURIComponent(search)}`;
        if (searchBy) queryParams += `&searchBy=${searchBy}`;
        response = await drGreenRequest(`/dapp/strains${queryParams}`, "GET");
        break;
      }
      
      // Verified Clients List (for products dropdown)
      case "dapp-clients-list": {
        const { orderBy, status, kyc } = body || {};
        let queryParams = `?orderBy=${orderBy || 'desc'}`;
        if (status) queryParams += `&status=${status}`;
        if (kyc) queryParams += `&kyc=${kyc}`;
        response = await drGreenRequest(`/dapp/clients/list${queryParams}`, "GET");
        break;
      }
      
      // ==========================================
      // EXISTING CLIENT/SHOP ENDPOINTS
      // ==========================================
      
      // Client operations
      case "create-client": {
        response = await drGreenRequest("/dapp/clients", "POST", body.data);
        break;
      }
      
      case "get-client": {
        response = await drGreenRequest(`/dapp/clients/${body.clientId}`, "GET");
        break;
      }
      
      case "update-client": {
        response = await drGreenRequest(`/dapp/clients/${body.clientId}`, "PUT", body.data);
        break;
      }
      
      // Strain/Product operations
      case "get-strains": {
        const countryCode = body?.countryCode || "PRT";
        console.log(`Fetching strains for country: ${countryCode}`);
        response = await drGreenRequest(`/dapp/strains?countryCode=${countryCode}`, "GET");
        break;
      }
      
      case "get-all-strains": {
        console.log("Fetching all strains (no country filter)");
        response = await drGreenRequest("/dapp/strains", "GET");
        break;
      }
      
      case "get-strain": {
        response = await drGreenRequest(`/dapp/strains/${body.strainId}`, "GET");
        break;
      }
      
      // Cart operations
      case "create-cart": {
        response = await drGreenRequest("/dapp/carts", "POST", body.data);
        break;
      }
      
      case "update-cart": {
        response = await drGreenRequest(`/dapp/carts/${body.cartId}`, "PUT", body.data);
        break;
      }
      
      case "get-cart": {
        response = await drGreenRequest(`/dapp/carts/${body.cartId}`, "GET");
        break;
      }
      
      // Order operations
      case "create-order": {
        response = await drGreenRequest("/dapp/orders", "POST", body.data);
        break;
      }
      
      case "get-order": {
        response = await drGreenRequest(`/dapp/orders/${body.orderId}`, "GET");
        break;
      }
      
      case "update-order": {
        response = await drGreenRequest(`/dapp/orders/${body.orderId}`, "PATCH", body.data);
        break;
      }
      
      case "get-orders": {
        response = await drGreenRequest(`/dapp/orders?clientId=${body.clientId}`, "GET");
        break;
      }
      
      // Payment operations
      case "create-payment": {
        response = await drGreenRequest("/dapp/payments", "POST", body.data);
        break;
      }
      
      case "get-payment": {
        response = await drGreenRequest(`/dapp/payments/${body.paymentId}`, "GET");
        break;
      }
      
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action", action }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    
    const data = await response.json();
    console.log(`Dr Green API response:`, { status: response.status, data });
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Dr Green proxy error:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
