<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GuestInvitationController;
use App\Http\Controllers\GuestUploadController;
use Illuminate\Support\Facades\Route;


Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});


Route::prefix('api')->group(function () {

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/events', [EventController::class, 'index']);
        Route::post('/events', [EventController::class, 'store']);
        Route::get('/events/{event}', [EventController::class, 'show']);

        Route::get('/events/{event}/invite-guest', [GuestInvitationController::class, 'index']);
        Route::post('/events/{event}/invite-guest', [GuestInvitationController::class, 'send']);

        Route::post('/events/{event}/share-link', [GuestUploadController::class, 'generateShareLink']);
        Route::get('/events/{event}/uploads', [GuestUploadController::class, 'getEventUploads']);
    });

    // public
    Route::get('/invitations/{token}/accept', [GuestInvitationController::class, 'accept']);
    Route::post('/invitations/{token}/respond', [GuestInvitationController::class, 'respond']);

    Route::get('/uploads/{shareToken}', [GuestUploadController::class, 'checkShareLink'])
        ->withoutMiddleware([
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Session\Middleware\StartSession::class,
        ]);

    Route::post('/uploads/{shareToken}', [GuestUploadController::class, 'uploadImages'])
        ->withoutMiddleware([
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Session\Middleware\StartSession::class,
        ]);
});


// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/login', [AuthController::class, 'login']);

// Route::get('/invitations/{token}/accept', [GuestInvitationController::class, 'accept']);
// Route::post('/invitations/{token}/respond', [GuestInvitationController::class, 'respond']);

// // Public endpoints for guest uploads
// Route::get('/uploads/{shareToken}', [GuestUploadController::class, 'checkShareLink'])->withoutMiddleware([
//         \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
//         \Illuminate\Session\Middleware\StartSession::class,
//     ]);
// Route::post('/uploads/{shareToken}', [GuestUploadController::class, 'uploadImages'])->withoutMiddleware([
//         \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
//         \Illuminate\Session\Middleware\StartSession::class,
//     ]);

// Route::middleware('auth:sanctum')->group(function () {
//     Route::get('/user', [AuthController::class, 'user']);
//     Route::post('/logout', [AuthController::class, 'logout']);
//     Route::get('/events', [EventController::class, 'index']);
//     Route::post('/events', [EventController::class, 'store']);
//     Route::get('/events/{event}', [EventController::class, 'show']);

//     Route::get('/events/{event}/invite-guest', [GuestInvitationController::class, 'index']);
//     Route::post('/events/{event}/invite-guest', [GuestInvitationController::class, 'send']);

//     // Guest upload endpoints (authenticated - event owner only)
//     Route::post('/events/{event}/share-link', [GuestUploadController::class, 'generateShareLink']);
//     Route::get('/events/{event}/uploads', [GuestUploadController::class, 'getEventUploads']);
// });
