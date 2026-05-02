<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $eventName }} - Share Your Photos</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #ffb77b 0%, #ff9d5c 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            color: #333;
        }
        .content p {
            margin: 15px 0;
            line-height: 1.6;
            font-size: 16px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 20px;
        }
        .cta-button {
            display: inline-block;
            background-color: #007a4d;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 30px 0;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        .cta-button:hover {
            background-color: #008d59;
        }
        .features {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 6px;
            margin: 30px 0;
        }
        .features h3 {
            margin-top: 0;
            color: #333;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .features ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .features li {
            margin: 8px 0;
            color: #666;
            font-size: 14px;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
        }
        .direct-link {
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 6px;
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
            color: #333;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📸 Share Your Photos</h1>
        </div>

        <div class="content">
            <p class="greeting">Hi {{ $guestName }},</p>

            <p>Thank you for accepting the invitation to <strong>{{ $eventName }}</strong>! We'd love to see your photos from the event.</p>

            <p>Click the button below to upload up to 5 photos:</p>

            <center>
                <a href="{{ $uploadUrl }}" class="cta-button">Upload Photos Now</a>
            </center>

            <div class="features">
                <h3>Upload Details</h3>
                <ul>
                    <li>Upload up to <strong>5 photos</strong> per guest</li>
                    <li>Supported formats: <strong>JPEG, PNG, GIF, WebP</strong></li>
                    <li>Maximum <strong>10MB per image</strong></li>
                    <li><strong>No account or login required</strong> - just click and upload!</li>
                </ul>
            </div>

            <p>If you have any trouble uploading, you can use this direct link:</p>
            <div class="direct-link">{{ $uploadUrl }}</div>

            <p>Looking forward to seeing your memories from {{ $eventName }}!</p>

            <p style="color: #999; font-size: 14px; margin-top: 40px;">
                Best regards,<br>
                <strong>{{ config('app.name') }} Team</strong>
            </p>
        </div>

        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
