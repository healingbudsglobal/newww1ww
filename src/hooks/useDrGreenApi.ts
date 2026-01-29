import { supabase } from '@/integrations/supabase/client';

interface DrGreenResponse<T = unknown> {
  data: T | null;
  error: string | null;
}

// Country code conversion map (Alpha-2 to Alpha-3)
const countryCodeMap: Record<string, string> = {
  PT: 'PRT',
  GB: 'GBR',
  ZA: 'ZAF',
  TH: 'THA',
  US: 'USA',
};

export function useDrGreenApi() {
  const callProxy = async <T = unknown>(
    action: string,
    data?: Record<string, unknown>
  ): Promise<DrGreenResponse<T>> => {
    try {
      const { data: response, error } = await supabase.functions.invoke('drgreen-proxy', {
        body: { action, ...data },
      });

      if (error) {
        console.error('Dr Green API error:', error);
        return { data: null, error: error.message };
      }

      return { data: response as T, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Dr Green API exception:', err);
      return { data: null, error: message };
    }
  };

  // Create an order with the Dr Green API
  const createOrder = async (orderData: {
    clientId: string;
    items: Array<{
      strainId: string;
      quantity: number;
      unitPrice: number;
    }>;
    shippingAddress?: {
      street: string;
      city: string;
      postalCode: string;
      countryCode: string;
    };
  }) => {
    return callProxy<{
      orderId: string;
      status: string;
      totalAmount: number;
    }>('create-order', { data: orderData });
  };

  // Create a payment for an order
  const createPayment = async (paymentData: {
    orderId: string;
    amount: number;
    currency: string;
    clientId: string;
  }) => {
    return callProxy<{
      paymentId: string;
      status: string;
      paymentUrl?: string;
    }>('create-payment', { data: paymentData });
  };

  // Get payment status
  const getPayment = async (paymentId: string) => {
    return callProxy<{
      paymentId: string;
      status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
      amount: number;
      orderId: string;
    }>('get-payment', { paymentId });
  };

  // Get order details
  const getOrder = async (orderId: string) => {
    return callProxy<{
      orderId: string;
      status: string;
      items: Array<{
        strainId: string;
        quantity: number;
        unitPrice: number;
      }>;
      totalAmount: number;
      paymentStatus: string;
    }>('get-order', { orderId });
  };

  // Update order status (after payment confirmation)
  const updateOrder = async (orderId: string, data: {
    status?: string;
    paymentStatus?: string;
  }) => {
    return callProxy<{
      orderId: string;
      status: string;
      paymentStatus: string;
    }>('update-order', { orderId, data });
  };

  // Get user's orders
  const getOrders = async (clientId: string) => {
    return callProxy<Array<{
      orderId: string;
      status: string;
      totalAmount: number;
      createdAt: string;
      paymentStatus: string;
    }>>('get-orders', { clientId });
  };

  // Get strains by country (client-facing)
  const getStrains = async (countryCode: string) => {
    const alpha3Code = countryCodeMap[countryCode] || countryCode;
    return callProxy<Array<{
      id: string;
      name: string;
      description: string;
      thcContent: number;
      cbdContent: number;
      retailPrice: number;
      availability: boolean;
      images: string[];
    }>>('get-strains', { countryCode: alpha3Code });
  };

  // ==========================================
  // ADMIN / DASHBOARD ENDPOINTS
  // ==========================================
  
  // Get dashboard summary (total clients, orders, sales, etc.)
  const getDashboardSummary = async () => {
    return callProxy<{
      totalClients: number;
      totalOrders: number;
      totalSales: number;
      pendingOrders: number;
      verifiedClients: number;
      pendingClients: number;
    }>('dashboard-summary');
  };

  // Get dashboard analytics
  const getDashboardAnalytics = async (params?: {
    startDate?: string;
    endDate?: string;
    filterBy?: string;
    orderBy?: 'asc' | 'desc';
  }) => {
    return callProxy<{
      salesData: Array<{ date: string; amount: number }>;
      ordersData: Array<{ date: string; count: number }>;
    }>('dashboard-analytics', params);
  };

  // Get sales summary
  const getSalesSummary = async () => {
    return callProxy<{
      totalSales: number;
      monthlySales: number;
      weeklySales: number;
      dailySales: number;
    }>('sales-summary');
  };

  // Get all Dapp clients (paginated)
  const getDappClients = async (params?: {
    page?: number;
    take?: number;
    orderBy?: 'asc' | 'desc';
    search?: string;
    searchBy?: string;
    status?: string;
    kyc?: boolean;
    adminApproval?: string;
  }) => {
    return callProxy<{
      clients: Array<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isKYCVerified: boolean;
        adminApproval: string;
        createdAt: string;
      }>;
      total: number;
      page: number;
      take: number;
    }>('dapp-clients', params);
  };

  // Get client details
  const getDappClientDetails = async (clientId: string) => {
    return callProxy<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      address: object;
      isKYCVerified: boolean;
      adminApproval: string;
      createdAt: string;
      orders: Array<object>;
    }>('dapp-client-details', { clientId });
  };

  // Verify or reject a client
  const verifyDappClient = async (clientId: string, action: 'verify' | 'reject') => {
    return callProxy<{ success: boolean; message: string }>('dapp-verify-client', { clientId, action });
  };

  // Get all Dapp orders (paginated)
  const getDappOrders = async (params?: {
    page?: number;
    take?: number;
    orderBy?: 'asc' | 'desc';
    search?: string;
    searchBy?: string;
    adminApproval?: string;
    clientIds?: string[];
  }) => {
    return callProxy<{
      orders: Array<{
        id: string;
        clientId: string;
        status: string;
        paymentStatus: string;
        totalAmount: number;
        createdAt: string;
        items: Array<object>;
      }>;
      total: number;
      page: number;
      take: number;
    }>('dapp-orders', params);
  };

  // Get order details
  const getDappOrderDetails = async (orderId: string) => {
    return callProxy<{
      id: string;
      clientId: string;
      status: string;
      paymentStatus: string;
      totalAmount: number;
      items: Array<object>;
      shippingAddress: object;
      createdAt: string;
    }>('dapp-order-details', { orderId });
  };

  // Update order status
  const updateDappOrder = async (orderId: string, data: {
    orderStatus?: string;
    paymentStatus?: string;
  }) => {
    return callProxy<{ success: boolean; message: string }>('dapp-update-order', { orderId, ...data });
  };

  // Get Dapp strains by country
  const getDappStrains = async (params?: {
    countryCode?: string;
    orderBy?: 'asc' | 'desc';
    search?: string;
    searchBy?: string;
  }) => {
    return callProxy<{
      strains: Array<{
        id: string;
        name: string;
        thcContent: number;
        cbdContent: number;
        retailPrice: number;
        availability: boolean;
      }>;
    }>('dapp-strains', params);
  };

  // ==========================================
  // NEW ENDPOINTS FROM POSTMAN COLLECTION
  // ==========================================
  
  // Get current authenticated user details from Dr Green
  const getUserMe = async () => {
    return callProxy<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      walletAddress?: string;
      nfts?: Array<{ id: string; tokenId: string; type: string }>;
    }>('get-user-me');
  };

  // Delete a client (admin only)
  const deleteClient = async (clientId: string) => {
    return callProxy<{ success: boolean; message: string }>('delete-client', { clientId });
  };

  // Partial update client details (admin only)
  const patchClient = async (clientId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    status?: string;
  }) => {
    return callProxy<{ success: boolean; client: object }>('patch-client', { clientId, data });
  };

  // Activate a client (admin only)
  const activateClient = async (clientId: string) => {
    return callProxy<{ success: boolean; message: string }>('activate-client', { clientId });
  };

  // Deactivate a client (admin only)
  const deactivateClient = async (clientId: string) => {
    return callProxy<{ success: boolean; message: string }>('deactivate-client', { clientId });
  };

  // Bulk delete clients (admin only, max 50)
  const bulkDeleteClients = async (clientIds: string[]) => {
    return callProxy<{ success: boolean; deleted: number; failed: number }>('bulk-delete-clients', { clientIds });
  };

  // ==========================================
  // NEW ENDPOINTS FROM OFFICIAL DOCUMENTATION
  // ==========================================

  // Pagination metadata type
  interface PageMetaDto {
    page: string;
    take: string;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  }

  // Get client summary (PENDING/VERIFIED/REJECTED counts)
  const getClientsSummary = async () => {
    return callProxy<{
      summary: {
        PENDING: number;
        VERIFIED: number;
        REJECTED: number;
        totalCount: number;
      };
    }>('get-clients-summary');
  };

  // Get sales with optional stage filter
  const getSales = async (params?: {
    stage?: 'LEADS' | 'ONGOING' | 'CLOSED';
    page?: number;
    take?: number;
    orderBy?: 'asc' | 'desc';
    search?: string;
    searchBy?: string;
  }) => {
    return callProxy<{
      sales: Array<{
        id: string;
        stage: string;
        description: string | null;
        orderId: string | null;
        client: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          phoneCountryCode: string;
          phoneCode: string;
          contactNumber: string;
          isActive: boolean;
        };
        createdAt: string;
        updatedAt: string;
      }>;
      pageMetaDto: PageMetaDto;
    }>('get-sales', params);
  };

  // Get sales summary by stage
  const getSalesSummaryNew = async () => {
    return callProxy<{
      summary: {
        ONGOING: number;
        LEADS: number;
        CLOSED: number;
        totalCount: number;
      };
      count: number;
    }>('get-sales-summary');
  };

  // Get orders for a specific client
  const getClientOrders = async (clientId: string, params?: {
    page?: number;
    take?: number;
    orderBy?: 'asc' | 'desc';
  }) => {
    return callProxy<{
      orders: Array<{
        id: string;
        createdAt: string;
        updatedAt: string;
        paymentStatus: string;
        orderStatus: string;
        invoiceNumber: string;
        totalAmount: number;
        totalOrdered: number;
        totalQuantity: number;
        totalPrice: number;
      }>;
      pageMetaDto: PageMetaDto;
    }>('get-client-orders', { clientId, ...params });
  };

  // Get user's owned NFTs
  const getUserNfts = async () => {
    return callProxy<{
      nfts: Array<{
        tokenId: number;
        nftMetadata: {
          nftName: string;
          nftType: string;
          imageUrl: string;
        };
        owner: {
          id: string;
          walletAddress: string;
          fullName: string;
          username: string;
          email: string;
          phoneCountryCode: string | null;
          phoneCode: string | null;
          phoneNumber: string | null;
          profileUrl: string;
          isActive: boolean;
        };
      }>;
      pageMetaDto: PageMetaDto;
    }>('get-user-nfts');
  };

  return {
    // Existing methods
    createOrder,
    createPayment,
    getPayment,
    getOrder,
    updateOrder,
    getOrders,
    getStrains,
    callProxy,
    // Admin methods
    getDashboardSummary,
    getDashboardAnalytics,
    getSalesSummary,
    getDappClients,
    getDappClientDetails,
    verifyDappClient,
    getDappOrders,
    getDappOrderDetails,
    updateDappOrder,
    getDappStrains,
    // New endpoints from Postman collection
    getUserMe,
    deleteClient,
    patchClient,
    activateClient,
    deactivateClient,
    bulkDeleteClients,
    // New endpoints from official documentation
    getClientsSummary,
    getSales,
    getSalesSummaryNew,
    getClientOrders,
    getUserNfts,
  };
}
