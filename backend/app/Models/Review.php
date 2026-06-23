<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'product_id',
        'user_name',
        'rating',
        'comment',
        'is_approved',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
