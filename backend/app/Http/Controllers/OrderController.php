<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\ReferralCode;
use App\Models\User;
use App\Services\AffiliateWalletService;
use App\Support\ReferralPricing;
use App\Services\ShiprocketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with('referralOwner:id,name,email,role,phone')
            ->latest()
            ->get();

        $codesForLegacy = $orders
            ->filter(fn (Order $order) => $order->referral_user_id === null && $order->referral_code)
            ->pluck('referral_code')
            ->unique()
            ->filter()
            ->values();

        $ownersByCode = $codesForLegacy->isEmpty()
            ? collect()
            : ReferralCode::query()
                ->with('user:id,name,email,role,phone')
                ->whereIn('referral_code', $codesForLegacy)
                ->get()
                ->keyBy('referral_code');

        $items = $orders->map(function (Order $order) use ($ownersByCode) {
            $owner = $order->referralOwner
                ?? ($order->referral_code ? $ownersByCode->get($order->referral_code)?->user : null);

            $referralOwner = $owner instanceof User ? [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
                'role' => $owner->role,
                'phone' => $owner->phone,
            ] : null;

            return array_merge($order->toArray(), [
                'referral_owner' => $referralOwner,
            ]);
        });

        return response()->json([
            'orders' => $items,
        ]);
    }

    public function store(Request $request, ShiprocketService $shiprocketService): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'referral_code' => ['nullable', 'string', 'size:8'],
            'address_line' => ['required', 'string', 'max:1000'],
            'city' => ['required', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'postal_code' => ['required', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'payment_method' => ['required', 'string', 'in:cod,online'],
            'razorpay_order_id' => ['nullable', 'string', 'max:255'],
            'razorpay_payment_id' => ['nullable', 'string', 'max:255'],
            'razorpay_signature' => ['nullable', 'string', 'max:255'],
        ]);

        $product = Product::query()->findOrFail($data['product_id']);
        $qty = (int) ($data['quantity'] ?? 1);
        $productPrice = (float) $product->price * $qty;
        $referralCodeValue = isset($data['referral_code']) ? trim((string) $data['referral_code']) : '';
        $referralCode = null;

        if ($referralCodeValue !== '') {
            $referralCode = ReferralCode::query()->where('referral_code', $referralCodeValue)->first();

            if (! $referralCode) {
                return response()->json([
                    'message' => 'Invalid referral code.',
                ], 422);
            }
        }

        $discountPercentage = $referralCode
            ? ReferralPricing::customerDiscountPercent($product, $referralCode)
            : 0;
        $discountAmount = round(($productPrice * $discountPercentage) / 100);
        $finalPrice = round(max(0, $productPrice - $discountAmount));
        $paymentMethod = $data['payment_method'];

        $shippingAmount = round((float) ($product->shipping_rate ?? 0));
        $prepaidPct = max(0, min(100, round((float) ($product->prepaid_discount_percent ?? 0), 2)));
        $prepaidApplied = $paymentMethod === 'online'
            ? round(min($finalPrice, ($finalPrice * $prepaidPct) / 100))
            : 0.0;

        $gstPct = max(0, min(100, round((float) ($product->gst_percent ?? 0), 2)));
        $gstAmount = $gstPct > 0 ? round(($finalPrice * $gstPct) / 100) : 0.0;
        
        // COD charges are only applicable for COD payment method
        $codCharges = ($paymentMethod === 'cod') ? round((float) ($product->cod_charges ?? 0)) : 0.0;
        
        // Final grand total calculation (Excludes cod_charges as they are paid upfront)
        $grandTotal = round($finalPrice + $gstAmount + $shippingAmount - $prepaidApplied);

        $order = Order::query()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_slug' => $product->slug,
            'product_price' => $product->price,
            'referral_code' => $referralCode?->referral_code,
            'referral_user_id' => $referralCode?->user_id,
            'discount_percentage' => $discountPercentage,
            'discount_amount' => $discountAmount,
            'final_price' => $finalPrice,
            'shipping_amount' => $shippingAmount,
            'prepaid_discount_amount' => $prepaidApplied,
            'gst_percent' => $gstPct,
            'gst_amount' => $gstAmount,
            'cod_charges' => $codCharges,
            'customer_name' => trim($data['customer_name']),
            'customer_phone' => trim($data['customer_phone']),
            'customer_email' => isset($data['customer_email']) ? trim((string) $data['customer_email']) : null,
            'address_line' => trim($data['address_line']),
            'quantity' => $qty,
            'city' => trim($data['city']),
            'state' => trim($data['state']),
            'postal_code' => trim($data['postal_code']),
            'notes' => isset($data['notes']) ? trim((string) $data['notes']) : null,
            'whatsapp_number' => '9817665567',
            'status' => 'pending',
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentMethod === 'online' ? 'paid' : (! empty($data['razorpay_payment_id']) ? 'handling_paid' : 'pending'),
            'razorpay_order_id' => $data['razorpay_order_id'] ?? null,
            'razorpay_payment_id' => $data['razorpay_payment_id'] ?? null,
            'razorpay_signature' => $data['razorpay_signature'] ?? null,
            'shiprocket_status' => $shiprocketService->isConfigured() ? 'pending' : 'not_configured',
        ]);

        if ($order->payment_method === 'online' && $order->payment_status === 'paid') {
            AffiliateWalletService::creditForOrderIfEligible($order, $product);
        }

        $shiprocketError = null;

        if ($shiprocketService->isConfigured()) {
            $shiprocketResult = $shiprocketService->createOrderSafely($order);
            if (($shiprocketResult['ok'] ?? false) === true) {
                $shiprocketResponse = (array) ($shiprocketResult['data'] ?? []);
                $shipmentId = data_get($shiprocketResponse, 'shipment_id');
                $remoteOrderId = data_get($shiprocketResponse, 'order_id');

                $order->update([
                    'shiprocket_order_id' => $remoteOrderId ? (string) $remoteOrderId : null,
                    'shiprocket_shipment_id' => $shipmentId ? (string) $shipmentId : null,
                    'shiprocket_status' => 'created',
                    'shiprocket_response' => $shiprocketResponse,
                ]);
            } else {
                $shiprocketError = (string) ($shiprocketResult['error'] ?? 'Unknown Shiprocket error.');
                $order->update([
                    'shiprocket_status' => 'failed',
                    'shiprocket_response' => [
                        'error' => $shiprocketError,
                    ],
                ]);
            }
        }

        return response()->json([
            'message' => 'Order created successfully.',
            'order' => $order,
            'shiprocket' => [
                'status' => $order->shiprocket_status,
                'shipment_id' => $order->shiprocket_shipment_id,
                'error' => $shiprocketError,
            ],
        ], 201);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', 'in:pending,success,failed,cancelled'],
            'payment_status' => ['nullable', 'string', 'in:pending,paid,failed'],
        ]);

        $order->update($data);

        // If status becomes success or payment becomes paid, credit affiliate wallet
        if (($order->status === 'success' || $order->payment_status === 'paid') && ! $order->affiliate_wallet_credited) {
            $product = Product::query()->find($order->product_id);
            if ($product) {
                AffiliateWalletService::creditForOrderIfEligible($order, $product);
            }
        }

        return response()->json([
            'message' => 'Order status updated.',
            'order' => $order,
        ]);
    }
}
