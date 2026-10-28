<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CouponController extends Controller
{
    /**
     * List all active coupons (Admin)
     */
    public function index()
    {
        $coupons = Coupon::all();
        
        $formatted = $coupons->map(function($c) {
            return [
                'id' => $c->_id,
                'code' => $c->code,
                'type' => $c->type,
                'value' => $c->value,
                'minAmount' => $c->minAmount,
                'expiryDate' => $c->expiryDate ? $c->expiryDate->toIso8601String() : null,
                'active' => $c->active
            ];
        });

        return response()->json($formatted, 200);
    }

    /**
     * Check coupon code eligibility
     */
    public function validateCode(Request $request, $code)
    {
        $coupon = Coupon::where('code', strtoupper($code))->first();

        if (!$coupon) {
            return response()->json(['message' => 'Code promotionnel inexistant.'], 404);
        }

        if (!$coupon->active) {
            return response()->json(['message' => 'Ce code promotionnel a été désactivé.'], 400);
        }

        if ($coupon->expiryDate && now()->gt($coupon->expiryDate)) {
            return response()->json(['message' => 'Ce code promotionnel a expiré.'], 400);
        }

        return response()->json([
            'id' => $coupon->_id,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'minAmount' => $coupon->minAmount
        ], 200);
    }

    /**
     * Store new promo coupon (Admin)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:255|unique:coupons',
            'type' => 'required|string|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'minAmount' => 'nullable|numeric|min:0',
            'expiryDate' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $coupon = Coupon::create([
            'code' => strtoupper($request->code),
            'type' => $request->type,
            'value' => (double) $request->value,
            'minAmount' => $request->minAmount ? (double) $request->minAmount : 0.0,
            'expiryDate' => $request->expiryDate ? new \DateTime($request->expiryDate) : null,
            'active' => true
        ]);

        return response()->json([
            'id' => $coupon->_id,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'minAmount' => $coupon->minAmount,
            'expiryDate' => $coupon->expiryDate ? $coupon->expiryDate->toIso8601String() : null,
            'active' => $coupon->active
        ], 201);
    }

    /**
     * Destroy coupon (Admin)
     */
    public function destroy($id)
    {
        $coupon = Coupon::find($id);
        if (!$coupon) {
            return response()->json(['message' => 'Code promo introuvable.'], 404);
        }

        $coupon->delete();
        return response()->json(['message' => 'Code promo supprimé avec succès.'], 200);
    }
}
