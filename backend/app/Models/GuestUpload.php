<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestUpload extends Model
{
    use HasFactory;

    protected $table = 'event_guest_uploads';

    protected $fillable = [
        'event_id',
        'share_token',
        'guest_name',
        'guest_email',
        'image_paths',
        'upload_count',
    ];

    protected function casts(): array
    {
        return [
            'image_paths' => 'array',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
