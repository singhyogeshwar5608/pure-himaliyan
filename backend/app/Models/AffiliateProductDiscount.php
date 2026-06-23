<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliateProductDiscount extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'customer_discount_percentage',
    ];

    protected function casts(): array
    {
        return [
            'customer_discount_percentage' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
