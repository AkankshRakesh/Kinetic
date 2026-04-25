<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestInvitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'invited_by_user_id',
        'event_id',
        'guest_name',
        'guest_email',
        'custom_message',
        'additional_guest_names',
        'people_count',
        'guest_response_message',
        'status',
        'accept_token_hash',
        'sent_at',
        'accepted_at',
        'rejected_at',
    ];

    protected $hidden = [
        'accept_token_hash',
    ];

    protected function casts(): array
    {
        return [
            'additional_guest_names' => 'array',
            'people_count' => 'integer',
            'sent_at' => 'datetime',
            'accepted_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
