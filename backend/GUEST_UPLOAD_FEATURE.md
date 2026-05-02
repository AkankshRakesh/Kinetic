# Guest Upload Feature Documentation

## Overview
This feature allows event attendees to upload images to an event without needing to authenticate. When a guest accepts an event invitation, they automatically receive an email with a unique upload link. Guests can then upload up to 5 images per share link.

**Automated Flow:**
1. Event owner sends invitation to guest
2. Guest accepts invitation
3. System automatically generates upload share link and sends email
4. Guest receives email with photo upload link
5. Guest can upload up to 5 photos without authentication
6. Event owner can view all guest uploads in real-time

## Architecture

### Database Schema
- `event_guest_uploads` table:
  - `id`: Primary key
  - `event_id`: Foreign key to events table
  - `share_token`: Unique token for sharing (32 characters)
  - `guest_name`: Name of the guest uploading images
  - `guest_email`: Email of the guest uploading images
  - `image_paths`: JSON array storing uploaded image metadata (path, URL, filename, uploadedAt)
  - `upload_count`: Number of images currently uploaded
  - `created_at`, `updated_at`: Timestamps

### Storage
Images are stored in Supabase Storage with the following path structure:
```
events/{eventId}/uploads/{uploadId}/{filename}
```

## API Endpoints

### 1. Generate Share Link (Authenticated)
**Endpoint:** `POST /api/events/{eventId}/share-link`

**Required:** User must be the event owner

**Request Body:**
```json
{
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "send_email": true
}
```

**Parameters:**
- `guest_name`: Guest's full name
- `guest_email`: Guest's email address
- `send_email` (optional): Set to `true` to automatically send email with upload link. Defaults to `false`.

**Response (201):**
```json
{
  "message": "Share link generated.",
  "data": {
    "shareToken": "abcd1234efgh5678ijkl9012mnop3456",
    "shareUrl": "http://app.local/upload/abcd1234efgh5678ijkl9012mnop3456",
    "guestName": "John Doe",
    "guestEmail": "john@example.com",
    "uploadCount": 0
  }
}
```

### 2. Check Share Link (Public)
**Endpoint:** `GET /api/uploads/{shareToken}`

**Description:** Verify the share link is valid and get upload status

**Response (200):**
```json
{
  "data": {
    "isValid": true,
    "eventName": "Launch Night",
    "guestName": "John Doe",
    "guestEmail": "john@example.com",
    "uploadCount": 2,
    "remainingSlots": 3,
    "maxImagesExceeded": false
  }
}
```

**Response (404):**
```json
{
  "message": "Invalid share link."
}
```

### 3. Upload Images (Public)
**Endpoint:** `POST /api/uploads/{shareToken}`

**Description:** Upload up to 5 images without authentication

**Request:** Multipart form data
```
Content-Type: multipart/form-data

images: [File, File, File]  // Up to 5 images
```

**Constraints:**
- Maximum 5 images total per guest
- Maximum 10MB per image
- Allowed formats: jpeg, png, webp, gif

**Response (201):**
```json
{
  "message": "Images uploaded successfully.",
  "data": {
    "uploadId": "123",
    "guestName": "John Doe",
    "guestEmail": "john@example.com",
    "uploadedImages": [
      {
        "path": "events/1/uploads/123/uuid.jpg",
        "url": "https://supabase.../event-uploads/events/1/uploads/123/uuid.jpg",
        "filename": "photo1.jpg",
        "uploadedAt": "2026-05-01T10:30:00Z"
      }
    ],
    "totalUploads": 3
  }
}
```

**Response (422):**
```json
{
  "message": "Maximum 5 images allowed. You have already uploaded 3 image(s)."
}
```

### 4. Get Event Uploads (Authenticated)
**Endpoint:** `GET /api/events/{eventId}/uploads`

**Required:** User must be the event owner

