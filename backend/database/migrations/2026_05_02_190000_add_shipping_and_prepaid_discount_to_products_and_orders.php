<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'shipping_rate')) {
                $table->decimal('shipping_rate', 10, 2)->default(0)->after('affiliate_commission');
            }
            if (! Schema::hasColumn('products', 'prepaid_discount_amount')) {
                $table->decimal('prepaid_discount_amount', 10, 2)->default(0)->after('shipping_rate');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'shipping_amount')) {
                $table->decimal('shipping_amount', 10, 2)->default(0)->after('final_price');
            }
            if (! Schema::hasColumn('orders', 'prepaid_discount_amount')) {
                $table->decimal('prepaid_discount_amount', 10, 2)->default(0)->after('shipping_amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $cols = array_values(array_filter([
                Schema::hasColumn('products', 'shipping_rate') ? 'shipping_rate' : null,
                Schema::hasColumn('products', 'prepaid_discount_amount') ? 'prepaid_discount_amount' : null,
            ]));
            if ($cols !== []) {
                $table->dropColumn($cols);
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            $cols = array_values(array_filter([
                Schema::hasColumn('orders', 'shipping_amount') ? 'shipping_amount' : null,
                Schema::hasColumn('orders', 'prepaid_discount_amount') ? 'prepaid_discount_amount' : null,
            ]));
            if ($cols !== []) {
                $table->dropColumn($cols);
            }
        });
    }
};
