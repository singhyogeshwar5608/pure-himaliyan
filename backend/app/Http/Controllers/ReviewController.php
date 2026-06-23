<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // Get approved reviews for a specific product
    public function index($productId)
    {
        \Log::info("Fetching reviews for product: " . $productId);
        $reviews = Review::where('product_id', $productId)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();
        
        \Log::info("Found " . $reviews->count() . " approved reviews");

        return response()->json($reviews);
    }

    // Submit a new review
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'user_name' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string',
        ]);

        $review = Review::create([
            'product_id' => $validated['product_id'],
            'user_name' => $validated['user_name'],
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'is_approved' => false, // Default to false for moderation
        ]);

        return response()->json($review, 201);
    }

    // Admin: Get all reviews
    public function adminIndex()
    {
        $reviews = Review::with('product')->orderBy('created_at', 'desc')->get();
        return response()->json($reviews);
    }

    // Admin: Update review status (approve/hide)
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'is_approved' => 'required|boolean',
        ]);

        $review = Review::findOrFail($id);
        $review->update(['is_approved' => $validated['is_approved']]);

        return response()->json($review);
    }

    // Admin: Delete review
    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return response()->json(['message' => 'Review deleted successfully']);
    }
}
