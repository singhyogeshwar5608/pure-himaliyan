<?php

use App\Http\Controllers\BannerImmgeController;
use App\Http\Controllers\BlogSectionController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\MobileBannerImageController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductDescriptionController;
use App\Http\Controllers\RazorpayController;
use App\Http\Controllers\ReviewController;
use App\Models\AffiliateProductDiscount;
use App\Models\AffiliateWalletTransaction;
use App\Models\Order;
use App\Models\Product;
use App\Models\ReferralCode;
use App\Models\User;
use App\Support\ReferralPricing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'Pure Himalyan Laravel API',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::get('/meta', function () {
    return response()->json([
        'frontend' => 'react-web',
        'backend' => 'laravel-api',
        'stack' => 'React + Laravel API',
    ]);
});

Route::post('/admin/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
    ]);

    $user = User::query()->where('email', $credentials['email'])->first();

    if (! $user || ! Hash::check($credentials['password'], $user->password)) {
        return response()->json([
            'message' => 'Invalid email or password.',
        ], 422);
    }

    if (! in_array($user->role, [User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN], true)) {
        return response()->json([
            'message' => 'You are not authorized to access the admin panel.',
        ], 403);
    }

    return response()->json([
        'message' => 'Login successful.',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ],
        'redirectTo' => $user->role === User::ROLE_SUPER_ADMIN
            ? '/super-admin/dashboard'
            : '/admin/dashboard',
    ]);
});

Route::post('/user/register', function (Request $request) {
    $payload = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        'password' => ['required', 'string', 'min:6'],
    ]);

    $user = DB::transaction(function () use ($payload) {
        return User::query()->create([
            'name' => $payload['name'],
            'phone' => $payload['phone'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'role' => User::ROLE_USER,
        ]);
    });

    return response()->json([
        'message' => 'User registered successfully.',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
            'role' => $user->role,
            'referral_code' => null,
            'discount_percentage' => null,
        ],
    ], 201);
});

Route::post('/user/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
    ]);

    $user = User::query()->where('email', $credentials['email'])->first();

    if (! $user || ! Hash::check($credentials['password'], $user->password)) {
        return response()->json([
            'message' => 'Invalid email or password.',
        ], 422);
    }

    if ($user->role !== User::ROLE_USER) {
        return response()->json([
            'message' => 'This login is only for users.',
        ], 403);
    }

    return response()->json([
        'message' => 'Login successful.',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
            'role' => $user->role,
            'referral_code' => null,
            'discount_percentage' => null,
        ],
    ]);
});

Route::post('/affiliate/register', function (Request $request) {
    $payload = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        'password' => ['required', 'string', 'min:6'],
    ]);

    $user = DB::transaction(function () use ($payload) {
        $user = User::query()->create([
            'name' => $payload['name'],
            'phone' => $payload['phone'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'role' => User::ROLE_AFFILIATE,
        ]);

        do {
            $referralCode = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        } while (ReferralCode::query()->where('referral_code', $referralCode)->exists());

        $user->referralCode()->create([
            'referral_code' => $referralCode,
            'discount_percentage' => 10,
        ]);

        return $user->load('referralCode');
    });

    return response()->json([
        'message' => 'Affiliate registered successfully.',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
            'role' => $user->role,
            'referral_code' => $user->referralCode?->referral_code,
            'discount_percentage' => $user->referralCode?->discount_percentage,
        ],
    ], 201);
});

Route::post('/affiliate/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
    ]);

    $user = User::query()->with('referralCode')->where('email', $credentials['email'])->first();

    if (! $user || ! Hash::check($credentials['password'], $user->password)) {
        return response()->json([
            'message' => 'Invalid email or password.',
        ], 422);
    }

    if ($user->role !== User::ROLE_AFFILIATE) {
        return response()->json([
            'message' => 'This login is only for affiliate partners.',
        ], 403);
    }

    if (! $user->referralCode) {
        do {
            $referralCode = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        } while (ReferralCode::query()->where('referral_code', $referralCode)->exists());

        $user->referralCode()->create([
            'referral_code' => $referralCode,
            'discount_percentage' => 10,
        ]);

        $user->load('referralCode');
    }

    return response()->json([
        'message' => 'Login successful.',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
            'role' => $user->role,
            'referral_code' => $user->referralCode?->referral_code,
            'discount_percentage' => $user->referralCode?->discount_percentage,
        ],
    ]);
});

