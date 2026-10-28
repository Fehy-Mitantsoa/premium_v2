<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    /**
     * List products with pagination & rich filtration
     */
    public function index(Request $request)
    {
        $query = Product::query();

        // 1. Text Search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // 2. Filter by Category
        if ($request->has('categoryId') && !empty($request->categoryId)) {
            $query->where('categoryId', $request->categoryId);
        }

        // 3. Filter by Brand
        if ($request->has('brand') && !empty($request->brand)) {
            $query->where('brand', $request->brand);
        }

        // 4. Filter by Price Range
        if ($request->has('minPrice')) {
            $query->where('price', '>=', (double) $request->minPrice);
        }
        if ($request->has('maxPrice')) {
            $query->where('price', '<=', (double) $request->maxPrice);
        }

        // 5. Featured only
        if ($request->has('featured')) {
            $query->where('featured', true);
        }

        // 6. Sorting logic
        $sort = $request->get('sort', 'newest');
        if ($sort === 'price-asc') {
            $query->orderBy('price', 'asc');
        } elseif ($sort === 'price-desc') {
            $query->orderBy('price', 'desc');
        } else {
            // Newest first
            $query->orderBy('created_at', 'desc');
        }

        // 7. Pagination
        $limit = (int) $request->get('limit', 12);
        $products = $query->paginate($limit);

        // Map output structure
        $formattedProducts = collect($products->items())->map(function($p) {
            return [
                'id' => $p->_id,
                'name' => $p->name,
                'slug' => $p->slug,
                'description' => $p->description,
                'price' => $p->price,
                'discountPrice' => $p->discountPrice,
                'stock' => $p->stock,
                'categoryId' => $p->categoryId,
                'brand' => $p->brand,
                'images' => $p->images,
                'featured' => $p->featured
            ];
        });

        return response()->json([
            'products' => $formattedProducts,
            'total' => $products->total(),
            'currentPage' => $products->currentPage(),
            'lastPage' => $products->lastPage(),
            'limit' => $limit
        ], 200);
    }

    /**
     * Show single product details by slug
     */
    public function show($slug)
    {
        $product = Product::where('slug', $slug)->first();
        if (!$product) {
            return response()->json(['message' => 'Produit introuvable.'], 404);
        }

        return response()->json([
            'id' => $product->_id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'price' => $product->price,
            'discountPrice' => $product->discountPrice,
            'stock' => $product->stock,
            'categoryId' => $product->categoryId,
            'brand' => $product->brand,
            'images' => $product->images,
            'featured' => $product->featured
        ], 200);
    }

    /**
     * Store a new product (Admin)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'brand' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'discountPrice' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'categoryId' => 'required|string',
            'description' => 'nullable|string',
            'images' => 'required|array',
            'featured' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $slug = Str::slug($request->name);

        $product = Product::create([
            'name' => $request->name,
            'slug' => $slug,
            'brand' => $request->brand,
            'price' => (double) $request->price,
            'discountPrice' => $request->discountPrice ? (double) $request->discountPrice : null,
            'stock' => (int) $request->stock,
            'categoryId' => $request->categoryId,
            'description' => $request->description,
            'images' => $request->images,
            'featured' => (bool) $request->featured
        ]);

        return response()->json([
            'id' => $product->_id,
            'name' => $product->name,
            'slug' => $product->slug,
            'brand' => $product->brand,
            'price' => $product->price,
            'discountPrice' => $product->discountPrice,
            'stock' => $product->stock,
            'categoryId' => $product->categoryId,
            'images' => $product->images,
            'featured' => $product->featured
        ], 201);
    }

    /**
     * Update product details (Admin)
     */
    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Produit introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'brand' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'discountPrice' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'categoryId' => 'required|string',
            'description' => 'nullable|string',
            'images' => 'required|array',
            'featured' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $product->name = $request->name;
        $product->slug = Str::slug($request->name);
        $product->brand = $request->brand;
        $product->price = (double) $request->price;
        $product->discountPrice = $request->discountPrice ? (double) $request->discountPrice : null;
        $product->stock = (int) $request->stock;
        $product->categoryId = $request->categoryId;
        $product->description = $request->description;
        $product->images = $request->images;
        $product->featured = (bool) $request->featured;
        $product->save();

        return response()->json([
            'id' => $product->_id,
            'name' => $product->name,
            'slug' => $product->slug,
            'brand' => $product->brand,
            'price' => $product->price,
            'discountPrice' => $product->discountPrice,
            'stock' => $product->stock,
            'categoryId' => $product->categoryId,
            'images' => $product->images,
            'featured' => $product->featured
        ], 200);
    }

    /**
     * Delete product reference (Admin)
     */
    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Produit introuvable.'], 404);
        }

        $product->delete();
        return response()->json(['message' => 'Produit supprimé du catalogue.'], 200);
    }
}
