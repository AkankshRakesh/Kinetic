<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_user_id',
        'name',
        'location',
        'event_date',
        'region',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(GuestInvitation::class);
    }

    public function guestUploads(): HasMany
    {
        return $this->hasMany(GuestUpload::class);
    }
}
