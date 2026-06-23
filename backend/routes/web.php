<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Pure Himalyan Laravel API',
        'message' => 'Backend is running',
    ]);
});
