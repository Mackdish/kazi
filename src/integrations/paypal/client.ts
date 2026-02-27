/**
 * PayPal Payment Integration Handler
 * This file handles payment processing with PayPal
 * 
 * Setup:
 * 1. Install: npm install @paypal/checkout-server-sdk (backend only)
 * 2. Create PayPal developer account and app
 * 3. Add environment variables:
 *    - VITE_PAYPAL_CLIENT_ID
 *    - VITE_PAYPAL_ENVIRONMENT (sandbox/production)
 * 4. Create PayPal webhook endpoint for payment confirmation
 */

// Type definitions for PayPal
type PayPalButtonOptions = {
  createOrder?: (data: unknown, actions: unknown) => Promise<string>;
  onApprove?: (data: unknown, actions: unknown) => Promise<void>;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  style?: {
    layout?: string;
    color?: string;
    shape?: string;
    label?: string;
    height?: number;
  };
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: PayPalButtonOptions) => {
        render: (selector: string) => Promise<void>;
      };
    };
  }
}

export interface PayPalPaymentParams {
  taskId: string;
  depositAmount: number;
  clientId: string;
  clientEmail: string;
  taskTitle: string;
}

/**
 * Load PayPal SDK dynamically
 */
export const loadPayPalSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.paypal) {
      resolve();
      return;
    }

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      console.warn("PayPal client ID not configured");
      reject(new Error("PayPal client ID not configured"));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.head.appendChild(script);
  });
};

/**
 * Create PayPal Order
 * Call this to create an order before payment
 */
export const createPayPalOrder = async (
  params: PayPalPaymentParams
): Promise<string> => {
  try {
    const response = await fetch("/api/payments/paypal/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        depositAmount: params.depositAmount,
        taskId: params.taskId,
        clientId: params.clientId,
        clientEmail: params.clientEmail,
        taskTitle: params.taskTitle,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create PayPal order");
    }

    const { orderId } = await response.json();
    return orderId;
  } catch (error) {
    console.error("PayPal order creation error:", error);
    throw error;
  }
};

/**
 * Capture PayPal Order (completes payment)
 */
export const capturePayPalOrder = async (
  orderId: string
): Promise<{ id: string; status: string }> => {
  try {
    const response = await fetch("/api/payments/paypal/capture-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to capture PayPal order");
    }

    const data = await response.json();
    return { id: data.id, status: data.status };
  } catch (error) {
    console.error("PayPal order capture error:", error);
    throw error;
  }
};

/**
 * Create PayPal Button Component Options
 */
