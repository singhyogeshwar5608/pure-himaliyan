<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blog_sections', function (Blueprint $table) {
            $table->longText('sub_sections')->nullable()->after('comparison_data');
        });
    }

    public function down(): void
    {
        Schema::table('blog_sections', function (Blueprint $table) {
            $table->dropColumn('sub_sections');
        });
    }
};
