<?php

namespace App\Http\Controllers;

use App\Models\MobileBannerImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MobileBannerImageController extends Controller
{
    public function index(): JsonResponse
    {
        $items = MobileBannerImage::query()
            ->orderBy('order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'mobile_banner_images' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
            'image' => ['required', 'image', 'max:10240'],
        ]);

        $path = $request->file('image')->store('mobile-banner-images', 'public');

        $item = MobileBannerImage::query()->create([
            'title' => trim($data['title']),
            'order' => $data['order'] ?? 0,
            'image' => '/storage/'.$path,
        ]);

        return response()->json([
            'message' => 'Mobile banner image uploaded successfully.',
            'mobile_banner_image' => $item,
        ], 201);
    }

    public function destroy(MobileBannerImage $mobileBannerImage): JsonResponse
    {
        if ($mobileBannerImage->image && str_starts_with($mobileBannerImage->image, '/storage/')) {
            $relativePath = ltrim(str_replace('/storage/', '', $mobileBannerImage->image), '/');

            if ($relativePath !== '') {
                Storage::disk('public')->delete($relativePath);
            }
        }

        $mobileBannerImage->delete();

        return response()->json([
            'message' => 'Mobile banner image deleted successfully.',
        ]);
    }
}

