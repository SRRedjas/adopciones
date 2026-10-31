<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['pet_id', 'pet_status_id', 'notes', 'recorded_at', 'user_id'])]
class PetHistory extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            // sqlsrv returns foreign keys as strings
            'user_id' => 'integer',
            'recorded_at' => 'date:Y-m-d',
        ];
    }

    /**
     * @return BelongsTo<Pet, $this>
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    /**
     * @return BelongsTo<PetStatus, $this>
     */
    public function petStatus(): BelongsTo
    {
        return $this->belongsTo(PetStatus::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