Route::post('/referral-code/apply', function (Request $request) {
    $payload = $request->validate([
        'referral_code' => ['required', 'string', 'size:8'],
        'product_id' => ['nullable', 'integer', 'exists:products,id'],
    ]);

    $referralCode = ReferralCode::query()->where('referral_code', trim($payload['referral_code']))->first();

    if (! $referralCode) {
        return response()->json([
            'message' => 'Invalid referral code.',
        ], 422);
    }

    if (isset($payload['product_id'])) {
        $product = Product::query()->findOrFail((int) $payload['product_id']);
        $discount = ReferralPricing::customerDiscountPercent($product, $referralCode);
        $c = ReferralPricing::commissionPercentOfPrice($product);
        $referralCode->loadMissing('user');

        $poolShare = null;
        if ($referralCode->user?->role === User::ROLE_AFFILIATE) {
            $row = AffiliateProductDiscount::query()
                ->where('user_id', $referralCode->user_id)
                ->where('product_id', $product->id)
                ->first();
            $poolShare = ReferralPricing::poolSharePercentFromRow($row)
                ?? ReferralPricing::inferredPoolSharePercent($c, $discount);
        }

        $affiliateName = ($referralCode->user?->role === User::ROLE_AFFILIATE && $referralCode->user?->name)
            ? trim((string) $referralCode->user->name)
            : null;

        return response()->json([
            'message' => 'Referral code applied successfully.',
            'referral_code' => $referralCode->referral_code,
            'discount_percentage' => $discount,
            'commission_percent_of_price' => $c,
            'affiliate_commission_percent' => (float) $product->affiliate_commission,
            'pool_share_percent' => $poolShare,
            'discount_note' => $referralCode->user?->role === User::ROLE_AFFILIATE
                ? 'Discount affiliate commission pool ka hissa hai (product price par alag % nahi).'
                : null,
            'affiliate_name' => $affiliateName !== '' ? $affiliateName : null,
        ]);
    }

    $referralCode->loadMissing('user');
    $affiliateNameGeneric = ($referralCode->user?->role === User::ROLE_AFFILIATE && $referralCode->user?->name)
        ? trim((string) $referralCode->user->name)
        : null;

    return response()->json([
        'message' => 'Referral code applied successfully.',
        'referral_code' => $referralCode->referral_code,
        'discount_percentage' => $referralCode->discount_percentage,
        'affiliate_name' => $affiliateNameGeneric !== '' ? $affiliateNameGeneric : null,
    ]);
});

Route::get('/affiliate/{user}/product-discounts', function (User $user) {
    if ($user->role !== User::ROLE_AFFILIATE) {
        return response()->json([
            'message' => 'Only affiliate accounts can use this endpoint.',
        ], 403);
    }

    $user->load('referralCode');

    if (! $user->referralCode) {
        return response()->json([
            'message' => 'Referral code missing for this user.',
        ], 422);
    }

    $products = Product::query()
        ->where('is_active', true)
        ->orderBy('name')
        ->get(['id', 'name', 'slug', 'affiliate_commission', 'price']);

    $rows = AffiliateProductDiscount::query()
        ->where('user_id', $user->id)
        ->whereIn('product_id', $products->pluck('id'))
        ->get()
        ->keyBy('product_id');

    $items = $products->map(function (Product $product) use ($rows, $user) {
        $c = ReferralPricing::commissionPercentOfPrice($product);
        $row = $rows->get($product->id);
        $effective = ReferralPricing::customerDiscountPercent($product, $user->referralCode);
        $configuredPool = ReferralPricing::poolSharePercentFromRow($row);
        $impliedPool = ReferralPricing::inferredPoolSharePercent($c, $effective);

        return [
            'product_id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'price' => (string) $product->price,
            'affiliate_commission_percent' => (float) $product->affiliate_commission,
            'commission_percent_of_price' => $c,
            'max_pool_share_percent' => 100,
            'configured_pool_share_percent' => $configuredPool,
            'implied_pool_share_percent' => $impliedPool,
            'effective_discount_percent_of_price' => $effective,
            'max_customer_discount_percent' => $c,
            'configured_customer_discount_percent' => $configuredPool,
            'effective_customer_discount_percent' => $effective,
        ];
    });

    return response()->json([
        'items' => $items,
        'referral_code' => $user->referralCode->referral_code,
    ]);
});

