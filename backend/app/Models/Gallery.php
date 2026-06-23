<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'title',
        'media_type',
        'image_path',
        'video_url',
        'display_order',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
