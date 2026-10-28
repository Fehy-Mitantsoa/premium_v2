<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    /**
     * List current user's order history (or all orders if admin requested)
     */
    public function index()
    {
        $user = auth()->user();
        
        if ($user->role === 'admin') {
            // Admin sees all shop orders
            $orders = Order::orderBy('created_at', 'desc')->get();
        } else {
            // Customer only sees their orders
            $orders = Order::where('userId', $user->_id)->orderBy('created_at', 'desc')->get();
        }

        $formatted = $orders->map(function($o) {
            return [
                'id' => $o->_id,
                'userId' => $o->userId,
                'userName' => $o->userName,
                'items' => $o->items,
                'total' => $o->total,
                'address' => $o->address,
                'phone' => $o->phone,
                'status' => $o->status,
                'paymentMethod' => $o->paymentMethod,
                'couponCode' => $o->couponCode,
                'discountAmount' => $o->discountAmount,
                'createdAt' => $o->created_at ? $o->created_at->toIso8601String() : null
            ];
        });

        return response()->json($formatted, 200);
    }

    /**
     * Save/Create a new purchase order
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.productId' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'total' => 'required|numeric|min:0',
            'address' => 'required|string',
            'phone' => 'required|string',
            'paymentMethod' => 'nullable|string',
            'couponCode' => 'nullable|string',
            'discountAmount' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Loop items to check stock and decrement
        foreach ($request->items as $item) {
            $product = Product::find($item['productId']);
            if (!$product) {
                return response()->json(['message' => "Le produit {$item['name']} n'existe plus."], 404);
            }
            if ($product->stock < $item['quantity']) {
                return response()->json(['message' => "Stock insuffisant pour le produit : {$product->name}."], 400);
            }
            // Decrement stock
            $product->stock = $product->stock - $item['quantity'];
            $product->save();
        }

        $order = Order::create([
            'userId' => $user->_id,
            'userName' => $user->name,
            'items' => $request->items,
            'total' => (double) $request->total,
            'address' => $request->address,
            'phone' => $request->phone,
            'status' => 'pending', // default status
            'paymentMethod' => $request->paymentMethod ?: 'Credit Card',
            'couponCode' => $request->couponCode,
            'discountAmount' => $request->discountAmount ? (double) $request->discountAmount : null
        ]);

        return response()->json([
            'id' => $order->_id,
            'userId' => $order->userId,
            'userName' => $order->userName,
            'total' => $order->total,
            'address' => $order->address,
            'phone' => $order->phone,
            'status' => $order->status,
            'paymentMethod' => $order->paymentMethod,
            'createdAt' => $order->created_at->toIso8601String()
        ], 201);
    }

    /**
     * Update order status (Admin)
     */
    public function updateStatus(Request $request, $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['message' => 'Commande introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:pending,processing,shipped,delivered,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $order->status = $request->status;
        $order->save();

        return response()->json([
            'id' => $order->_id,
            'status' => $order->status
        ], 200);
    }
}
