<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Category extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'categories';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image'
    ];

    /**
     * Relationship with Products
     */
    public function products()
    {
        return $this->hasMany(Product::class, 'categoryId', '_id');
    }
}
