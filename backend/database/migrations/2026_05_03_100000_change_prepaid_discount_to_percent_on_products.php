<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'prepaid_discount_percent')) {
                $table->decimal('prepaid_discount_percent', 5, 2)->default(0)->after('shipping_rate');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'prepaid_discount_amount')) {
                $table->dropColumn('prepaid_discount_amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'prepaid_discount_amount')) {
                $table->decimal('prepaid_discount_amount', 10, 2)->default(0)->after('shipping_rate');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'prepaid_discount_percent')) {
                $table->dropColumn('prepaid_discount_percent');
            }
        });
    }
};
