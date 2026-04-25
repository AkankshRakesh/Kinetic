<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class GuestInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $guestName;
    public $guestEmail;
    public $customMessage;
    public $acceptUrl;
    public $additionalGuestNames;

    /**
     * Create a new message instance.
     */
    public function __construct($guestName, $guestEmail, $customMessage = null, $acceptUrl = null, $additionalGuestNames = [])
    {
        $this->guestName = $guestName;
        $this->guestEmail = $guestEmail;
        $this->customMessage = $customMessage;
        $this->acceptUrl = $acceptUrl;
        $this->additionalGuestNames = $additionalGuestNames;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('You are invited to Kinetic Labs')
            ->view('emails.guest_invitation')
            ->with([
                'guestName' => $this->guestName,
                'guestEmail' => $this->guestEmail,
                'customMessage' => $this->customMessage,
                'acceptUrl' => $this->acceptUrl,
                'additionalGuestNames' => $this->additionalGuestNames,
            ]);
    }
}
