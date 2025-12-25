/**
 * Dr. Green DAPP API Client
 * 
 * This module handles all Dr. Green API interactions through the Edge Function proxy.
 * It implements the exact signing logic from the WordPress legacy system.
 * 
 * Signing Rules (from WordPress legacy):
 * - Method A (Body Sign): POST, DELETE, and singular GET requests sign the JSON body
 * - Method B (Query Sign): GET list endpoints sign the query string parameters
 */

import { supabase } from '@/integrations/supabase/client';

// Country code conversion (Alpha-2 to Alpha-3 ISO codes)
export const countryCodeMap: Record<string, string> = {
  PT: 'PRT',
  GB: 'GBR',
  ZA: 'ZAF',
  TH: 'THA',
  US: 'USA',
};

// Convert Alpha-2 to Alpha-3 country code
export const toAlpha3 = (code: string): string => countryCodeMap[code] || code;

// Types matching legacy WordPress payload structure
export interface LegacyClientPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phoneCountryCode: string;
  contactNumber: string;
  shipping: {
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    country: string;
    countryCode: string;
    postalCode: string;
  };
  medicalRecord: {
    dob: string; // YYYY-MM-DD format
    gender: string;
    // Medical history fields matching WordPress exactly
    medicalHistory0: boolean; // Heart problems
    medicalHistory1: boolean; // Cancer treatment
    medicalHistory2: boolean; // Immunosuppressants
    medicalHistory3: boolean; // Liver disease
    medicalHistory4: boolean; // Psychiatric history
    medicalHistory5: string[]; // Diagnosed with (default: ["none"])
    medicalHistory6: boolean; // Suicidal history
    medicalHistory7: string[]; // Family conditions (default: ["none"])
    medicalHistory7Relation?: string; // Relation (default: "none")
    medicalHistory8?: boolean; // Reserved (default: false)
    medicalHistory9: boolean; // Alcohol abuse
    medicalHistory10: boolean; // Drug services
    medicalHistory11: string; // Alcohol units (default: "0")
    medicalHistory12: boolean; // Cannabis to reduce meds
    medicalHistory13: string; // How often cannabis (default: "Never")
    medicalHistory14: string[]; // How used cannabis (default: ["never"])
    medicalHistory15?: string; // Reserved (default: "none")
    medicalHistory16?: boolean; // Reserved (default: false)
    // Additional optional fields
    medicalConditions?: string[];
    otherMedicalCondition?: string;
    medicinesTreatments?: string[];
    otherMedicalTreatments?: string;
  };
  clientBusiness?: {
    businessType: string;
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    country: string;
    countryCode: string;
    postalCode: string;
  };
}

export interface CartItem {
  strainId: string;
  quantity: number;
}

export interface AddToCartPayload {
  items: CartItem[];
  clientCartId: string;
}

export interface PlaceOrderPayload {
  clientId: string;
}

export interface DrGreenResponse<T = unknown> {
  data: T | null;
  error: string | null;
  success?: boolean;
  message?: string;
}

export interface ClientResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isKYCVerified: boolean;
  adminApproval: string;
  isActive: boolean;
  clientCart?: Array<{ id: string }>;
  kycLink?: string;
}

export interface StrainResponse {
  id: string;
  name: string;
  description: string;
  type: string;
  thc: string;
  thcContent?: number;
  cbd?: string;
  cbdContent?: number;
  flavour?: string;
  feelings?: string;
  helpsWith?: string;
  imageUrl?: string;
  images?: string[];
  retailPrice: number;
  availability: boolean;
  stock?: number;
}

export interface CartResponse {
  id: string;
  clientId: string;
  items: Array<{
    strainId: string;
    quantity: number;
    strain?: StrainResponse;
  }>;
  totalAmount?: number;
}

