<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MobileBannerImage extends Model
{
    use HasFactory;

    protected $table = 'mobile_banner_images';

    protected $fillable = [
        'title',
        'image',
        'order',
    ];
}

