<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Order extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'orders';

    protected $fillable = [
        'userId',
        'userName',
        'items', // Embedded array in MongoDB style
        'total',
        'address',
        'phone',
        'status', // pending, processing, shipped, delivered, cancelled
        'paymentMethod',
        'couponCode',
        'discountAmount'
    ];

    protected $casts = [
        'items' => 'array',
        'total' => 'double',
        'discountAmount' => 'double',
    ];

    /**
     * Relationship with User
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'userId', '_id');
    }
}
