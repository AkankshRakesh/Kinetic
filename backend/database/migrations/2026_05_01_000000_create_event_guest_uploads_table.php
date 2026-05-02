<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_guest_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('share_token')->unique()->index();
            $table->string('guest_name');
            $table->string('guest_email');
            $table->json('image_paths')->nullable();
            $table->integer('upload_count')->default(0);
            $table->timestamps();

            $table->index('event_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_guest_uploads');
    }
};
