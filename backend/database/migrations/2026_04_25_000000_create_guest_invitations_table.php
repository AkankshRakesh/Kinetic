<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guest_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invited_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('guest_name');
            $table->string('guest_email');
            $table->text('custom_message')->nullable();
            $table->string('status')->default('pending')->index();
            $table->string('accept_token_hash', 64)->unique();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index('guest_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_invitations');
    }
};
