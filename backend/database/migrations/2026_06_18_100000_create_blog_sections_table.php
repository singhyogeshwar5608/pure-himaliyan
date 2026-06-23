<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_sections', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'description' or 'comparison'
            $table->unsignedInteger('display_order')->default(0);
            $table->string('kicker')->nullable();
            $table->string('heading')->nullable();
            $table->longText('body')->nullable();
            $table->longText('comparison_data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_sections');
    }
};