Route::put('/affiliate/{user}/product-discounts/{product}', function (Request $request, User $user, Product $product) {
    if ($user->role !== User::ROLE_AFFILIATE) {
        return response()->json([
            'message' => 'Only affiliate accounts can use this endpoint.',
        ], 403);
    }

    $payload = $request->validate([
        'customer_discount_percentage' => ['required', 'integer', 'min:0', 'max:100'],
    ]);

    AffiliateProductDiscount::query()->updateOrCreate(
        [
            'user_id' => $user->id,
            'product_id' => $product->id,
        ],
        [
            'customer_discount_percentage' => (int) $payload['customer_discount_percentage'],
        ],
    );

    $user->load('referralCode');

    $c = ReferralPricing::commissionPercentOfPrice($product);

    return response()->json([
        'message' => 'Product discount saved.',
        'item' => [
            'product_id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'affiliate_commission_percent' => (float) $product->affiliate_commission,
            'commission_percent_of_price' => $c,
            'max_pool_share_percent' => 100,
            'configured_pool_share_percent' => (int) $payload['customer_discount_percentage'],
            'effective_discount_percent_of_price' => ReferralPricing::customerDiscountPercent($product, $user->referralCode),
        ],
    ]);
});

Route::get('/referral-users', function () {
    $items = ReferralCode::query()
        ->with('user')
        ->whereHas('user', fn ($query) => $query->where('role', User::ROLE_AFFILIATE))
        ->latest()
        ->get()
        ->map(fn (ReferralCode $referralCode) => [
            'id' => $referralCode->id,
            'user_id' => $referralCode->user_id,
            'name' => $referralCode->user?->name,
            'email' => $referralCode->user?->email,
            'phone' => $referralCode->user?->phone,
            'referral_code' => $referralCode->referral_code,
            'discount_percentage' => $referralCode->discount_percentage,
            'created_at' => $referralCode->created_at,
            'updated_at' => $referralCode->updated_at,
        ]);

    return response()->json([
        'referral_users' => $items,
    ]);
});

Route::put('/referral-users/{referralCode}', function (Request $request, ReferralCode $referralCode) {
    $user = $referralCode->user()->firstOrFail();

    $payload = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        'phone' => ['required', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id)],
        'referral_code' => ['required', 'string', 'size:8', Rule::unique('referral_codes', 'referral_code')->ignore($referralCode->id)],
        'discount_percentage' => ['required', 'integer', 'min:0', 'max:100'],
    ]);

    $user->update([
        'name' => trim($payload['name']),
        'email' => trim($payload['email']),
        'phone' => trim($payload['phone']),
    ]);

    $referralCode->update([
        'referral_code' => trim($payload['referral_code']),
        'discount_percentage' => $payload['discount_percentage'],
    ]);

    return response()->json([
        'message' => 'Referral user updated successfully.',
        'referral_user' => [
            'id' => $referralCode->id,
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'referral_code' => $referralCode->referral_code,
            'discount_percentage' => $referralCode->discount_percentage,
            'created_at' => $referralCode->created_at,
            'updated_at' => $referralCode->updated_at,
        ],
    ]);
});

Route::delete('/referral-users/{referralCode}', function (ReferralCode $referralCode) {
    $user = $referralCode->user;

    if ($user) {
        $user->delete();
    } else {
        $referralCode->delete();
    }

    return response()->json([
        'message' => 'Referral user deleted successfully.',
    ]);
});

