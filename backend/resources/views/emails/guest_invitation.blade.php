<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $eventName }} Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; background: #18181b; color: white; padding: 2rem;">
    <h2 style="color: #ffb77b;">Hello, {{ $guestName }}!</h2>
    <p>You have been invited to {{ $eventName }}.</p>
    @if($customMessage)
        <p><strong>Message:</strong> {{ $customMessage }}</p>
    @endif
    <p>Your invitation email: <strong>{{ $guestEmail }}</strong></p>
    @if(! empty($additionalGuestNames))
        <p>This invitation also includes:</p>
        <ul>
            @foreach($additionalGuestNames as $additionalGuestName)
                <li>{{ $additionalGuestName }}</li>
            @endforeach
        </ul>
    @endif
    @if($acceptUrl)
        <p style="margin-top: 2rem;">
            <a href="{{ $acceptUrl }}" style="display: inline-block; background: #ffb77b; color: #2e1500; padding: 12px 18px; text-decoration: none; font-weight: 700; border-radius: 4px;">
                Accept invitation
            </a>
        </p>
        <p style="color: #888; font-size: 12px;">If the button does not work, open this link: {{ $acceptUrl }}</p>
    @endif
    <p style="margin-top: 2rem; color: #888; font-size: 12px;">If you have any questions, please contact support@kineticlabs.com</p>
</body>
</html>