**Response (200):**
```json
{
  "data": [
    {
      "id": "123",
      "guestName": "John Doe",
      "guestEmail": "john@example.com",
      "uploadCount": 3,
      "images": [
        {
          "path": "events/1/uploads/123/uuid.jpg",
          "url": "https://supabase.../event-uploads/events/1/uploads/123/uuid.jpg",
          "filename": "photo1.jpg",
          "uploadedAt": "2026-05-01T10:30:00Z"
        }
      ],
      "shareToken": "abcd1234efgh5678ijkl9012mnop3456",
      "shareUrl": "http://app.local/upload/abcd1234efgh5678ijkl9012mnop3456",
      "uploadedAt": "2026-05-01T10:00:00Z",
      "lastUpdated": "2026-05-01T10:30:00Z"
    }
  ],
  "total": 1
}
```

## Setup Instructions

### Automatic Email Flow
When a guest **accepts an event invitation**, the system automatically:
1. Checks if an upload record exists for that guest
2. Creates one if it doesn't exist (with a unique share token)
3. Sends an email with the upload link using `GuestPhotoUploadMail`

No manual action is required from the event owner for the automated flow. Guests will receive the upload link immediately upon accepting the invitation.

### Manual Share Link Generation
Event owners can also manually generate and send share links via the event management dashboard. This is useful for:
- Sending links to guests who didn't respond to invitations
- Resending links to guests
- Inviting additional photographers

### Email Configuration
The system uses Laravel's mail configuration. Ensure the following is set up in `.env`:
```bash
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_FROM_ADDRESS=your-email@example.com
MAIL_FROM_NAME="Your App Name"
```

### 1. Run Database Migration
```bash
php artisan migrate
```

This creates the `event_guest_uploads` table.

### 2. Configure Supabase Storage
1. Go to your Supabase project dashboard
2. Navigate to Storage > Buckets
3. Create a new bucket named `event-uploads`
4. Make it public or configure RLS policies as needed
5. Get your credentials:
   - Supabase URL: Found in project settings
   - Service Role Key: Found in Settings > API
   - Bucket name: `event-uploads`

### 3. Update Environment Variables
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=event-uploads
```

### 4. Update Frontend Configuration
The frontend will use the shareable links to allow guests to upload images. The link format is:
```
/upload/{shareToken}
```

## Frontend Implementation Example

### 1. Event Owner - Generate Share Link
```javascript
const response = await fetch('/api/events/{eventId}/share-link', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    guest_name: 'John Doe',
    guest_email: 'john@example.com',
  }),
});

const { data } = await response.json();
console.log(`Share link: ${data.shareUrl}`);
```

### 2. Event Owner - View Guest Uploads
```javascript
const response = await fetch('/api/events/{eventId}/uploads', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { data } = await response.json();
// Display guest uploads in a gallery
```

### 3. Guest - Upload Images
```javascript
const formData = new FormData();
const fileInputs = document.querySelectorAll('input[type="file"]');

fileInputs.forEach((input) => {
  Array.from(input.files).forEach((file) => {
    formData.append('images[]', file);
  });
});

const response = await fetch(`/api/uploads/${shareToken}`, {
  method: 'POST',
  body: formData,
});

const { data } = await response.json();
console.log(`Uploaded ${data.uploadedImages.length} images`);
```

## Error Handling

- **404 - Invalid Share Link:** Share token not found
- **422 - Validation Errors:** Missing required fields or invalid file types
- **422 - Limit Exceeded:** Guest has already uploaded 5 images
- **500 - Upload Failed:** Error storing file in Supabase

## Security Considerations

1. **Token-based Access:** Share tokens are 32-character random strings
2. **Rate Limiting:** Consider adding rate limiting to prevent abuse
3. **File Validation:** Files are validated for type and size before upload
4. **CORS:** Configure CORS to allow uploads from frontend domain
5. **Storage Policies:** Set up Supabase RLS policies if needed

## Future Enhancements

- Add rate limiting per share token
- Add ability to revoke share links
- Add watermarking to uploaded images
- Add image compression
- Add ability to delete uploaded images
- Add email notifications when new images are uploaded
- Add image metadata (EXIF) extraction
