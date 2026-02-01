import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, CreditCard, CheckCircle2, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Header from '@/layout/Header';
import Footer from '@/components/Footer';
import { useShop } from '@/context/ShopContext';
import { EligibilityGate } from '@/components/shop/EligibilityGate';
import { ShippingAddressForm, type ShippingAddress } from '@/components/shop/ShippingAddressForm';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useDrGreenApi } from '@/hooks/useDrGreenApi';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { formatPrice, getCurrencyForCountry } from '@/lib/currency';

// Retry utility with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<{ data: T | null; error: string | null }>,
  operationName: string,
  maxRetries: number = 3
): Promise<{ data: T | null; error: string | null }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await operation();
    if (!result.error) return result;
    
    // Don't retry on client errors (400-level validation issues)
    if (result.error.includes('400') || result.error.includes('validation') || result.error.includes('required')) {
      console.warn(`${operationName}: Non-retryable error`, result.error);
      return result;
    }
    
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
      console.log(`${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return { data: null, error: `${operationName} failed after ${maxRetries} attempts` };
}

const Checkout = () => {
  const { cart, cartTotal, cartTotalConverted, clearCart, drGreenClient, countryCode, convertFromEUR } = useShop();
  const navigate = useNavigate();
  const { t } = useTranslation('shop');
  const { toast } = useToast();
  const { createPayment, getPayment, addToCart, emptyCart, placeOrder, createOrder, getClientDetails } = useDrGreenApi();
  const { saveOrder } = useOrderTracking();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  
  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [needsShippingAddress, setNeedsShippingAddress] = useState(false);

  // Fetch client details to check for shipping address
  useEffect(() => {
    const checkShippingAddress = async () => {
      if (!drGreenClient?.drgreen_client_id) {
        setIsLoadingAddress(false);
        return;
      }

      try {
        const result = await getClientDetails(drGreenClient.drgreen_client_id);
        
        if (result.data?.shipping && result.data.shipping.address1) {
          setShippingAddress(result.data.shipping);
          setNeedsShippingAddress(false);
        } else {
          setNeedsShippingAddress(true);
        }
      } catch (error) {
        console.error('Failed to fetch client details:', error);
        // Assume address is needed if we can't verify
        setNeedsShippingAddress(true);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    checkShippingAddress();
  }, [drGreenClient, getClientDetails]);

  const handleShippingAddressSaved = (address: ShippingAddress) => {
    setShippingAddress(address);
    setNeedsShippingAddress(false);
    toast({
      title: 'Shipping Address Saved',
      description: 'You can now proceed with your order.',
    });
  };

  const handlePlaceOrder = async () => {
    if (!drGreenClient || cart.length === 0) return;

    setIsProcessing(true);
    setPaymentStatus('Preparing order...');

    try {
      const clientId = drGreenClient.drgreen_client_id;
      let createdOrderId: string | undefined;

      // Try cart-based flow first, with fallback to direct order creation
      try {
        // Step 1: Empty existing Dr. Green cart to ensure clean state
        setPaymentStatus('Clearing cart...');
        const emptyResult = await retryOperation(
          () => emptyCart(clientId),
          'Empty cart',
          2 // Fewer retries since cart may not exist
        );
        // Empty cart may return 404/502 if cart doesn't exist - that's OK
        if (emptyResult.error && !emptyResult.error.includes('404') && !emptyResult.error.includes('not found') && !emptyResult.error.includes('Cart not found')) {
          console.warn('Cart empty warning:', emptyResult.error);
        }

        // Step 2: Add each item to Dr. Green server-side cart with retry logic
        setPaymentStatus('Syncing cart items...');
        let cartSyncFailed = false;
        for (const item of cart) {
          const cartResult = await retryOperation(
            () => addToCart({
              clientId: clientId,
              strainId: item.strain_id,
              quantity: item.quantity,
            }),
            `Add ${item.strain_name} to cart`
          );

          if (cartResult.error) {
            console.error('Cart sync failed for item:', item.strain_name, cartResult.error);
            cartSyncFailed = true;
            break;
          }
        }

        // Step 3: Create order from server-side cart (if cart sync succeeded)
        if (!cartSyncFailed) {
          setPaymentStatus('Creating order...');
          const orderResult = await retryOperation(
            () => placeOrder({ clientId }),
            'Place order'
          );

          if (!orderResult.error && orderResult.data?.orderId) {
            createdOrderId = orderResult.data.orderId;
          } else {
            console.warn('Cart-based order failed:', orderResult.error);
            // Will fall through to direct order creation
          }
        }
      } catch (cartFlowError) {
        console.warn('Cart flow exception, trying direct order:', cartFlowError);
      }

      // Fallback: Try direct order creation with items if cart flow failed
      if (!createdOrderId) {
        setPaymentStatus('Creating order directly...');
        console.log('Attempting direct order creation with items...');
        
        const directOrderResult = await retryOperation(
          () => createOrder({
            clientId: clientId,
            items: cart.map(item => ({
              productId: item.strain_id,
              quantity: item.quantity,
              price: item.unit_price,
            })),
          }),
          'Direct order creation'
        );

        if (directOrderResult.error || !directOrderResult.data?.orderId) {
          throw new Error(directOrderResult.error || 'Failed to create order via both cart and direct methods');
        }
        
        createdOrderId = directOrderResult.data.orderId;
      }

      setPaymentStatus('Initiating payment...');

      // Step 4: Create payment via Dr Green API
      const clientCountry = drGreenClient.country_code || countryCode || 'PT';
      const paymentResult = await retryOperation(
        () => createPayment({
          orderId: createdOrderId!,
          amount: cartTotal,
          currency: getCurrencyForCountry(clientCountry),
          clientId: drGreenClient.drgreen_client_id,
        }),
        'Create payment'
      );

      if (paymentResult.error || !paymentResult.data) {
        throw new Error(paymentResult.error || 'Failed to initiate payment');
      }

      const paymentId = paymentResult.data.paymentId;
      setPaymentStatus('Processing payment...');

      // Step 3: Poll for payment status (simplified - in production would use webhooks)
      let attempts = 0;
      const maxAttempts = 10;
      let finalStatus = 'PENDING';
      let finalPaymentStatus = 'PENDING';
      
      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        const statusResult = await getPayment(paymentId);
        
        if (statusResult.data?.status === 'PAID') {
          finalStatus = 'CONFIRMED';
          finalPaymentStatus = 'PAID';
          break;
        } else if (statusResult.data?.status === 'FAILED' || statusResult.data?.status === 'CANCELLED') {
          throw new Error('Payment was not successful');
        }
        
        attempts++;
      }

      // Save order locally for tracking
      await saveOrder({
        drgreen_order_id: createdOrderId,
        status: finalStatus,
        payment_status: finalPaymentStatus,
        total_amount: cartTotal,
        items: cart.map(item => ({
          strain_id: item.strain_id,
          strain_name: item.strain_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });

      setOrderId(createdOrderId);
      setOrderComplete(true);
      clearCart();
      
      toast({
        title: finalPaymentStatus === 'PAID' ? 'Order Placed Successfully' : 'Order Submitted',
        description: `Your order ${createdOrderId} has been ${finalPaymentStatus === 'PAID' ? 'confirmed' : 'submitted for processing'}.`,
      });
    } catch (error) {
      console.error('Checkout error:', error);
      
      // Parse error message for user-friendly display
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userFriendlyMessage = 'There was an error processing your order. Please try again.';
      let errorTitle = 'Order Failed';
      
      // Handle specific API error messages
      if (errorMessage.includes('Client is not active')) {
        errorTitle = 'Account Not Active';
        userFriendlyMessage = 'Your account is pending verification. Please wait for admin approval or contact support.';
      } else if (errorMessage.includes('Client does not have any item in the cart')) {
        errorTitle = 'Cart Sync Error';
        userFriendlyMessage = 'There was an issue syncing your cart. Please try again or refresh the page.';
      } else if (errorMessage.includes('KYC') || errorMessage.includes('kyc')) {
        errorTitle = 'Verification Required';
        userFriendlyMessage = 'Your identity verification is incomplete. Please complete the KYC process to continue.';
      } else if (errorMessage.includes('stock') || errorMessage.includes('Stock') || errorMessage.includes('availability')) {
        errorTitle = 'Stock Issue';
        userFriendlyMessage = 'Some items in your cart may no longer be available. Please review your cart and try again.';
      } else if (errorMessage.includes('payment') || errorMessage.includes('Payment')) {
        errorTitle = 'Payment Error';
        userFriendlyMessage = 'There was an issue processing your payment. Please try again or use a different payment method.';
      } else if (errorMessage.includes('Failed to add')) {
        errorTitle = 'Cart Error';
        userFriendlyMessage = errorMessage; // Already descriptive from cart sync
      } else if (errorMessage) {
        userFriendlyMessage = errorMessage;
      }
      
      toast({
        title: errorTitle,
        description: userFriendlyMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setPaymentStatus('');
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="pt-12 pb-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-4">
                    Order Confirmed!
                  </h1>
                  <p className="text-muted-foreground mb-2">
                    Thank you for your order. Your order ID is:
                  </p>
                  <p className="text-xl font-mono text-primary mb-8">
                    {orderId}
                  </p>
                  <p className="text-sm text-muted-foreground mb-8">
                    You will receive an email confirmation shortly with tracking information.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" onClick={() => navigate('/shop')}>
                      Continue Shopping
                    </Button>
                    <Button onClick={() => navigate('/orders')}>
                      View Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-12 pb-8 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Your Cart is Empty
                </h2>
                <p className="text-muted-foreground mb-8">
                  Add some products to your cart before checking out.
                </p>
                <Button onClick={() => navigate('/shop')}>
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <EligibilityGate>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              {/* Back button */}
              <Button
                variant="ghost"
                className="mb-6"
                onClick={() => navigate('/shop')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shop
              </Button>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Order Summary */}
                <div className="lg:col-span-2">
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {item.strain_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × {formatPrice(convertFromEUR(item.unit_price), countryCode)}
                            </p>
                          </div>
                          <p className="font-semibold text-foreground">
                            {formatPrice(convertFromEUR(item.quantity * item.unit_price), countryCode)}
                          </p>
                        </div>
                      ))}

                      <Separator />

                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(cartTotalConverted, countryCode)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Section */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Shipping Address Check */}
                  {isLoadingAddress ? (
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                      <CardContent className="pt-6 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Checking shipping address...</span>
                      </CardContent>
                    </Card>
                  ) : needsShippingAddress ? (
                    <div className="space-y-4">
                      <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                        <MapPin className="h-4 w-4" />
                        <AlertTitle>Shipping Address Required</AlertTitle>
                        <AlertDescription>
                          Please add your shipping address before placing an order.
                        </AlertDescription>
                      </Alert>
                      
                      {drGreenClient && (
                        <ShippingAddressForm
                          clientId={drGreenClient.drgreen_client_id}
                          defaultCountry={drGreenClient.country_code || countryCode || 'PT'}
                          onSuccess={handleShippingAddressSaved}
                          submitLabel="Save & Continue"
                        />
                      )}
                    </div>
                  ) : (
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Payment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Shipping info */}
                        <div className="p-4 rounded-lg bg-muted/30">
                          <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Shipping to
                          </p>
                          {shippingAddress ? (
                            <div className="text-sm text-muted-foreground">
                              <p>{shippingAddress.address1}</p>
                              {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                              <p>{shippingAddress.city}, {shippingAddress.postalCode}</p>
                              <p>{shippingAddress.country}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {drGreenClient?.country_code || 'PT'}
                            </p>
                          )}
                        </div>

                        {/* Notice */}
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground">
                            Payment will be processed securely through our payment provider.
                          </p>
                        </div>

                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handlePlaceOrder}
                          disabled={isProcessing || needsShippingAddress}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {paymentStatus || 'Processing...'}
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Place Order - {formatPrice(cartTotal, countryCode)}
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                          By placing this order, you agree to our terms of service and confirm that you are a verified medical patient.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          </EligibilityGate>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
