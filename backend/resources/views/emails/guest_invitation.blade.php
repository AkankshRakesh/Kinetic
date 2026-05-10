<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $eventName }} Invitation</title>
</head>

<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333;">

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
           style="background-color:#f4f4f7;padding:40px 20px;">

        <tr>
            <td align="center">

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                       style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">

                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#ffb77b 0%,#ff9d5c 100%);padding:48px 32px;text-align:center;">

                            <div style="font-size:42px;line-height:1;margin-bottom:16px;">
                                ✨
                            </div>

                            <h1 style="margin:0;font-size:30px;line-height:1.2;color:#ffffff;font-weight:700;">
                                You're Invited
                            </h1>

                            <p style="margin:14px 0 0;color:rgba(255,255,255,0.92);font-size:16px;line-height:1.6;">
                                Join us for
                                <strong>{{ $eventName }}</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:40px 32px;">

                            <p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#111827;">
                                Hello {{ $guestName }},
                            </p>

                            <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#4b5563;">
                                You’ve been invited to
                                <strong>{{ $eventName }}</strong>.
                                We’d love to have you join us for this special occasion.
                            </p>

                            @if($customMessage)
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                                       style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;margin:28px 0;">
                                    <tr>
                                        <td style="padding:22px;">

                                            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:0.5px;">
                                                Personal Message
                                            </p>

                                            <p style="margin:0;font-size:15px;line-height:1.8;color:#7c2d12;">
                                                {{ $customMessage }}
                                            </p>

                                        </td>
                                    </tr>
                                </table>
                            @endif

                            <!-- Guest Details -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                                   style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:0 0 30px;">
                                <tr>
                                    <td style="padding:24px;">

                                        <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.5px;">
                                            Invitation Details
                                        </p>

                                        <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#4b5563;">
                                            <strong>Email:</strong> {{ $guestEmail }}
                                        </p>

                                        @if(! empty($additionalGuestNames))
                                            <p style="margin:18px 0 10px;font-size:15px;font-weight:600;color:#111827;">
                                                Additional Guests
                                            </p>

                                            <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:15px;line-height:1.8;">
                                                @foreach($additionalGuestNames as $additionalGuestName)
                                                    <li>{{ $additionalGuestName }}</li>
                                                @endforeach
                                            </ul>
                                        @endif

                                    </td>
                                </tr>
                            </table>

                            @if($acceptUrl)

                                <!-- CTA -->
                                <table role="presentation" cellspacing="0" cellpadding="0"
                                       align="center" style="margin:10px auto 36px;">
                                    <tr>
                                        <td align="center"
                                            bgcolor="#16a34a"
                                            style="border-radius:8px;">

                                            <a href="{{ $acceptUrl }}"
                                               style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                                                Accept Invitation
                                            </a>

                                        </td>
                                    </tr>
                                </table>

                                <!-- Direct Link -->
                                <p style="margin:0 0 12px;font-size:14px;color:#6b7280;">
                                    If the button doesn’t work, use this direct link:
                                </p>

                                <div style="background:#f3f4f6;border-radius:8px;padding:14px;font-size:12px;line-height:1.6;color:#374151;word-break:break-all;">
                                    {{ $acceptUrl }}
                                </div>

                            @endif

                            <p style="margin:32px 0 0;font-size:16px;line-height:1.7;color:#4b5563;">
                                We look forward to celebrating with you at
                                <strong>{{ $eventName }}</strong>.
                            </p>

                            <p style="margin:28px 0 0;font-size:15px;line-height:1.7;color:#6b7280;">
                                Warm regards,<br>
                                <strong>Kinetic</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px;text-align:center;background:#fafafa;border-top:1px solid #eeeeee;">

                            <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
                                If you have any questions, please contact support@kineticlabs.com
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>

    </table>

</body>
</html>