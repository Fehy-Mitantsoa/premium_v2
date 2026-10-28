<?php
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Coupon extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'coupons';

    protected $fillable = [
        'code',
        'type', // percentage, fixed
        'value',
        'minAmount',
        'expiryDate',
        'active'
    ];

    protected $casts = [
        'value' => 'double',
        'minAmount' => 'double',
        'expiryDate' => 'datetime',
        'active' => 'boolean'
    ];
}