export interface OrderResponse {
  id: string;
  clientId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  items: Array<{
    strainId: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
}

/**
 * Call the Dr. Green proxy edge function
 */
async function callProxy<T = unknown>(
  action: string,
  data?: Record<string, unknown>
): Promise<DrGreenResponse<T>> {
  try {
    console.log(`[DrGreen API] Calling action: ${action}`, data);
    
    const { data: response, error } = await supabase.functions.invoke('drgreen-proxy', {
      body: { action, ...data },
    });

    if (error) {
      console.error('[DrGreen API] Error:', error);
      return { data: null, error: error.message, success: false };
    }

    // Handle legacy response format
    if (response?.success === false || response?.success === 'false') {
      return { 
        data: null, 
        error: response.message || 'Request failed', 
        success: false,
        message: response.message 
      };
    }

    return { 
      data: response?.data || response as T, 
      error: null, 
      success: true,
      message: response?.message 
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[DrGreen API] Exception:', err);
    return { data: null, error: message, success: false };
  }
}

// ===========================================
// CLIENT OPERATIONS
// ===========================================

/**
 * Create a new client (patient) - matches WordPress POST /clients/
 * Uses Body Signing (Method A)
 */
export async function createClient(payload: LegacyClientPayload): Promise<DrGreenResponse<ClientResponse>> {
  return callProxy<ClientResponse>('create-client-legacy', { payload });
}

/**
 * Get client details - matches WordPress GET /clients/{clientId}
 * Uses Body Signing (Method A) - signs {"clientId": "..."}
 */
export async function getClient(clientId: string): Promise<DrGreenResponse<ClientResponse>> {
  return callProxy<ClientResponse>('get-client', { clientId });
}

/**
 * Refresh client data (sync KYC status, etc.)
 */
export async function refreshClient(clientId: string): Promise<DrGreenResponse<ClientResponse>> {
  return callProxy<ClientResponse>('get-client', { clientId });
}

// ===========================================
// STRAIN/PRODUCT OPERATIONS  
// ===========================================

/**
 * Get all strains by country - matches WordPress GET /strains?...
 * Uses Query Signing (Method B) - signs "orderBy=desc&take=10&page=1&countryCode=XXX"
 */
export async function getStrains(countryCode: string): Promise<DrGreenResponse<StrainResponse[]>> {
  const alpha3Code = toAlpha3(countryCode);
  return callProxy<StrainResponse[]>('get-strains-legacy', { 
    countryCode: alpha3Code,
    orderBy: 'desc',
    take: 20,
    page: 1
  });
}

/**
 * Get single strain details - matches WordPress GET /strains/{strainId}
 * Uses Body Signing (Method A) - signs {"strainId": "..."}
 */
export async function getStrain(strainId: string): Promise<DrGreenResponse<StrainResponse>> {
  return callProxy<StrainResponse>('get-strain', { strainId });
}

// ===========================================
// CART OPERATIONS
// ===========================================

/**
 * Get cart for client - matches WordPress GET /carts?clientId=...
 * Uses Query Signing (Method B)
 */
export async function getCart(clientId: string): Promise<DrGreenResponse<CartResponse>> {
  return callProxy<CartResponse>('get-cart-legacy', { 
    clientId,
    orderBy: 'desc',
    take: 10,
    page: 1
  });
}

/**
 * Add item to cart - matches WordPress POST /carts
 * Uses Body Signing (Method A)
 */
export async function addToCart(payload: AddToCartPayload): Promise<DrGreenResponse<CartResponse>> {
  return callProxy<CartResponse>('add-to-cart', { data: payload });
}

/**
 * Remove item from cart - matches WordPress DELETE /carts/{basketId}?strainId={strainId}
 * Uses Body Signing (Method A) - signs {"cartId": basketId}
 */
export async function removeFromCart(basketId: string, strainId: string): Promise<DrGreenResponse<CartResponse>> {
  return callProxy<CartResponse>('remove-from-cart', { 
    cartId: basketId, 
    strainId 
  });
}

/**
 * Empty entire cart - matches WordPress DELETE /carts/{basketId}
 * Uses Body Signing (Method A)
 */
export async function emptyCart(basketId: string): Promise<DrGreenResponse<{ success: boolean }>> {
  return callProxy<{ success: boolean }>('empty-cart', { cartId: basketId });
}

// ===========================================
// ORDER OPERATIONS
// ===========================================

/**
 * Place order - matches WordPress POST /orders
 * Uses Body Signing (Method A)
 */
export async function placeOrder(payload: PlaceOrderPayload): Promise<DrGreenResponse<OrderResponse>> {
  return callProxy<OrderResponse>('place-order', { data: payload });
}

/**
 * Get order details - matches WordPress GET /orders/{orderId}
 * Uses Body Signing (Method A) - signs {"orderId": "..."}
 */
export async function getOrder(orderId: string): Promise<DrGreenResponse<OrderResponse>> {
  return callProxy<OrderResponse>('get-order', { orderId });
}

/**
 * Get all orders for client - matches WordPress GET /client/{clientId}/orders
 * Uses Body Signing (Method A) - signs {"clientId": "..."}
 */
export async function getOrders(clientId: string): Promise<DrGreenResponse<OrderResponse[]>> {
  return callProxy<OrderResponse[]>('get-orders', { clientId });
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Parse phone number into components matching WordPress format
 */
export function parsePhoneNumber(fullNumber: string): { 
  phoneCode: string; 
  phoneCountryCode: string; 
  contactNumber: string 
} {
  // Remove all non-digit characters except +
  const cleaned = fullNumber.replace(/[^\d+]/g, '');
  
  // Extract country code (first 1-4 digits after +)
  const match = cleaned.match(/^\+(\d{1,4})(.*)/);
  
  if (match) {
    const prefix = match[1];
    const number = match[2];
    
    // Map common prefixes to country codes
    const prefixToCountry: Record<string, string> = {
      '351': 'PT',
      '44': 'GB',
      '27': 'ZA',
      '66': 'TH',
      '1': 'US',
    };
    
    return {
      phoneCode: `+${prefix}`,
      phoneCountryCode: prefixToCountry[prefix] || 'PT',
      contactNumber: number,
    };
  }
  
  // Default fallback
  return {
    phoneCode: '+351',
    phoneCountryCode: 'PT',
    contactNumber: cleaned.replace(/^\+/, ''),
  };
}

/**
 * Build legacy client payload from form data
 */
export function buildLegacyClientPayload(formData: {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender?: string;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    state?: string;
  };
  business?: {
    isBusiness: boolean;
    businessType?: string;
    businessName?: string;
    businessAddress1?: string;
    businessAddress2?: string;
    businessCity?: string;
    businessState?: string;
    businessCountryCode?: string;
    businessPostalCode?: string;
  };
  medicalHistory: {
    medicalHistory0?: boolean;
    medicalHistory1?: boolean;
    medicalHistory2?: boolean;
    medicalHistory3?: boolean;
    medicalHistory4?: boolean;
    medicalHistory5?: string[];
    medicalHistory6?: boolean;
    medicalHistory7?: string[];
    medicalHistory9?: boolean;
    medicalHistory10?: boolean;
    medicalHistory11?: string;
    medicalHistory12?: boolean;
    medicalHistory13?: string;
    medicalHistory14?: string[];
    medicalConditions?: string[];
    otherMedicalCondition?: string;
    medicinesTreatments?: string[];
    otherMedicalTreatments?: string;
  };
}): LegacyClientPayload {
  const phoneInfo = parsePhoneNumber(formData.personal.phone);
  const countryCode = toAlpha3(formData.address.country);
  
  // Normalize array fields - if contains "none" or "never", reset to only that value
  const normalizeArrayField = (arr: string[] | undefined, defaultValue: string[]): string[] => {
    if (!arr || arr.length === 0) return defaultValue;
    const hasNone = arr.some(v => v.toLowerCase() === 'none' || v.toLowerCase() === 'never');
    return hasNone ? defaultValue : arr.map(v => v.toLowerCase());
  };
  
  const payload: LegacyClientPayload = {
    firstName: formData.personal.firstName,
    lastName: formData.personal.lastName,
    email: formData.personal.email.toLowerCase(),
    phoneCode: phoneInfo.phoneCode,
    phoneCountryCode: phoneInfo.phoneCountryCode,
    contactNumber: phoneInfo.contactNumber,
    shipping: {
      address1: formData.address.street,
      address2: '',
      city: formData.address.city,
      state: formData.address.state || '',
      country: formData.address.country,
      countryCode: countryCode,
      postalCode: formData.address.postalCode,
    },
    medicalRecord: {
      dob: formData.personal.dateOfBirth, // Already in YYYY-MM-DD format
      gender: formData.personal.gender || 'prefer_not_to_say',
      medicalHistory0: formData.medicalHistory.medicalHistory0 ?? false,
      medicalHistory1: formData.medicalHistory.medicalHistory1 ?? false,
      medicalHistory2: formData.medicalHistory.medicalHistory2 ?? false,
      medicalHistory3: formData.medicalHistory.medicalHistory3 ?? false,
      medicalHistory4: formData.medicalHistory.medicalHistory4 ?? false,
      medicalHistory5: normalizeArrayField(formData.medicalHistory.medicalHistory5, ['none']),
      medicalHistory6: formData.medicalHistory.medicalHistory6 ?? false,
      medicalHistory7: normalizeArrayField(formData.medicalHistory.medicalHistory7, ['none']),
      medicalHistory7Relation: 'none',
      medicalHistory8: false,
      medicalHistory9: formData.medicalHistory.medicalHistory9 ?? false,
      medicalHistory10: formData.medicalHistory.medicalHistory10 ?? false,
      medicalHistory11: formData.medicalHistory.medicalHistory11 ?? '0',
      medicalHistory12: formData.medicalHistory.medicalHistory12 ?? false,
      medicalHistory13: formData.medicalHistory.medicalHistory13?.toLowerCase() || 'never',
      medicalHistory14: normalizeArrayField(formData.medicalHistory.medicalHistory14, ['never']),
      medicalHistory15: 'none',
      medicalHistory16: false,
      medicalConditions: formData.medicalHistory.medicalConditions,
      otherMedicalCondition: formData.medicalHistory.otherMedicalCondition,
      medicinesTreatments: formData.medicalHistory.medicinesTreatments,
      otherMedicalTreatments: formData.medicalHistory.otherMedicalTreatments,
    },
  };
  
  // Conditionally add clientBusiness if user selected "I am a business"
  if (formData.business?.isBusiness && formData.business.businessName) {
    const businessCountry = formData.business.businessCountryCode || formData.address.country;
    payload.clientBusiness = {
      businessType: formData.business.businessType || 'other',
      name: formData.business.businessName,
      address1: formData.business.businessAddress1 || '',
      address2: formData.business.businessAddress2 || '',
      city: formData.business.businessCity || '',
      state: formData.business.businessState || '',
      country: businessCountry,
      countryCode: toAlpha3(businessCountry),
      postalCode: formData.business.businessPostalCode || '',
    };
  }
  
  return payload;
}

// Export all functions for use in components
export const drGreenApi = {
  // Client
  createClient,
  getClient,
  refreshClient,
  // Strains
  getStrains,
  getStrain,
  // Cart
  getCart,
  addToCart,
  removeFromCart,
  emptyCart,
  // Orders
  placeOrder,
  getOrder,
  getOrders,
  // Helpers
  parsePhoneNumber,
  buildLegacyClientPayload,
  toAlpha3,
};
