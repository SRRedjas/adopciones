<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'adoption_id', 'name', 'document_path'])]
class Contract extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        // sqlsrv returns foreign keys as strings and the React panel compares them strictly
        return ['adoption_id' => 'integer'];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Adoption, $this>
     */
    public function adoption(): BelongsTo
    {
        return $this->belongsTo(Adoption::class);
    }
}
