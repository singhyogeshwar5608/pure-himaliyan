<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    public function descriptions(): HasMany
    {
        return $this->hasMany(ProductDescription::class)->orderBy('display_order');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    protected $fillable = [
        'name',
        'slug',
        'short_description',
        'video_url',
        'description',
        'price',
        'original_price',
        'discount',
        'badge',
        'image_url',
        'images',
        'affiliate_commission',
        'shipping_rate',
        'prepaid_discount_percent',
        'gst_percent',
        'cod_charges',
        'is_active',
        'all_charges_included',
        'comparison_data',
        'comparison_display_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'original_price' => 'decimal:2',
            'discount' => 'integer',
            'affiliate_commission' => 'decimal:2',
            'shipping_rate' => 'decimal:2',
            'prepaid_discount_percent' => 'decimal:2',
            'gst_percent' => 'decimal:2',
            'cod_charges' => 'decimal:2',
            'is_active' => 'boolean',
            'all_charges_included' => 'boolean',
        ];
    }

    protected function images(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if (is_array($value)) {
                    return array_values(array_filter($value));
                }

                if ($value === null || $value === '') {
                    return [];
                }

                if (is_string($value)) {
                    $decoded = json_decode($value, true);

                    if (json_last_error() === JSON_ERROR_NONE) {
                        if (is_array($decoded)) {
                            return array_values(array_filter($decoded));
                        }

                        if (is_string($decoded) && $decoded !== '') {
                            return [$decoded];
                        }

                        return [];
                    }

                    return [$value];
                }

                return [];
            },
            set: function ($value) {
                if ($value === null || $value === '') {
                    return null;
                }

                if (is_string($value)) {
                    $decoded = json_decode($value, true);

                    if (json_last_error() === JSON_ERROR_NONE) {
                        if (is_array($decoded)) {
                            return json_encode(array_values(array_filter($decoded)));
                        }

                        if (is_string($decoded) && $decoded !== '') {
                            return json_encode([$decoded]);
                        }

                        return null;
                    }

                    return json_encode([$value]);
                }

                if (is_array($value)) {
                    return json_encode(array_values(array_filter($value)));
                }

                return null;
            },
        );
    }
}
