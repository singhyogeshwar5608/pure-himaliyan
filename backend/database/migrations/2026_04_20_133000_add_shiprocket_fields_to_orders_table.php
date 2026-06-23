<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'shiprocket_order_id')) {
                $table->string('shiprocket_order_id')->nullable()->after('status');
            }
            if (! Schema::hasColumn('orders', 'shiprocket_shipment_id')) {
                $table->string('shiprocket_shipment_id')->nullable()->after('shiprocket_order_id');
            }
            if (! Schema::hasColumn('orders', 'shiprocket_status')) {
                $table->string('shiprocket_status')->nullable()->after('shiprocket_shipment_id');
            }
            if (! Schema::hasColumn('orders', 'shiprocket_response')) {
                $table->json('shiprocket_response')->nullable()->after('shiprocket_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::hasColumn('orders', 'shiprocket_order_id') ? 'shiprocket_order_id' : null,
                Schema::hasColumn('orders', 'shiprocket_shipment_id') ? 'shiprocket_shipment_id' : null,
                Schema::hasColumn('orders', 'shiprocket_status') ? 'shiprocket_status' : null,
                Schema::hasColumn('orders', 'shiprocket_response') ? 'shiprocket_response' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
