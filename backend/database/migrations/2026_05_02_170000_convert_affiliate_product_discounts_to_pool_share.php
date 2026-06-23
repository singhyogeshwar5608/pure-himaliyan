<?php

use App\Models\Product;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * affiliate_product_discounts.customer_discount_percentage was stored as % off product price (0..C).
     * It now means % of the commission POOL (0..100) given to the buyer: effective_price% = C × P / 100.
     * Convert old values: P_new = min(100, round(old × 100 / C)) when C > 0.
     */
    public function up(): void
    {
        $rows = DB::table('affiliate_product_discounts')->get();

        foreach ($rows as $row) {
            $product = Product::query()->find($row->product_id);

            if (! $product) {
                continue;
            }

            $c = max(0, (int) floor((float) $product->affiliate_commission));
            $old = (int) $row->customer_discount_percentage;

            if ($c <= 0) {
                $new = 0;
            } else {
                $new = (int) min(100, max(0, (int) round(($old * 100) / $c)));
            }

            DB::table('affiliate_product_discounts')->where('id', $row->id)->update([
                'customer_discount_percentage' => $new,
            ]);
        }
    }

    public function down(): void
    {
        // Cannot reliably reverse without storing old values.
    }
};
