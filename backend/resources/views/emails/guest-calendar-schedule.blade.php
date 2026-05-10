<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $eventName }} - Event Schedule</title>
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
                                📅
                            </div>

                            <h1 style="margin:0;font-size:30px;line-height:1.2;color:#ffffff;font-weight:700;">
                                Event Schedule
                            </h1>

                            <p style="margin:14px 0 0;color:rgba(255,255,255,0.92);font-size:16px;line-height:1.6;">
                                Stay updated with the full timeline for
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
                                Thank you for accepting the invitation to
                                <strong>{{ $eventName }}</strong>.
                            </p>

                            <p style="margin:0 0 30px;font-size:16px;line-height:1.7;color:#4b5563;">
                                We’ve prepared a calendar view so you can easily browse the complete event schedule, session timings, and important updates.
                            </p>

                            <!-- CTA -->
                            <table role="presentation" cellspacing="0" cellpadding="0"
                                   align="center" style="margin:10px auto 36px;">
                                <tr>
                                    <td align="center"
                                        bgcolor="#16a34a"
                                        style="border-radius:8px;">

                                        <a href="{{ $calendarUrl }}"
                                           style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                                            View Event Calendar
                                        </a>

                                    </td>
                                </tr>
                            </table>

                            <!-- Schedule Features -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                                   style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:0 0 30px;">
                                <tr>
                                    <td style="padding:24px;">

                                        <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.5px;">
                                            What You'll Find
                                        </p>

                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">

                                            <tr>
                                                <td style="padding:6px 0;font-size:15px;color:#4b5563;">
                                                    • Complete event schedule organized by date
                                                </td>
                                            </tr>

                                            <tr>
                                                <td style="padding:6px 0;font-size:15px;color:#4b5563;">
                                                    • Session timings and activity details
                                                </td>
                                            </tr>

                                            <tr>
                                                <td style="padding:6px 0;font-size:15px;color:#4b5563;">
                                                    • Event notes and schedule information
                                                </td>
                                            </tr>

                                            <tr>
                                                <td style="padding:6px 0;font-size:15px;color:#4b5563;">
                                                    • Real-time updates as changes are made
                                                </td>
                                            </tr>

                                        </table>

                                    </td>
                                </tr>
                            </table>

                            @if($eventDate)

                                <!-- Event Date -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                                       style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;margin:0 0 30px;">
                                    <tr>
                                        <td style="padding:22px;">

                                            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:0.5px;">
                                                Event Date
                                            </p>

                                            <p style="margin:0;font-size:16px;font-weight:600;color:#7c2d12;line-height:1.7;">
                                                {{ \Carbon\Carbon::parse($eventDate)->format('l, F j, Y') }}
                                            </p>

                                        </td>
                                    </tr>
                                </table>

                            @endif

                            <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#4b5563;">
                                You can navigate through different months and view detailed information for each scheduled item. Any updates made by the organizer will automatically appear in the calendar.
                            </p>

                            <p style="margin:32px 0 0;font-size:16px;line-height:1.7;color:#4b5563;">
                                If you have any questions about the schedule or need clarification on any event details, please contact the organizer.
                            </p>

                            <p style="margin:28px 0 0;font-size:15px;line-height:1.7;color:#6b7280;">
                                Thanks,<br>
                                <strong>{{ config('app.name') }}</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px;text-align:center;background:#fafafa;border-top:1px solid #eeeeee;">

                            <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
                                This is an automated email. Please do not reply directly to this message.
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>

    </table>

</body>
</html>