export const createPayPalButtonOptions = (
  params: PayPalPaymentParams,
  onSuccess: (orderId: string) => Promise<void>,
  onError: (error: Error) => void
): PayPalButtonOptions => {
  return {
    createOrder: async () => {
      return await createPayPalOrder(params);
    },
    onApprove: async (data: any) => {
      try {
        const { id, status } = await capturePayPalOrder(data.orderID);
        if (status === "COMPLETED") {
          await onSuccess(id);
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    onError: (error: Error) => {
      onError(error);
    },
    onCancel: () => {
      console.log("PayPal payment cancelled");
    },
    style: {
      layout: "vertical",
      color: "blue",
      shape: "rect",
      label: "pay",
      height: 45,
    },
  };
};

/**
 * Backend Endpoint to Create Order
 * POST /api/payments/paypal/create-order
 * 
 * Handler pseudocode (Node.js with PayPal SDK):
 * 
 * async (req, res) => {
 *   const { depositAmount, taskId, clientId, taskTitle } = req.body;
 *   
 *   const request = new paypal.orders.OrdersCreateRequest();
 *   request.prefer("return=representation");
 *   request.requestBody({
 *     intent: "CAPTURE",
 *     purchase_units: [
 *       {
 *         amount: {
 *           currency_code: "USD",
 *           value: depositAmount.toString(),
 *         },
 *         description: `50% Deposit for: ${taskTitle}`,
 *         custom_id: taskId,
 *       },
 *     ],
 *     application_context: {
 *       return_url: "https://yourdomain.com/dashboard/client",
 *       cancel_url: "https://yourdomain.com/post-task",
 *     },
 *   });
 *   
 *   try {
 *     const order = await client.execute(request);
 *     
 *     // Store order ID in database for tracking
 *     await supabase
 *       .from('task_deposits')
 *       .update({
 *         external_reference: order.result.id,
 *         payment_status: 'processing',
 *       })
 *       .eq('task_id', taskId);
 *     
 *     res.json({ orderId: order.result.id });
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * }
 */

/**
 * Backend Endpoint to Capture Order
 * POST /api/payments/paypal/capture-order
 * 
 * Handler pseudocode:
 * 
 * async (req, res) => {
 *   const { orderId } = req.body;
 *   
 *   const request = new paypal.orders.OrdersCaptureRequest(orderId);
 *   request.requestBody({});
 *   
 *   try {
 *     const capture = await client.execute(request);
 *     
 *     // Find task by order ID
 *     const { data: deposits } = await supabase
 *       .from('task_deposits')
 *       .select('task_id')
 *       .eq('external_reference', orderId);
 *     
 *     if (deposits?.length === 1) {
 *       // Confirm payment
 *       await supabase.rpc('confirm_deposit_payment', {
 *         _task_id: deposits[0].task_id,
 *         _external_reference: capture.result.id,
 *       });
 *     }
 *     
 *     res.json({
 *       id: capture.result.id,
 *       status: capture.result.status,
 *     });
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * }
 */

/**
 * Webhook Handler for PayPal
 * POST /api/webhooks/paypal
 * 
 * Handler pseudocode:
 * 
 * async (req, res) => {
 *   const event = req.body;
 *   
 *   // Verify webhook signature
 *   const isValid = await verifyPayPalWebhookSignature(event, req.headers);
 *   if (!isValid) {
 *     res.status(401).json({ error: 'Invalid signature' });
 *     return;
 *   }
 *   
 *   if (event.event_type === 'CHECKOUT.ORDER.COMPLETED') {
 *     const { id: orderId } = event.resource;
 *     
 *     // Find deposit by order ID
 *     const { data: deposits } = await supabase
 *       .from('task_deposits')
 *       .select('task_id')
 *       .eq('external_reference', orderId);
 *     
 *     if (deposits?.length === 1) {
 *       // Confirm payment
 *       await supabase.rpc('confirm_deposit_payment', {
 *         _task_id: deposits[0].task_id,
 *         _external_reference: event.id,
 *       });
 *     }
 *   }
 *   
 *   res.json({ status: 'success' });
 * }
 */

/**
 * Helper to verify PayPal webhook signature
 */
export const verifyPayPalWebhookSignature = async (
  event: unknown,
  headers: Record<string, string>
): Promise<boolean> => {
  try {
    const response = await fetch(
      "https://api.paypal.com/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getPayPalAccessToken()}`,
        },
        body: JSON.stringify({
          transmission_id: headers["paypal-transmission-id"],
          transmission_time: headers["paypal-transmission-time"],
          cert_url: headers["paypal-cert-url"],
          auth_algo: headers["paypal-auth-algo"],
          transmission_sig: headers["paypal-transmission-sig"],
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: event,
        }),
      }
    );

    const result = await response.json();
    return result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("PayPal signature verification error:", error);
    return false;
  }
};

/**
 * Get PayPal Access Token (backend helper)
 */
export const getPayPalAccessToken = async (): Promise<string> => {
  try {
    const auth = btoa(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    );

    const response = await fetch(
      "https://api.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      }
    );

    const { access_token } = await response.json();
    return access_token;
  } catch (error) {
    console.error("PayPal access token error:", error);
    throw error;
  }
};