Route::get('/user-dashboard/{user}', function (User $user) {
    $user->load('referralCode');
    $isAffiliate = $user->role === User::ROLE_AFFILIATE;

    $orders = Order::query()
        ->with(['product' => function ($query) {
            $query->select('id', 'slug', 'image_url', 'images');
        }])
        ->where(function ($query) use ($user) {
            $query
                ->where('customer_email', $user->email)
                ->orWhere('customer_phone', $user->phone);
        })
        ->latest()
        ->get();

    $ordersPayload = $orders->map(function (Order $order) {
        $row = $order->toArray();
        $thumb = null;
        if ($order->product) {
            $thumb = $order->product->image_url;
            if (! $thumb && $order->product->images) {
                $imgs = $order->product->images;
                $thumb = is_array($imgs) && $imgs !== [] ? $imgs[0] : null;
            }
        }
        $row['product_image_url'] = $thumb;
        unset($row['product']);

        return $row;
    })->values();

    $referralOrderCount = $isAffiliate && $user->referralCode
        ? Order::query()->where('referral_code', $user->referralCode->referral_code)->count()
        : 0;

    $payload = [
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
            'role' => $user->role,
            'referral_code' => $isAffiliate ? $user->referralCode?->referral_code : null,
            'discount_percentage' => $isAffiliate ? ($user->referralCode?->discount_percentage ?? 0) : null,
        ],
        'orders' => $ordersPayload,
        'stats' => [
            'total_orders' => $orders->count(),
            'referral_orders' => $referralOrderCount,
        ],
    ];

    if ($user->role === User::ROLE_AFFILIATE) {
        $user->refresh();
        $refCode = $user->referralCode?->referral_code;

        $referralOrders = Order::query()
            ->where(function ($query) use ($user, $refCode) {
                $query->where('referral_user_id', $user->id);
                if ($refCode) {
                    $query->orWhere('referral_code', $refCode);
                }
            })
            ->latest()
            ->get();

        $txByOrder = AffiliateWalletTransaction::query()
            ->where('user_id', $user->id)
            ->whereIn('order_id', $referralOrders->pluck('id'))
            ->get()
            ->keyBy('order_id');

        $payload['referral_orders'] = $referralOrders->map(function (Order $order) use ($txByOrder) {
            $tx = $txByOrder->get($order->id);

            return array_merge($order->toArray(), [
                'affiliate_wallet_credit' => $tx ? (string) $tx->amount : null,
                'commission_pool_amount' => $tx ? (string) $tx->commission_pool_amount : null,
                'customer_discount_pool_amount' => $tx ? (string) $tx->customer_discount_amount : null,
            ]);
        })->values();

        $payload['affiliate_wallet_balance'] = number_format((float) ($user->affiliate_wallet_balance ?? 0), 2, '.', '');
        $payload['affiliate_wallet_transactions'] = AffiliateWalletTransaction::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (AffiliateWalletTransaction $t) => [
                'id' => $t->id,
                'order_id' => $t->order_id,
                'amount' => (string) $t->amount,
                'commission_pool_amount' => (string) $t->commission_pool_amount,
                'customer_discount_amount' => (string) $t->customer_discount_amount,
                'balance_after' => (string) $t->balance_after,
                'created_at' => $t->created_at,
            ])
            ->values();
    }

    return response()->json($payload);
});

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::post('/products', [ProductController::class, 'store']);
Route::put('/products/{product}', [ProductController::class, 'update']);
Route::delete('/products/{product}', [ProductController::class, 'destroy']);
Route::get('/products/{product}/descriptions', [ProductDescriptionController::class, 'index']);
Route::post('/products/{product}/descriptions', [ProductDescriptionController::class, 'store']);
Route::put('/products/{product}/descriptions/{description}', [ProductDescriptionController::class, 'update']);
Route::delete('/products/{product}/descriptions/{description}', [ProductDescriptionController::class, 'destroy']);
Route::get('/banner-images', [BannerImmgeController::class, 'index']);
Route::post('/banner-images', [BannerImmgeController::class, 'store']);
Route::delete('/banner-images/{bannerImmge}', [BannerImmgeController::class, 'destroy']);
Route::get('/mobile-banner-images', [MobileBannerImageController::class, 'index']);
Route::post('/mobile-banner-images', [MobileBannerImageController::class, 'store']);
Route::delete('/mobile-banner-images/{mobileBannerImage}', [MobileBannerImageController::class, 'destroy']);
Route::get('/gallery', [GalleryController::class, 'index']);
Route::post('/gallery', [GalleryController::class, 'store']);
Route::delete('/gallery/{gallery}', [GalleryController::class, 'destroy']);
Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/payments/razorpay/order', [RazorpayController::class, 'createOrder']);
Route::post('/payments/razorpay/verify', [RazorpayController::class, 'verifyPayment']);
Route::get('/inquiries', [InquiryController::class, 'index']);
Route::post('/inquiries', [InquiryController::class, 'store']);

// Reviews
Route::get('/products/{productId}/reviews', [ReviewController::class, 'index']);
Route::post('/reviews', [ReviewController::class, 'store']);

// Admin Reviews
Route::get('/admin/reviews', [ReviewController::class, 'adminIndex']);
Route::put('/admin/reviews/{id}/status', [ReviewController::class, 'updateStatus']);
Route::delete('/admin/reviews/{id}', [ReviewController::class, 'destroy']);

// Admin Orders
Route::put('/admin/orders/{order}/status', [OrderController::class, 'updateStatus']);

// Blog
Route::get('/blog-sections', [BlogSectionController::class, 'index']);
Route::post('/blog-sections', [BlogSectionController::class, 'store']);
Route::put('/blog-sections/{blogSection}', [BlogSectionController::class, 'update']);
Route::delete('/blog-sections/{blogSection}', [BlogSectionController::class, 'destroy']);
