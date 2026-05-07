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
        Schema::table('event_schedules', function (Blueprint $table) {
            // Drop the old 'time' column
            $table->dropColumn('time');
            
            // Add start_time and end_time columns
            $table->string('start_time')->default('09:00'); // HH:MM format
            $table->string('end_time')->default('10:00');   // HH:MM format
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_schedules', function (Blueprint $table) {
            $table->dropColumn(['start_time', 'end_time']);
            $table->string('time')->nullable();
        });
    }
};
