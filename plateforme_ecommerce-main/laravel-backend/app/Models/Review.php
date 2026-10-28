<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Review extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'reviews';

    protected $fillable = [
        'productId',
        'userId',
        'userName',
        'rating',
        'comment'
    ];

    protected $casts = [
        'rating' => 'integer'
    ];

    /**
     * Relationship with Product
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'productId', '_id');
    }
}
