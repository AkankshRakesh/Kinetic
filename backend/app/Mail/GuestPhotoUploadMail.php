<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class GuestPhotoUploadMail extends Mailable
{
    public function __construct(
        public string $guestName,
        public string $guestEmail,
        public string $eventName,
        public string $uploadUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                config('mail.from.address'),
                config('mail.from.name'),
            ),
            subject: "{$this->eventName} - Share Your Photos",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.guest-photo-upload',
            with: [
                'guestName' => $this->guestName,
                'eventName' => $this->eventName,
                'uploadUrl' => $this->uploadUrl,
            ],
        );
    }
}
