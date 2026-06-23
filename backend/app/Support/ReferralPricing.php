<?php

namespace App\Support;

use App\Models\AffiliateProductDiscount;
use App\Models\Product;
use App\Models\ReferralCode;
use App\Models\User;

class ReferralPricing
{
    /**
     * Product's affiliate commission expressed as integer % of list price (pool size vs price).
     */
    public static function commissionPercentOfPrice(Product $product): int
    {
        return max(0, (int) floor((float) $product->affiliate_commission));
    }

    /** @deprecated Use commissionPercentOfPrice — same value (max discount off price if entire pool given to buyer). */
    public static function maxCustomerDiscountPercent(Product $product): int
    {
        return self::commissionPercentOfPrice($product);
    }

    /**
     * Affiliate: stored value is % of commission POOL (0–100) to pass to buyer, not % of product price.
     * Effective discount off list price = C × P / 100 (C = commission % of price, P = pool share %).
     * Non-affiliate: discount % off price = min(global referral %, C).
     */
    public static function customerDiscountPercent(Product $product, ReferralCode $referral): int
    {
        $c = self::commissionPercentOfPrice($product);
        $referral->loadMissing('user');

        if ($referral->user?->role === User::ROLE_AFFILIATE) {
            $row = AffiliateProductDiscount::query()
                ->where('user_id', $referral->user_id)
                ->where('product_id', $product->id)
                ->first();

            if ($row) {
                $p = max(0, min(100, (int) $row->customer_discount_percentage));

                return (int) min(100, max(0, (int) round(($c * $p) / 100)));
            }
        }

        $global = max(0, (int) $referral->discount_percentage);

        return min($c, $global);
    }

    /**
     * Pool share 0–100 for UI when there is no per-product row (infer from effective % off price).
     */
    public static function inferredPoolSharePercent(int $c, int $effectivePercentOffPrice): int
    {
        if ($c <= 0) {
            return 0;
        }

        return (int) max(0, min(100, (int) round(($effectivePercentOffPrice * 100) / $c)));
    }

    public static function poolSharePercentFromRow(?AffiliateProductDiscount $row): ?int
    {
        if ($row === null) {
            return null;
        }

        return max(0, min(100, (int) $row->customer_discount_percentage));
    }
}
