<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $supportsImages = $this->supportsImagesColumn();

        return response()->json([
            'products' => Product::query()
                ->when(! $supportsImages, fn ($query) => $query->select($this->baseProductColumns()))
                ->latest()
                ->get()
                ->map(fn (Product $product) => $this->formatProduct($product, $supportsImages)),
        ]);
    }

    public function show(string $product): JsonResponse
    {
        $supportsImages = $this->supportsImagesColumn();

        $item = Product::query()
            ->when(! $supportsImages, fn ($query) => $query->select($this->baseProductColumns()))
            ->where('slug', $product)
            ->orWhere('id', $product)
            ->firstOrFail();

        $formatted = $this->formatProduct($item, $supportsImages);
        $formatted['descriptions'] = $item->descriptions()->orderBy('display_order')->get();

        return response()->json([
            'product' => $formatted,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateProduct($request);
        $data = $this->normalizeProductData($data);
        $data['slug'] = $this->resolveSlug($data['name']);
        unset($data['existing_images'], $data['image_files']);
        $images = $this->storeImages($request);
        if ($this->supportsImagesColumn()) {
            $data['images'] = $images;
        }
        $data['image_url'] = $images[0] ?? null;

        $product = Product::query()->create($data);

        return response()->json([
            'message' => 'Product created successfully.',
            'product' => $this->formatProduct($product->fresh(), $this->supportsImagesColumn()),
        ], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $supportsImages = $this->supportsImagesColumn();
        $data = $this->validateProduct($request, $product->id);
        $data = $this->normalizeProductData($data);
        $data['slug'] = $this->resolveSlug($data['name'], $product->id);

        $requestedExistingImages = collect($request->input('existing_images', []))
            ->filter(fn ($image) => is_string($image) && trim($image) !== '')
            ->map(fn ($image) => trim((string) $image))
            ->values()
            ->all();

        $mainImageInput = $request->input('image_url');

        $currentImages = $supportsImages
            ? ($product->images ?: array_filter([$product->image_url]))
            : array_filter([$product->image_url]);

        $imagesToDelete = array_diff($currentImages, $requestedExistingImages);

        if (! empty($imagesToDelete)) {
            $this->deleteStoredImages($imagesToDelete);
        }

        unset($data['existing_images'], $data['image_files']);

        $updatedImages = $requestedExistingImages;

        if ($request->hasFile('image_files')) {
            $images = $this->storeImages($request);
            $updatedImages = array_values(array_filter([...$images, ...$updatedImages]));
            if ($supportsImages) {
                $data['images'] = $updatedImages;
            }
            $data['image_url'] = $this->determineMainImage($mainImageInput, $updatedImages, $images);
        } else {
            if ($supportsImages) {
                $data['images'] = $updatedImages;
            }
            $data['image_url'] = $this->determineMainImage($mainImageInput, $updatedImages, []);
        }

        $product->update($data);

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $this->formatProduct($product->fresh(), $supportsImages),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->deleteStoredImages($product->images ?: array_filter([$product->image_url]));
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully.',
        ]);
    }

    private function validateProduct(Request $request, ?int $productId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'short_description' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string', 'max:2048'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'integer', 'min:0'],
            'badge' => ['nullable', 'string', 'max:255'],
            'image_files' => ['nullable', 'array'],
            'image_files.*' => ['image', 'max:10240'],
            'affiliate_commission' => ['nullable', 'numeric', 'min:0'],
            'shipping_rate' => ['nullable', 'numeric', 'min:0'],
            'prepaid_discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'gst_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'cod_charges' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'all_charges_included' => ['nullable', 'boolean'],
            'comparison_data' => ['nullable', 'string'],
            'comparison_display_order' => ['nullable', 'integer', 'min:0'],
            'existing_images' => ['nullable', 'array'],
            'existing_images.*' => ['string'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($productId),
            ],
        ]);
    }

    private function resolveSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug !== '' ? $baseSlug : 'product';
        $counter = 1;

        while (
            Product::query()
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    private function normalizeProductData(array $data): array
    {
        $data['short_description'] = isset($data['short_description']) && trim((string) $data['short_description']) !== ''
            ? trim((string) $data['short_description'])
            : null;
        $data['video_url'] = isset($data['video_url']) && trim((string) $data['video_url']) !== ''
            ? trim((string) $data['video_url'])
            : null;
        $data['original_price'] = $data['original_price'] ?? null;
        $data['discount'] = $data['discount'] ?? null;
        $data['badge'] = $data['badge'] ?? null;
        $data['affiliate_commission'] = isset($data['affiliate_commission']) && is_numeric($data['affiliate_commission'])
            ? (float) $data['affiliate_commission']
            : 0;
        $data['shipping_rate'] = isset($data['shipping_rate']) && is_numeric($data['shipping_rate'])
            ? round((float) $data['shipping_rate'], 2)
            : 0;
        $data['prepaid_discount_percent'] = isset($data['prepaid_discount_percent']) && is_numeric($data['prepaid_discount_percent'])
            ? max(0, min(100, round((float) $data['prepaid_discount_percent'], 2)))
            : 0;
        $data['gst_percent'] = isset($data['gst_percent']) && is_numeric($data['gst_percent'])
            ? max(0, min(100, round((float) $data['gst_percent'], 2)))
            : 0;
        $data['cod_charges'] = isset($data['cod_charges']) && is_numeric($data['cod_charges'])
            ? round((float) $data['cod_charges'], 2)
            : 0;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['all_charges_included'] = (bool) ($data['all_charges_included'] ?? false);
        $data['comparison_data'] = $data['comparison_data'] ?? null;
        $data['comparison_display_order'] = $data['comparison_display_order'] ?? 999;

        return $data;
    }

    private function storeImages(Request $request): array
    {
        if (! $request->hasFile('image_files')) {
            return [];
        }

        return collect($request->file('image_files'))
            ->map(function ($file) {
                $path = $file->store('gallery', 'public');

                return '/storage/'.$path;
            })
            ->values()
            ->all();
    }

    private function deleteStoredImages(array $imageUrls): void
    {
        foreach ($imageUrls as $imageUrl) {
            if (! $imageUrl || ! str_starts_with($imageUrl, '/storage/')) {
                continue;
            }

            $path = Str::after($imageUrl, '/storage/');

            if ($path !== '') {
                Storage::disk('public')->delete($path);
            }
        }
    }

    private function determineMainImage(?string $requested, array $allImages, array $newImages): ?string
    {
        $allImages = array_values(array_filter($allImages));

        if ($requested && in_array($requested, $allImages, true)) {
            return $requested;
        }

        if (! empty($newImages)) {
            return $newImages[0] ?? null;
        }

        return $allImages[0] ?? null;
    }

    private function supportsImagesColumn(): bool
    {
        return Schema::hasColumn('products', 'images');
    }

    private function baseProductColumns(): array
    {
        return [
            'id',
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
            'affiliate_commission',
            'shipping_rate',
            'prepaid_discount_percent',
            'gst_percent',
            'is_active',
            'all_charges_included',
            'comparison_data',
            'comparison_display_order',
            'created_at',
            'updated_at',
        ];
    }

    private function formatProduct(Product $product, bool $supportsImages): array
    {
        $payload = $product->toArray();

        if (! $supportsImages) {
            $payload['images'] = $product->image_url ? [$product->image_url] : [];
        }

        return $payload;
    }
}
