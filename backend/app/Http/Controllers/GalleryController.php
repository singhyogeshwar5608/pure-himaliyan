<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Gallery::query()
            ->with('product')
            ->orderBy('display_order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'galleries' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'title' => ['required', 'string', 'max:255'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'media_type' => ['nullable', 'string', 'in:image,video'],
            'image' => ['nullable', 'image', 'max:10240'],
            'video_url' => ['nullable', 'string', 'max:2000'],
        ]);

        $mediaType = $data['media_type'] ?? 'image';

        if ($mediaType === 'video') {
            $normalizedVideoUrl = $this->normalizeVideoUrl(isset($data['video_url']) ? (string) $data['video_url'] : '');

            if ($normalizedVideoUrl === '') {
                return response()->json([
                    'message' => 'Please provide a valid video URL.',
                ], 422);
            }

            if (! $this->isValidVideoUrl($normalizedVideoUrl)) {
                return response()->json([
                    'message' => 'Please provide a valid video URL.',
                ], 422);
            }

            if (! $this->isSupportedVideoUrl($normalizedVideoUrl)) {
                return response()->json([
                    'message' => 'Only YouTube, Instagram, and Facebook video URLs are supported.',
                ], 422);
            }

            $item = Gallery::query()->create([
                'product_id' => $data['product_id'] ?? null,
                'title' => trim($data['title']),
                'media_type' => 'video',
                'image_path' => '',
                'video_url' => $normalizedVideoUrl,
                'display_order' => $data['display_order'] ?? 0,
            ]);

            return response()->json([
                'message' => 'Gallery video added successfully.',
                'gallery' => $item,
            ], 201);
        }

        if (! $request->hasFile('image')) {
            return response()->json([
                'message' => 'Please select an image to upload.',
            ], 422);
        }

        $path = $request->file('image')->store('gallery', 'public');

        $item = Gallery::query()->create([
            'product_id' => $data['product_id'] ?? null,
            'title' => trim($data['title']),
            'media_type' => 'image',
            'display_order' => $data['display_order'] ?? 0,
            'image_path' => '/storage/'.$path,
            'video_url' => null,
        ]);

        return response()->json([
            'message' => 'Gallery item uploaded successfully.',
            'gallery' => $item,
        ], 201);
    }

    public function destroy(Gallery $gallery): JsonResponse
    {
        if ($gallery->image_path && str_starts_with($gallery->image_path, '/storage/')) {
            $relativePath = ltrim(str_replace('/storage/', '', $gallery->image_path), '/');
            if ($relativePath !== '') {
                Storage::disk('public')->delete($relativePath);
            }
        }

        $gallery->delete();

        return response()->json([
            'message' => 'Gallery item deleted successfully.',
        ]);
    }

    private function isSupportedVideoUrl(string $url): bool
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        if ($host === '') {
            return false;
        }

        $normalizedHost = str_starts_with($host, 'www.') ? substr($host, 4) : $host;

        return in_array($normalizedHost, [
            'youtube.com',
            'm.youtube.com',
            'youtu.be',
            'instagram.com',
            'facebook.com',
            'm.facebook.com',
            'fb.watch',
        ], true);
    }

    private function isValidVideoUrl(string $url): bool
    {
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        return in_array($scheme, ['http', 'https'], true) && $host !== '';
    }

    private function normalizeVideoUrl(string $url): string
    {
        $normalizedUrl = trim(html_entity_decode($url, ENT_QUOTES | ENT_HTML5, 'UTF-8'));

        if ($normalizedUrl === '') {
            return '';
        }

        if (preg_match('~https?://[^\s"<>]+|www\.[^\s"<>]+|(?:instagram|facebook|fb|youtube|youtu)\.[^\s"<>]+~i', $normalizedUrl, $matches) === 1) {
            $normalizedUrl = $matches[0];
        }

        $normalizedUrl = trim($normalizedUrl, " \t\n\r\0\x0B<>[](){}.,;!\"'");

        if (! preg_match('~^https?://~i', $normalizedUrl)) {
            $normalizedUrl = 'https://'.$normalizedUrl;
        }

        $host = strtolower((string) parse_url($normalizedUrl, PHP_URL_HOST));
        $query = [];

        if ($host !== '') {
            parse_str((string) parse_url($normalizedUrl, PHP_URL_QUERY), $query);

            $normalizedHost = str_starts_with($host, 'www.') ? substr($host, 4) : $host;

            if (in_array($normalizedHost, ['l.instagram.com', 'l.facebook.com'], true)) {
                $targetUrl = isset($query['u']) ? trim((string) $query['u']) : '';

                if ($targetUrl !== '') {
                    return $this->normalizeVideoUrl(urldecode($targetUrl));
                }
            }
        }

        return $normalizedUrl;
    }
}
