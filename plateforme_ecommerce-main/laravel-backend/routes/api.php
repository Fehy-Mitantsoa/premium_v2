<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\CouponController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// --- PUBLIC ROUTES ---

// Authentification
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Produits
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);

// Catégories
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

// Avis Clients
Route::get('/reviews/{productId}', [ReviewController::class, 'index']);


// --- SECURED CUSTOMER ROUTES (Requires JWT auth) ---
Route::middleware(['auth:api'])->group(function () {
    
    // Profil utilisateur
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Gestion du panier (synchronisation serveur optionnelle)
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/add', [CartController::class, 'add']);
    Route::put('/cart/update/{id}', [CartController::class, 'update']);
    Route::delete('/cart/remove/{id}', [CartController::class, 'remove']);
    Route::post('/cart/clear', [CartController::class, 'clear']);

    // Validation du code promo
    Route::get('/coupons/validate/{code}', [CouponController::class, 'validateCode']);

    // Commandes
    Route::get('/orders', [OrderController::class, 'index']); // Get logged-in user's orders
    Route::post('/orders', [OrderController::class, 'store']); // Create order + payment simulation

    // Soumission d'un avis client
    Route::post('/reviews', [ReviewController::class, 'store']);
});


// --- ADMIN SECURED ROUTES (Requires JWT auth + Admin role middleware) ---
Route::middleware(['auth:api', 'role:admin'])->group(function () {
    
    // Statistiques Dashboard
    Route::get('/admin/stats', [PaymentController::class, 'dashboardStats']);
    Route::get('/admin/clients', [AuthController::class, 'listClients']);

    // CRUD Catégories (Modifications)
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // CRUD Produits (Modifications)
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Statut des commandes
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);

    // Gestion des promotions & coupons
    Route::get('/coupons', [CouponController::class, 'index']);
    Route::post('/coupons', [CouponController::class, 'store']);
    Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);
});
