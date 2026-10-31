<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'species_id', 'breed_id', 'sex', 'birth_date', 'estimated_age', 'color_id', 'weight_kg', 'notes', 'pet_status_id', 'registered_at', 'status', 'shelter_id', 'photo_url'])]
class Pet extends Model
{
    /**
     * Every status change (workflow, CRUD form or API) goes through these hooks, so the history stays complete.
     */
    protected static function booted(): void
    {
        static::created(fn (Pet $pet) => $pet->recordStatus('Ingreso al refugio.'));
        static::updated(fn (Pet $pet) => $pet->applyStatusChange());
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            // sqlsrv returns foreign keys as strings and the status rule compares them strictly
            'species_id' => 'integer',
            'breed_id' => 'integer',
            'color_id' => 'integer',
            'pet_status_id' => 'integer',
            'shelter_id' => 'integer',
            'birth_date' => 'date:Y-m-d',
            'registered_at' => 'date:Y-m-d',
            'weight_kg' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Species, $this>
     */
    public function species(): BelongsTo
    {
        return $this->belongsTo(Species::class);
    }

    /**
     * @return BelongsTo<Breed, $this>
     */
    public function breed(): BelongsTo
    {
        return $this->belongsTo(Breed::class);
    }

    /**
     * @return BelongsTo<Color, $this>
     */
    public function color(): BelongsTo
    {
        return $this->belongsTo(Color::class);
    }

    /**
     * @return BelongsTo<PetStatus, $this>
     */
    public function petStatus(): BelongsTo
    {
        return $this->belongsTo(PetStatus::class);
    }

    /**
     * @return BelongsTo<Shelter, $this>
     */
    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class);
    }

    /**
     * @return HasMany<PetHistory, $this>
     */
    public function histories(): HasMany
    {
        return $this->hasMany(PetHistory::class);
    }

    /**
     * @return HasMany<PetTreatment, $this>
     */
    public function petTreatments(): HasMany
    {
        return $this->hasMany(PetTreatment::class);
    }

    /**
     * @return HasMany<Appointment, $this>
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * @return HasMany<Donation, $this>
     */
    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class);
    }

    /**
     * @return HasMany<Rescue, $this>
     */
    public function rescues(): HasMany
    {
        return $this->hasMany(Rescue::class);
    }

    /**
     * @return HasMany<Adoption, $this>
     */
    public function adoptions(): HasMany
    {
        return $this->hasMany(Adoption::class);
    }

    /**
     * Active pets whose status allows starting an adoption.
     *
     * @param  Builder<Pet>  $query
     */
    public function scopeAvailable(Builder $query): void
    {
        $query->where('status', 'active')
            ->whereRelation('petStatus', 'is_adoptable', true);
    }

    /**
     * Whether an approved or delivered adoption holds the pet.
     */
    public function isHeld(): bool
    {
        return $this->adoptions()->holding()->exists();
    }

    public function isAdoptable(): bool
    {
        return static::query()->available()->whereKey($this->getKey())->exists();
    }

    /**
     * Puts the pet in the status its adoptions call for: adopted once delivered, reserved while approved,
     * and back to available when no adoption holds it. Non adoptable statuses (e.g. deceased) are left alone.
     */
    public function syncAdoptionStatus(): void
    {
        $holding = $this->adoptions()->holding()->with('adoptionStatus')->get();
        $current = $this->petStatus()->first();

        $status = match (true) {
            $holding->contains(fn (Adoption $adoption) => $adoption->adoptionStatus?->name === AdoptionStatus::DELIVERED) => PetStatus::ADOPTED,
            $holding->isNotEmpty() => PetStatus::RESERVED,
            default => PetStatus::AVAILABLE,
        };

        $managed = $current?->is_adoptable || in_array($current?->name, PetStatus::WORKFLOW, true);

        if ($managed && $current->name !== $status) {
            $this->update(['pet_status_id' => PetStatus::query()->where('name', $status)->value('id')]);
        }
    }

    private function applyStatusChange(): void
    {
        if (! $this->wasChanged('pet_status_id')) {
            return;
        }

        $previous = PetStatus::query()->whereKey($this->getOriginal('pet_status_id'))->value('name');
        $current = PetStatus::query()->whereKey($this->pet_status_id)->value('name');

        $this->recordStatus("Cambio de estado: {$previous} → {$current}.");

        if ($current === PetStatus::DECEASED) {
            $this->adoptions()
                ->whereHas('adoptionStatus', fn (Builder $query) => $query->whereIn('name', AdoptionStatus::OPEN))
                ->update([
                    'adoption_status_id' => AdoptionStatus::query()->where('name', AdoptionStatus::REJECTED)->value('id'),
                    'holds_pet' => false,
                ]);
        }
    }

    private function recordStatus(string $notes): void
    {
        $this->histories()->create([
            'pet_status_id' => $this->pet_status_id,
            'notes' => $notes,
            'recorded_at' => today(),
            'user_id' => auth()->id(),
        ]);
    }

    /**
     * Human readable age from the birth date, e.g. "2 años" or "5 meses".
     */
    public function ageLabel(): string
    {
        $months = (int) $this->birth_date->diffInMonths(now(), absolute: true);

        if ($months >= 12) {
            $years = intdiv($months, 12);

            return $years.' '.($years === 1 ? 'año' : 'años');
        }

        return $months.' '.($months === 1 ? 'mes' : 'meses');
    }
}
