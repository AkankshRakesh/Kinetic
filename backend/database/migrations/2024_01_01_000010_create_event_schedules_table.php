<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('event_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('date_key'); // Format: YYYY-MM-DD
            $table->string('time'); // Format: HH:MM
            $table->string('title');
            $table->text('note')->nullable();
            $table->string('color')->default('#ffb77b'); // Hex color code
            $table->timestamps();
            
            // Indexes for better query performance
            $table->index(['event_id', 'date_key']);
            $table->index(['event_id', 'user_id']);
            $table->unique(['id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_schedules');
    }
};
