<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('affiliate_wallet_balance', 14, 2)->default(0)->after('password');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('affiliate_wallet_credited')->default(false)->after('referral_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('affiliate_wallet_credited');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('affiliate_wallet_balance');
        });
    }
};
