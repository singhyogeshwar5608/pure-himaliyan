<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $appends = [
        'grand_total',
    ];

    protected $fillable = [
        'product_id',
        'product_name',
        'product_slug',
        'product_price',
        'referral_code',
        'referral_user_id',
        'affiliate_wallet_credited',
        'discount_percentage',
        'discount_amount',
        'final_price',
        'shipping_amount',
        'prepaid_discount_amount',
        'gst_percent',
        'gst_amount',
        'cod_charges',
        'customer_name',
        'customer_phone',
        'customer_email',
        'address_line',
        'quantity',
        'city',
        'state',
        'postal_code',
        'notes',
        'whatsapp_number',
        'status',
        'payment_method',
        'payment_status',
        'razorpay_order_id',
        'razorpay_payment_id',
        'razorpay_signature',
        'shiprocket_order_id',
        'shiprocket_shipment_id',
        'shiprocket_status',
        'shiprocket_response',
    ];

    protected function casts(): array
    {
        return [
            'product_price' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'final_price' => 'decimal:2',
            'shipping_amount' => 'decimal:2',
            'prepaid_discount_amount' => 'decimal:2',
            'gst_percent' => 'decimal:2',
            'gst_amount' => 'decimal:2',
            'cod_charges' => 'decimal:2',
            'shiprocket_response' => 'array',
            'affiliate_wallet_credited' => 'boolean',
        ];
    }

    public function getGrandTotalAttribute(): string
    {
        $line = (float) $this->final_price;
        $shipping = (float) $this->shipping_amount;
        $prepaid = (float) $this->prepaid_discount_amount;
        $gst = (float) ($this->gst_amount ?? 0);
        // grand_total represents the amount to be paid (either online or on delivery)
        // cod_charges are handled separately as upfront handling fees
        $total = max(0, round($line + $shipping + $gst - $prepaid, 2));

        return number_format($total, 2, '.', '');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function referralOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referral_user_id');
    }

    public function affiliateWalletTransaction(): HasOne
    {
        return $this->hasOne(AffiliateWalletTransaction::class);
    }
}
