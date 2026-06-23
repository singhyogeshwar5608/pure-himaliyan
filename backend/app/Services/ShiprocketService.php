<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class ShiprocketService
{
    public function isConfigured(): bool
    {
        return filled(config('services.shiprocket.email')) && filled(config('services.shiprocket.password'));
    }

    public function createOrder(Order $order): array
    {
        $nameParts = explode(' ', trim($order->customer_name), 2);
        $firstName = $nameParts[0];
        $lastName = isset($nameParts[1]) && filled($nameParts[1]) ? $nameParts[1] : '.';

        $quantity = max(1, (int) $order->quantity);
        $grandTotal = (float) $order->grand_total;
        $codCharges = (float) ($order->cod_charges ?? 0);
        $shippingAmount = (float) $order->shipping_amount;

        // If COD, the amount to collect is grand_total minus the upfront cod_charges
        $collectableAmount = $order->payment_method === 'cod' 
            ? max(0, $grandTotal - $codCharges) 
            : $grandTotal;

        // Shiprocket sub_total should be the sum of items
        // We calculate unit price from (collectableAmount - shipping)
        $itemTotal = max(0, $collectableAmount - $shippingAmount);
        $unitPrice = round($itemTotal / $quantity, 2);
        $calculatedSubTotal = round($unitPrice * $quantity, 2);

        // Adjust shipping to ensure total matches collectableAmount exactly
        $finalShippingCharges = round($collectableAmount - $calculatedSubTotal, 2);

        $address = trim($order->address_line);
        $billingAddress = mb_substr($address, 0, 90);
        $billingAddress2 = mb_substr($address, 90, 90);

        $payload = [
            'order_id' => 'PH-' . $order->id,
            'order_date' => $order->created_at->format('Y-m-d H:i'),
            'pickup_location' => (string) config('services.shiprocket.pickup_location', 'Primary'),
            'billing_customer_name' => $firstName,
            'billing_last_name' => $lastName,
            'billing_address' => $billingAddress,
            'billing_address_2' => $billingAddress2,
            'billing_city' => $order->city,
            'billing_pincode' => $order->postal_code,
            'billing_state' => $order->state,
            'billing_country' => 'India',
            'billing_email' => $order->customer_email ?: 'no-reply@purehimalyan.com',
            'billing_phone' => $order->customer_phone,
            'shipping_is_billing' => true,
            'shipping_customer_name' => $firstName,
            'shipping_last_name' => $lastName,
            'shipping_address' => $billingAddress,
            'shipping_address_2' => $billingAddress2,
            'shipping_city' => $order->city,
            'shipping_pincode' => $order->postal_code,
            'shipping_country' => 'India',
            'shipping_state' => $order->state,
            'shipping_email' => $order->customer_email ?: 'no-reply@purehimalyan.com',
            'shipping_phone' => $order->customer_phone,
            'order_items' => [
                [
                    'name' => $order->product_name,
                    'sku' => $order->product_slug ?: 'product-'.$order->product_id,
                    'units' => $quantity,
                    'selling_price' => (string) $unitPrice,
                    'tax' => (string) round(((float)$order->gst_amount / $quantity), 2),
                ],
            ],
            'payment_method' => $order->payment_method === 'cod' ? 'COD' : 'Prepaid',
            'shipping_charges' => $finalShippingCharges,
            'giftwrap_charges' => 0,
            'transaction_charges' => 0,
            'total_discount' => '0',
            'sub_total' => (string) $calculatedSubTotal,
            'length' => 0.5,
            'breadth' => 0.5,
            'height' => 0.5,
            'weight' => 0.1,
        ];

        $response = $this->client()
            ->post('/orders/create/adhoc', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Shiprocket order create failed: '.$response->body());
        }

        $data = $response->json();

        if (! is_array($data)) {
            throw new RuntimeException('Shiprocket returned invalid response.');
        }

        return $data;
    }

    public function createOrderSafely(Order $order): array
    {
        try {
            return [
                'ok' => true,
                'data' => $this->createOrder($order),
            ];
        } catch (Throwable $exception) {
            return [
                'ok' => false,
                'error' => $exception->getMessage(),
            ];
        }
    }

    private function client()
    {
        return Http::baseUrl((string) config('services.shiprocket.base_url'))
            ->acceptJson()
            ->asJson()
            ->withToken($this->token());
    }

    private function token(): string
    {
        return Cache::remember('shiprocket_auth_token', now()->addDays(9), function () {
            $response = Http::baseUrl((string) config('services.shiprocket.base_url'))
                ->acceptJson()
                ->asJson()
                ->post('/auth/login', [
                    'email' => (string) config('services.shiprocket.email'),
                    'password' => (string) config('services.shiprocket.password'),
                ]);

            if (! $response->successful()) {
                throw new RuntimeException('Shiprocket auth failed: '.$response->body());
            }

            $token = $response->json('token');

            if (! is_string($token) || $token === '') {
                throw new RuntimeException('Shiprocket auth token missing in response.');
            }

            return $token;
        });
    }
}
