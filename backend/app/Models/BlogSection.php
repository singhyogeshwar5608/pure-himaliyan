<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogSection extends Model
{
    use HasFactory;

    protected $table = 'blog_sections';

    protected $fillable = [
        'type',
        'display_order',
        'kicker',
        'heading',
        'body',
        'image_url',
        'comparison_data',
        'sub_sections',
    ];

    protected $casts = [
        'display_order' => 'integer',
        'sub_sections' => 'array',
    ];
}
