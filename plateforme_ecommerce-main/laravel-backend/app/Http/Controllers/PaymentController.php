<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Category;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * Compile statistical report for Admin Dashboard (Bento + Charts)
     */
    public function dashboardStats()
    {
        // 1. Bento aggregates
        $totalOrders = Order::count();
        $totalProducts = Product::count();
        $totalClients = User::where('role', 'customer')->count();
        $totalSales = Order::where('status', '!=', 'cancelled')->sum('total');

        // 2. Compute 7 Days Sales History for AreaChart
        $salesHistory = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dateString = $date->format('Y-m-d');
            $dateLabel = $date->locale('fr')->isoFormat('D MMM');

            // MongoDB date range matching
            $startOfDay = clone $date->startOfDay();
            $endOfDay = clone $date->endOfDay();

            $dailyTotal = Order::where('status', '!=', 'cancelled')
                ->whereBetween('created_at', [$startOfDay, $endOfDay])
                ->sum('total');

            $salesHistory[] = [
                'date' => $dateLabel,
                'amount' => (double) $dailyTotal
            ];
        }

        // 3. Compute Category Sales breakdown for BarChart
        $categories = Category::all();
        $categorySales = [];

        foreach ($categories as $cat) {
            // Count total item units sold for products in this category
            $productsInCat = Product::where('categoryId', $cat->_id)->pluck('_id')->toArray();
            
            // Match order items
            $ordersWithItems = Order::where('status', '!=', 'cancelled')->get();
            $soldCount = 0;

            foreach ($ordersWithItems as $ord) {
                foreach ($ord->items as $item) {
                    if (in_array($item['productId'], $productsInCat)) {
                        $soldCount += $item['quantity'];
                    }
                }
            }

            $categorySales[] = [
                'categoryName' => $cat->name,
                'count' => $soldCount
            ];
        }

        return response()->json([
            'totalSales' => round($totalSales, 2),
            'totalOrders' => $totalOrders,
            'totalClients' => $totalClients,
            'totalProducts' => $totalProducts,
            'salesHistory' => $salesHistory,
            'categorySales' => $categorySales
        ], 200);
    }
}
