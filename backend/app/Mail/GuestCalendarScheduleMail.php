<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GuestCalendarScheduleMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $guestName,
        public string $guestEmail,
        public string $eventName,
        public string $calendarUrl,
        public ?string $eventDate = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Event Schedule: {$this->eventName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.guest-calendar-schedule',
            with: [
                'guestName' => $this->guestName,
                'eventName' => $this->eventName,
                'calendarUrl' => $this->calendarUrl,
                'eventDate' => $this->eventDate,
            ],
        );
    }
}
