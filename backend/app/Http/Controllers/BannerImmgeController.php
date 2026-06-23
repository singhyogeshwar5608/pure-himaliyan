<?php

namespace App\Http\Controllers;

use App\Models\BannerImmge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BannerImmgeController extends Controller
{
    public function index(): JsonResponse
    {
        $items = BannerImmge::query()
            ->orderBy('order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'banner_immge' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
            'image' => ['required', 'image', 'max:10240'],
        ]);

        $path = $request->file('image')->store('banner-images', 'public');

        $item = BannerImmge::query()->create([
            'title' => trim($data['title']),
            'order' => $data['order'] ?? 0,
            'image' => '/storage/'.$path,
        ]);

        return response()->json([
            'message' => 'Banner image uploaded successfully.',
            'banner_image' => $item,
        ], 201);
    }

    public function destroy(BannerImmge $bannerImmge): JsonResponse
    {
        if ($bannerImmge->image && str_starts_with($bannerImmge->image, '/storage/')) {
            $relativePath = ltrim(str_replace('/storage/', '', $bannerImmge->image), '/');

            if ($relativePath !== '') {
                Storage::disk('public')->delete($relativePath);
            }
        }

        $bannerImmge->delete();

        return response()->json([
            'message' => 'Banner image deleted successfully.',
        ]);
    }
}
