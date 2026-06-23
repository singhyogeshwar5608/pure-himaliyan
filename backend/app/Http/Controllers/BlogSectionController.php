<?php

namespace App\Http\Controllers;

use App\Models\BlogSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BlogSectionController extends Controller
{
    public function index(): JsonResponse
    {
        $items = BlogSection::query()
            ->orderBy('display_order')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'sections' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['description', 'comparison'])],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'kicker' => ['nullable', 'string', 'max:255'],
            'heading' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'comparison_data' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:10240'],
        ]);

        $imageUrl = null;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('blog-sections', 'public');
            $imageUrl = '/storage/'.$path;
        }

        $item = BlogSection::query()->create([
            'type' => $data['type'],
            'display_order' => $data['display_order'] ?? 0,
            'kicker' => $data['kicker'] ?? null,
            'heading' => $data['heading'] ?? null,
            'body' => $data['body'] ?? null,
            'image_url' => $imageUrl,
            'comparison_data' => $data['comparison_data'] ?? null,
        ]);

        return response()->json([
            'message' => 'Blog section created successfully.',
            'section' => $item,
        ], 201);
    }

    public function update(Request $request, BlogSection $blogSection): JsonResponse
    {
        $data = $request->validate([
            'type' => ['nullable', Rule::in(['description', 'comparison'])],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'kicker' => ['nullable', 'string', 'max:255'],
            'heading' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'comparison_data' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:10240'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        $nextImageUrl = $blogSection->image_url;

        $shouldRemoveImage = (bool) ($data['remove_image'] ?? false);

        if ($shouldRemoveImage) {
            if ($blogSection->image_url && str_starts_with($blogSection->image_url, '/storage/')) {
                $existingPath = Str::after($blogSection->image_url, '/storage/');
                if ($existingPath !== '') {
                    Storage::disk('public')->delete($existingPath);
                }
            }
            $nextImageUrl = null;
        }

        if ($request->hasFile('image')) {
            if ($blogSection->image_url && str_starts_with($blogSection->image_url, '/storage/')) {
                $existingPath = Str::after($blogSection->image_url, '/storage/');
                if ($existingPath !== '') {
                    Storage::disk('public')->delete($existingPath);
                }
            }

            $path = $request->file('image')->store('blog-sections', 'public');
            $nextImageUrl = '/storage/'.$path;
        }

        $updateData = [
            'type' => $data['type'] ?? $blogSection->type,
            'display_order' => $data['display_order'] ?? $blogSection->display_order,
            'kicker' => array_key_exists('kicker', $data) ? $data['kicker'] : $blogSection->kicker,
            'heading' => array_key_exists('heading', $data) ? $data['heading'] : $blogSection->heading,
            'body' => array_key_exists('body', $data) ? $data['body'] : $blogSection->body,
            'image_url' => $nextImageUrl,
            'comparison_data' => array_key_exists('comparison_data', $data) ? $data['comparison_data'] : $blogSection->comparison_data,
        ];

        $blogSection->update($updateData);

        return response()->json([
            'message' => 'Blog section updated successfully.',
            'section' => $blogSection->fresh(),
        ]);
    }

    public function destroy(BlogSection $blogSection): JsonResponse
    {
        if ($blogSection->image_url && str_starts_with($blogSection->image_url, '/storage/')) {
            $existingPath = Str::after($blogSection->image_url, '/storage/');
            if ($existingPath !== '') {
                Storage::disk('public')->delete($existingPath);
            }
        }

        $blogSection->delete();

        return response()->json([
            'message' => 'Blog section deleted successfully.',
        ]);
    }
}
