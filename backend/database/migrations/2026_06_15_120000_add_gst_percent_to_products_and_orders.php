<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'gst_percent')) {
                $table->decimal('gst_percent', 5, 2)->default(0)->after('prepaid_discount_percent');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'gst_percent')) {
                $table->decimal('gst_percent', 5, 2)->default(0)->after('prepaid_discount_amount');
            }
            if (! Schema::hasColumn('orders', 'gst_amount')) {
                $table->decimal('gst_amount', 10, 2)->default(0)->after('gst_percent');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'gst_percent')) {
                $table->dropColumn('gst_percent');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'gst_amount')) {
                $table->dropColumn('gst_amount');
            }
            if (Schema::hasColumn('orders', 'gst_percent')) {
                $table->dropColumn('gst_percent');
            }
        });
    }
};
