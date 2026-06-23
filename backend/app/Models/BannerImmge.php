<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BannerImmge extends Model
{
    use HasFactory;

    protected $table = 'banner_immge';

    protected $fillable = [
        'title',
        'image',
        'order',
    ];
}
