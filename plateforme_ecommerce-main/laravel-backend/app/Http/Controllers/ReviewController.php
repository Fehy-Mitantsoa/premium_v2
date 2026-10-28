<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * List all reviews for a specific product
     */
    public function index($productId)
    {
        // Standalone or embedded reviews in MongoDB
        $reviews = Review::where('productId', $productId)->orderBy('created_at', 'desc')->get();

        $formatted = $reviews->map(function($r) {
            return [
                'id' => $r->_id,
                'userName' => $r->userName,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'createdAt' => $r->created_at ? $r->created_at->toIso8601String() : null
            ];
        });

        return response()->json($formatted, 200);
    }

    /**
     * Store customer review
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'productId' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:5'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $product = Product::find($request->productId);
        if (!$product) {
            return response()->json(['message' => 'Produit inexistant.'], 404);
        }

        $review = Review::create([
            'productId' => $request->productId,
            'userId' => $user->_id,
            'userName' => $user->name,
            'rating' => (int) $request->rating,
            'comment' => $request->comment
        ]);

        return response()->json([
            'id' => $review->_id,
            'userName' => $review->userName,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'createdAt' => $review->created_at->toIso8601String()
        ], 210);
    }
}
