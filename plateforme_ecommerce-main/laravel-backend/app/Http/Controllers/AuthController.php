<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * User registration (Customer)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'address' => 'nullable|string',
            'phone' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'address' => $request->address,
            'phone' => $request->phone,
            'role' => 'customer' // Default role
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'address' => $user->address,
                'phone' => $user->phone
            ]
        ], 201);
    }

    /**
     * User login
     */
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        $validator = Validator::make($credentials, [
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if (!$token = auth()->attempt($credentials)) {
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        $user = auth()->user();

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'address' => $user->address,
                'phone' => $user->phone
            ]
        ], 200);
    }

    /**
     * Update customer profile
     */
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Using MongoDB Eloquent save
        $user->name = $request->name;
        $user->address = $request->address;
        $user->phone = $request->phone;
        $user->save();

        return response()->json([
            'id' => $user->_id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'address' => $user->address,
            'phone' => $user->phone
        ], 200);
    }

    /**
     * Retrieve current user details
     */
    public function me()
    {
        $user = auth()->user();
        return response()->json([
            'id' => $user->_id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'address' => $user->address,
            'phone' => $user->phone
        ]);
    }

    /**
     * List all customers (Admin restricted)
     */
    public function listClients()
    {
        $clients = User::where('role', 'customer')->get(['_id', 'name', 'email', 'phone', 'address', 'created_at']);
        
        $formatted = $clients->map(function($c) {
            return [
                'id' => $c->_id,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'address' => $c->address,
                'createdAt' => $c->created_at ? $c->created_at->toIso8601String() : null
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Logout
     */
    public function logout()
    {
        auth()->logout();
        return response()->json(['message' => 'Déconnexion réussie.']);
    }
}
