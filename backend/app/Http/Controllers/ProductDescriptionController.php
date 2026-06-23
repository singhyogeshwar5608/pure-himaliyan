<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductDescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductDescriptionController extends Controller
{
    public function index(Product $product): JsonResponse
    {
        return response()->json([
            'descriptions' => $product->descriptions()->orderBy('display_order')->get(),
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'kicker' => ['nullable', 'string', 'max:255'],
            'heading' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'image' => ['nullable', 'image', 'max:10240'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $imageUrl = null;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('product-descriptions', 'public');
            $imageUrl = '/storage/'.$path;
        }

        $description = $product->descriptions()->create([
            'kicker' => trim($data['kicker'] ?? 'Description'),
            'heading' => trim($data['heading']),
            'body' => trim($data['body']),
            'image_url' => $imageUrl,
            'display_order' => $data['display_order'] ?? 0,
        ]);

        return response()->json([
            'message' => 'Description section created.',
            'description' => $description,
        ], 201);
    }

    public function update(Request $request, Product $product, ProductDescription $description): JsonResponse
    {
        if ($description->product_id !== $product->id) {
            return response()->json(['message' => 'Description does not belong to this product.'], 404);
        }

        $data = $request->validate([
            'kicker' => ['nullable', 'string', 'max:255'],
            'heading' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'image' => ['nullable', 'image', 'max:10240'],
            'remove_image' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $nextImageUrl = $description->image_url;

        $shouldRemoveImage = (bool) ($data['remove_image'] ?? false);

        if ($shouldRemoveImage) {
            if ($description->image_url && str_starts_with($description->image_url, '/storage/')) {
                $existingPath = Str::after($description->image_url, '/storage/');
                if ($existingPath !== '') {
                    Storage::disk('public')->delete($existingPath);
                }
            }
            $nextImageUrl = null;
        }

        if ($request->hasFile('image')) {
            if ($description->image_url && str_starts_with($description->image_url, '/storage/')) {
                $existingPath = Str::after($description->image_url, '/storage/');
                if ($existingPath !== '') {
                    Storage::disk('public')->delete($existingPath);
                }
            }

            $path = $request->file('image')->store('product-descriptions', 'public');
            $nextImageUrl = '/storage/'.$path;
        }

        $description->update([
            'kicker' => trim($data['kicker'] ?? $description->kicker),
            'heading' => trim($data['heading']),
            'body' => trim($data['body']),
            'image_url' => $nextImageUrl,
            'display_order' => $data['display_order'] ?? $description->display_order,
        ]);

        return response()->json([
            'message' => 'Description section updated.',
            'description' => $description->fresh(),
        ]);
    }

    public function destroy(Product $product, ProductDescription $description): JsonResponse
    {
        if ($description->product_id !== $product->id) {
            return response()->json(['message' => 'Description does not belong to this product.'], 404);
        }

        if ($description->image_url && str_starts_with($description->image_url, '/storage/')) {
            $existingPath = Str::after($description->image_url, '/storage/');
            if ($existingPath !== '') {
                Storage::disk('public')->delete($existingPath);
            }
        }

        $description->delete();

        return response()->json([
            'message' => 'Description section deleted.',
        ]);
    }
}
