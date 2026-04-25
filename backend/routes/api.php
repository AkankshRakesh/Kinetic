<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


use App\Http\Controllers\GuestInvitationController;

Route::get('/invitations/{token}/accept', [GuestInvitationController::class, 'accept']);
Route::post('/invitations/{token}/respond', [GuestInvitationController::class, 'respond']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    Route::get('/events/{event}', [EventController::class, 'show']);

    Route::get('/events/{event}/invite-guest', [GuestInvitationController::class, 'index']);
    Route::post('/events/{event}/invite-guest', [GuestInvitationController::class, 'send']);
});
