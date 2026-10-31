<?php

namespace App\Models;

use Carbon\CarbonInterface;
use DomainException;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

/**
 * @property CarbonInterface $requested_at
 * @property CarbonInterface|null $approved_at
 * @property CarbonInterface|null $delivered_at
 */
#[Fillable(['pet_id', 'person_id', 'requested_at', 'approved_at', 'delivered_at', 'notes', 'document', 'adoption_status_id', 'user_id', 'holds_pet'])]
class Adoption extends Model
{
    /**
     * Every status change (actions, CRUD form or API) goes through these hooks, so the pet stays in sync.
     */
    protected static function booted(): void
    {
        static::saving(fn (Adoption $adoption) => $adoption->stampStatusDates());
        static::saved(fn (Adoption $adoption) => $adoption->applyStatusChange());
        static::deleted(fn (Adoption $adoption) => $adoption->syncPets());
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            // sqlsrv returns foreign keys as strings and the workflow compares them strictly
            'pet_id' => 'integer',
            'person_id' => 'integer',
            'adoption_status_id' => 'integer',
            'user_id' => 'integer',
            'holds_pet' => 'boolean',
            'requested_at' => 'date:Y-m-d',
            'approved_at' => 'date:Y-m-d',
            'delivered_at' => 'date:Y-m-d',
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
     * @return BelongsTo<Person, $this>
     */
    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    /**
     * @return BelongsTo<AdoptionStatus, $this>
     */
    public function adoptionStatus(): BelongsTo
    {
        return $this->belongsTo(AdoptionStatus::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<AdoptionFollowUp, $this>
     */
    public function followUps(): HasMany
    {
        return $this->hasMany(AdoptionFollowUp::class);
    }

    /**
     * @return HasMany<Contract, $this>
     */
    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    /**
     * Adoptions that hold their pet for an adopter (approved or delivered).
     *
     * @param  Builder<Adoption>  $query
     */
    public function scopeHolding(Builder $query): void
    {
        $query->where('holds_pet', true);
    }

    /**
     * Steps available from the current status, as [next status => button label].
     *
     * @return array<string, string>
     */
    public function nextStatuses(): array
    {
        return AdoptionStatus::TRANSITIONS[$this->adoptionStatus?->name] ?? [];
    }

    /**
     * Why an adoption cannot reach the status for this pet, if anything prevents it.
     * Delivering is the only step that accepts a reserved pet: the approval already took it.
     */
    public static function blockerFor(string $status, ?int $petId, ?int $exceptId = null): ?string
    {
        if (! in_array($status, AdoptionStatus::HOLDING, true)) {
            return null;
        }

        $pet = Pet::query()->with('petStatus')->find($petId);

        if ($pet === null) {
            return null;
        }

        if (static::query()->holding()->where('pet_id', $pet->id)->whereKeyNot($exceptId)->exists()) {
            return 'La mascota ya tiene otra adopción aprobada o entregada.';
        }

        $reserved = $status === AdoptionStatus::DELIVERED && $pet->status === 'active' && $pet->petStatus?->name === PetStatus::RESERVED;

        if (! $pet->isAdoptable() && ! $reserved) {
            return "La mascota no es elegible para adopción: su estado es {$pet->petStatus?->name}.";
        }

        return null;
    }

    /**
     * Moves the request to the next status of the workflow.
     *
     * @throws DomainException when the step is not allowed or another adoption already holds the pet
     */
    public function moveTo(string $status): void
    {
        DB::transaction(function () use ($status) {
            // The pet row serializes concurrent approvals of the same pet.
            Pet::query()->lockForUpdate()->findOrFail($this->pet_id);
            $this->refresh();

            if (! array_key_exists($status, $this->nextStatuses())) {
                throw new DomainException('La solicitud ya no admite ese cambio de estado.');
            }

            if (($blocker = static::blockerFor($status, $this->pet_id, $this->getKey())) !== null) {
                throw new DomainException($blocker);
            }

            $this->update(['adoption_status_id' => AdoptionStatus::query()->where('name', $status)->value('id')]);
            $this->unsetRelation('adoptionStatus');
        });
    }

    private function statusName(mixed $id): ?string
    {
        return AdoptionStatus::query()->whereKey($id)->value('name');
    }

    private function stampStatusDates(): void
    {
        if (! $this->isDirty('adoption_status_id')) {
            return;
        }

        $status = $this->statusName($this->adoption_status_id);

        $this->holds_pet = in_array($status, AdoptionStatus::HOLDING, true);

        if ($this->holds_pet) {
            $this->approved_at ??= today();
        }

        if ($status === AdoptionStatus::DELIVERED) {
            $this->delivered_at ??= today();
        }
    }

    private function applyStatusChange(): void
    {
        if (! $this->wasChanged(['adoption_status_id', 'pet_id']) && ! $this->wasRecentlyCreated) {
            return;
        }

        if ($this->holds_pet) {
            // Once the pet is taken the other requests in evaluation cannot succeed.
            static::query()
                ->where('pet_id', $this->pet_id)
                ->whereKeyNot($this->getKey())
                ->whereHas('adoptionStatus', fn (Builder $query) => $query->whereIn('name', [AdoptionStatus::PENDING, AdoptionStatus::IN_REVIEW]))
                ->update(['adoption_status_id' => AdoptionStatus::query()->where('name', AdoptionStatus::REJECTED)->value('id')]);
        }

        if ($this->holds_pet || $this->getOriginal('holds_pet')) {
            $this->syncPets();
        }
    }

    private function syncPets(): void
    {
        Pet::query()
            ->whereKey(array_filter([$this->pet_id, $this->getOriginal('pet_id')]))
            ->get()
            ->each(fn (Pet $pet) => $pet->syncAdoptionStatus());
    }
}
