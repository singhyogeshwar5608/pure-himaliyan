<?php

namespace App\Services;

use App\Models\AffiliateWalletTransaction;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AffiliateWalletService
{
    /**
     * Commission pool = product_price × affiliate_commission%.
     * Affiliate wallet credit = pool − customer discount (rupees), when referral owner is an affiliate.
     * Credited once per order (affiliate_wallet_credited).
     */
    public static function creditForOrderIfEligible(Order $order, Product $product): void
    {
        if ($order->affiliate_wallet_credited || ! $order->referral_user_id) {
            return;
        }

        $affiliate = User::query()->find($order->referral_user_id);

        if (! $affiliate || $affiliate->role !== User::ROLE_AFFILIATE) {
            return;
        }

        $productPrice = (float) $order->product_price;
        $commissionPct = (float) $product->affiliate_commission;
        
        // Total Pool = Price * Commission%
        $commissionPool = round($productPrice * ($commissionPct / 100), 2);
        
        // Discount given to customer
        $customerDiscount = round((float) $order->discount_amount, 2);
        
        // Affiliate earns the remainder of the pool
        $credit = max(0, round($commissionPool - $customerDiscount, 2));

        DB::transaction(function () use ($order, $affiliate, $commissionPool, $customerDiscount, $credit) {
            $order->refresh();

            if ($order->affiliate_wallet_credited) {
                return;
            }

            $locked = User::query()->whereKey($affiliate->id)->lockForUpdate()->first();

            if (! $locked) {
                return;
            }

            $balanceBefore = (float) $locked->affiliate_wallet_balance;
            $balanceAfter = round($balanceBefore + $credit, 2);

            if ($credit > 0) {
                AffiliateWalletTransaction::query()->create([
                    'user_id' => $locked->id,
                    'order_id' => $order->id,
                    'commission_pool_amount' => $commissionPool,
                    'customer_discount_amount' => $customerDiscount,
                    'amount' => $credit,
                    'balance_after' => $balanceAfter,
                ]);

                DB::table('users')->where('id', $locked->id)->update([
                    'affiliate_wallet_balance' => $balanceAfter,
                    'updated_at' => now(),
                ]);
            }

            $order->update([
                'affiliate_wallet_credited' => true,
            ]);
        });
    }
}
