<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_descriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('product_descriptions', 'image_url')) {
                $table->string('image_url')->nullable()->after('body');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_descriptions', function (Blueprint $table) {
            if (Schema::hasColumn('product_descriptions', 'image_url')) {
                $table->dropColumn('image_url');
            }
        });
    }
};
