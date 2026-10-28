<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model; // Compatible with MongoDB Laravel driver

class Product extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'products';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'discountPrice',
        'stock',
        'categoryId',
        'brand',
        'images', // Array of image URLs
        'featured'
    ];

    protected $casts = [
        'price' => 'double',
        'discountPrice' => 'double',
        'stock' => 'integer',
        'images' => 'array',
        'featured' => 'boolean',
    ];

    /**
     * Relationship with Category
     */
    public function category()
    {
        return $this->belongsTo(Category::class, 'categoryId', '_id');
    }

    /**
     * Relationship with Reviews
     */
    public function reviews()
    {
        return $this->hasMany(Review::class, 'productId', '_id');
    }
}
