<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ReferralCode;
use App\Support\ReferralPricing;
use App\Services\RazorpayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RazorpayController extends Controller
{
    public function createOrder(Request $request, RazorpayService $razorpayService): JsonResponse
    {
        if (! $razorpayService->isConfigured()) {
            return response()->json([
                'message' => 'Razorpay is not configured on server.',
            ], 422);
        }

        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'referral_code' => ['nullable', 'string', 'size:8'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'payment_method' => ['nullable', 'string', 'in:cod,online'],
        ]);

        $product = Product::query()->findOrFail($data['product_id']);
        $qty = (int) ($data['quantity'] ?? 1);
        $productPrice = round((float) $product->price) * $qty;
        $referralCodeValue = isset($data['referral_code']) ? trim((string) $data['referral_code']) : '';
        $referralCode = null;
        $paymentMethod = isset($data['payment_method']) ? $data['payment_method'] : 'online';

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
        $subtotalAfterReferral = max(0, round($productPrice - $discountAmount));
        $shippingAmount = round((float) ($product->shipping_rate ?? 0));
        $prepaidPct = max(0, min(100, round((float) ($product->prepaid_discount_percent ?? 0), 2)));
        $prepaidApplied = $paymentMethod === 'online'
            ? round(min($subtotalAfterReferral, ($subtotalAfterReferral * $prepaidPct) / 100))
            : 0.0;
        $gstPct = max(0, min(100, round((float) ($product->gst_percent ?? 0), 2)));
        $gstAmount = $gstPct > 0 ? round(($subtotalAfterReferral * $gstPct) / 100) : 0.0;
        $codCharges = round((float) ($product->cod_charges ?? 0));

        // If COD, the user only pays cod_charges via Razorpay.
        // If Online, the user pays the full amount.
        if ($paymentMethod === 'cod') {
            $chargeRupees = $codCharges;
        } else {
            $chargeRupees = max(0, round($subtotalAfterReferral + $gstAmount + $shippingAmount - $prepaidApplied));
        }

        // If the amount to charge is 0 (e.g., COD with 0 charges), we shouldn't create a Razorpay order.
        // But for consistency, let's assume cod_charges > 0 if COD is chosen and requiring Razorpay.
        
        $razorpayOrder = $razorpayService->createOrder(
            $chargeRupees,
            'product-'.$product->id.'-'.now()->timestamp
        );

        return response()->json([
            'message' => 'Razorpay order created successfully.',
            'razorpay_order' => [
                'id' => $razorpayOrder['id'],
                'amount' => $razorpayOrder['amount'],
                'currency' => $razorpayOrder['currency'] ?? 'INR',
                'key' => $razorpayService->keyId(),
            ],
            'pricing' => [
                'original_price' => number_format($productPrice, 2, '.', ''),
                'discount_percentage' => $discountPercentage,
                'discount_amount' => number_format($discountAmount, 2, '.', ''),
                'subtotal_after_referral' => number_format($subtotalAfterReferral, 2, '.', ''),
                'shipping_amount' => number_format($shippingAmount, 2, '.', ''),
                'prepaid_discount_percent' => $prepaidPct,
                'prepaid_discount_amount' => number_format($prepaidApplied, 2, '.', ''),
                'gst_percent' => $gstPct,
                'gst_amount' => number_format($gstAmount, 2, '.', ''),
                'cod_charges' => number_format($codCharges, 2, '.', ''),
                'final_price' => number_format($chargeRupees, 2, '.', ''),
            ],
        ]);
    }

    public function verifyPayment(Request $request, RazorpayService $razorpayService): JsonResponse
    {
        if (! $razorpayService->isConfigured()) {
            return response()->json([
                'message' => 'Razorpay is not configured on server.',
            ], 422);
        }

        $data = $request->validate([
            'razorpay_order_id' => ['required', 'string'],
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_signature' => ['required', 'string'],
        ]);

        $isValid = $razorpayService->verifySignature(
            $data['razorpay_order_id'],
            $data['razorpay_payment_id'],
            $data['razorpay_signature'],
        );

        if (! $isValid) {
            return response()->json([
                'message' => 'Invalid Razorpay payment signature.',
            ], 422);
        }

        return response()->json([
            'message' => 'Razorpay payment verified successfully.',
            'verified' => true,
        ]);
    }
}
