<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliateWalletTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'commission_pool_amount',
        'customer_discount_amount',
        'amount',
        'balance_after',
    ];

    protected function casts(): array
    {
        return [
            'commission_pool_amount' => 'decimal:2',
            'customer_discount_amount' => 'decimal:2',
            'amount' => 'decimal:2',
            'balance_after' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
