'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const AUTH_API_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? '').replace(/\/$/, '');

type ShareLinkInfo = {
  isValid: boolean;
  eventName: string;
  guestName: string;
  guestEmail: string;
  uploadCount: number;
  remainingSlots: number;
  maxImagesExceeded: boolean;
  images: Array<{
    path: string;
    url: string;
    filename: string;
    uploadedAt: string;
  }>;
};

export default function GuestUploadPage() {
  const params = useParams();
  const router = useRouter();
  const shareToken = params.shareToken as string;

  const [linkInfo, setLinkInfo] = useState<ShareLinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    checkShareLink();
  }, [shareToken]);

  async function checkShareLink() {
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/api/uploads/${shareToken}`);
      const data = await response.json();

      if (!response.ok) {
        setError('Invalid or expired share link');
        return;
      }

      setLinkInfo(data.data);
      setError(null);
    } catch (err) {
      setError('Failed to verify share link');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (linkInfo && files.length + selectedFiles.length > linkInfo.remainingSlots) {
      setError(
        `You can only upload ${linkInfo.remainingSlots} more image(s). You selected ${files.length}.`,
      );
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    setError(null);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images[]', file);
      });

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setSuccess(true);
          setSelectedFiles([]);
          setUploadProgress(0);

          // Refresh link info after successful upload
          await new Promise((r) => setTimeout(r, 1500));
          await checkShareLink();
        } else {
          const errorData = JSON.parse(xhr.responseText);
          setError(errorData.message || 'Upload failed');
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        setError('Network error during upload');
        setUploading(false);
      });

      xhr.open('POST', `${AUTH_API_BASE_URL}/api/uploads/${shareToken}`);
      
      xhr.send(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0E10] text-[#e5e2e3] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Verifying share link...</p>
        </div>
      </main>
    );
  }

  if (!linkInfo || !linkInfo.isValid) {
    return (
      <main className="min-h-screen bg-[#0D0E10] text-[#e5e2e3] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-[#ffb77b]">Invalid Share Link</h1>
          <p className="text-[#9ca3ad]">
            The share link is invalid or has expired. Please ask the event organizer for a new
            link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0E10] text-[#e5e2e3]">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-lg border border-[#3b3430] bg-[#1a1b1e] p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#f7efe8] sm:text-4xl">
              {linkInfo.eventName}
            </h1>
            <p className="mt-2 text-[#9ca3ad]">
              Hi {linkInfo.guestName}, please upload your photos from the event
            </p>
          </div>

          {/* Upload Status */}
          <div className="mb-6 rounded-md bg-[#111316] p-4">
            <p className="text-sm text-[#8f949a]">
              <span className="font-semibold text-[#f1e8df]">{linkInfo.uploadCount}</span> of{' '}
              <span className="font-semibold text-[#f1e8df]">5</span> images uploaded
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#2a2c2e]">
              <div
                className="h-full bg-[#007a4d] transition-all duration-300"
                style={{ width: `${(linkInfo.uploadCount / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 rounded-md border border-[#ff9e9e]/30 bg-[#ff9e9e]/10 p-3 text-sm text-[#ff9e9e]">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md border border-[#00d87e]/30 bg-[#00d87e]/10 p-3 text-sm text-[#00d87e]">
              ✓ Images uploaded successfully!
            </div>
          )}

          {linkInfo.maxImagesExceeded && (
            <div className="mb-4 rounded-md border border-[#ffb77b]/30 bg-[#ffb77b]/10 p-3 text-sm text-[#ffb77b]">
              You have reached the maximum of 5 images. No more uploads are allowed.
            </div>
          )}

          {/* Display Uploaded Images Gallery */}
          {linkInfo.images && linkInfo.images.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 font-semibold text-[#f1e8df]">Your Uploaded Photos ({linkInfo.uploadCount})</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {linkInfo.images.map((image, index) => (
                  <a
                    key={index}
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-md border border-[#3b3430] transition hover:border-[#ffb77b]/45"
                  >
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                      <span className="text-[10px] text-white">View</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Display Uploaded Images Gallery */}
          {linkInfo.images && linkInfo.images.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 font-semibold text-[#f1e8df]">Your Uploaded Photos ({linkInfo.uploadCount})</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {linkInfo.images.map((image, index) => (
                  <a
                    key={index}
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-md border border-[#3b3430] transition hover:border-[#ffb77b]/45"
                  >
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                      <span className="text-[10px] text-white">View</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          {!linkInfo.maxImagesExceeded && (
            <>
              <div className="mb-6">
                <label className="block">
                  <div className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#3b3430] bg-[#0f1012] px-6 py-8 transition hover:border-[#ffb77b]/45">
                    <svg
                      className="h-8 w-8 text-[#8f949a]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="font-semibold text-[#f1e8df]">Click to upload</p>
                      <p className="text-xs text-[#8f949a]">
                        PNG, JPG, GIF or WebP (Max {linkInfo.remainingSlots} images)
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading || linkInfo.maxImagesExceeded}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 font-semibold text-[#f1e8df]">
                    Selected Files ({selectedFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md bg-[#111316] p-3"
                      >
                        <span className="text-sm text-[#9ca3ad]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                          className="text-[#8f949a] transition hover:text-[#ffb77b] disabled:opacity-50"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && uploadProgress > 0 && (
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-[#8f949a]">Uploading...</p>
                    <p className="text-sm font-semibold text-[#f1e8df]">
                      {Math.round(uploadProgress)}%
                    </p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#2a2c2e]">
                    <div
                      className="h-full bg-[#ffb77b] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="w-full rounded-md bg-[#007a4d] px-4 py-3 font-bold text-white transition hover:bg-[#008d59] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploading ? 'Uploading...' : 'Upload Images'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
