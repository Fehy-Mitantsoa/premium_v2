<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    /**
     * List all categories
     */
    public function index()
    {
        $categories = Category::all();
        
        $formatted = $categories->map(function($c) {
            return [
                'id' => $c->_id,
                'name' => $c->name,
                'slug' => $c->slug,
                'description' => $c->description,
                'image' => $c->image
            ];
        });

        return response()->json($formatted, 200);
    }

    /**
     * Store new category (Admin)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|url'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $slug = Str::slug($request->name);

        $category = Category::create([
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
            'image' => $request->image ?: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=600'
        ]);

        return response()->json([
            'id' => $category->_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'image' => $category->image
        ], 210); // 201 Created
    }

    /**
     * Get single category
     */
    public function show($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Catégorie introuvable.'], 404);
        }

        return response()->json([
            'id' => $category->_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'image' => $category->image
        ], 200);
    }

    /**
     * Update category (Admin)
     */
    public function update(Request $request, $id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Catégorie introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|url'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $category->name = $request->name;
        $category->slug = Str::slug($request->name);
        $category->description = $request->description;
        if ($request->has('image')) {
            $category->image = $request->image;
        }
        $category->save();

        return response()->json([
            'id' => $category->_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'image' => $category->image
        ], 200);
    }

    /**
     * Destroy category (Admin)
     */
    public function destroy($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Catégorie introuvable.'], 404);
        }

        $category->delete();
        return response()->json(['message' => 'Catégorie supprimée avec succès.'], 200);
    }
}
