<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Referral codes and share links are only for affiliate accounts.
     */
    public function up(): void
    {
        $userIds = User::query()->where('role', User::ROLE_USER)->pluck('id');

        if ($userIds->isNotEmpty()) {
            DB::table('referral_codes')->whereIn('user_id', $userIds)->delete();
        }
    }

    public function down(): void
    {
        // Irreversible: cannot restore deleted referral rows.
    }
};
