import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

// Minimal Stripe client using the REST API over fetch (no SDK dependency).

export function formEncode(params, prefix = '', out = []) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const k = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      formEncode(value, k, out);
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'object') formEncode(item, `${k}[${i}]`, out);
        else out.push([`${k}[${i}]`, String(item)]);
      });
    } else {
      out.push([k, String(value)]);
    }
  }
  return out;
}

export async function stripeRequest(path, params) {
  const body = new URLSearchParams(formEncode(params)).toString();
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.message || `Stripe error (${res.status})`;
    throw new Error(message);
  }
  return json;
}

// Creates a Stripe Checkout Session for the given order and returns the session.
export async function createCheckoutSession(order) {
  const lineItems = {};
  order.items.forEach((item, i) => {
    lineItems[i] = {
      quantity: item.quantity,
      price_data: {
        currency: config.currency,
        unit_amount: item.unit_price_cents,
        product_data: {
          name: item.product_name,
          description: item.variant_name,
        },
      },
    };
  });

  const params = {
    mode: 'payment',
    success_url: `${config.baseUrl}/order/success?order=${encodeURIComponent(order.number)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.baseUrl}/checkout?cancelled=1&order=${encodeURIComponent(order.number)}`,
    customer_email: order.email || undefined,
    client_reference_id: order.number,
    metadata: { order_number: order.number, order_id: String(order.id) },
    line_items: lineItems,
  };

  if (order.shipping_cents > 0) {
    params.shipping_options = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: order.shipping_cents, currency: config.currency },
          display_name: 'Shipping',
        },
      },
    ];
  }

  return stripeRequest('/v1/checkout/sessions', params);
}

// Verifies the Stripe webhook signature header against the raw request body.
export function verifyWebhook(rawBody, signatureHeader) {
  if (!config.stripeWebhookSecret) return false;
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i), p.slice(i + 1)];
    })
  );
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const computed = createHmac('sha256', config.stripeWebhookSecret).update(signedPayload, 'utf8').digest('hex');

  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
