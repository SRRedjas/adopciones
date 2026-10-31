<?php

namespace App\Http\Controllers\Api;

use App\Models\Pet;
use App\Models\PetStatus;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PetController extends ResourceController
{
    /** @var class-string<Pet> */
    protected string $model = Pet::class;

    /** @var list<string> */
    protected array $with = ['species', 'breed', 'color', 'petStatus', 'shelter', 'petTreatments.treatment'];

    protected function filter(Builder $query, Request $request): void
    {
        if ($request->boolean('available')) {
            $query->scopes('available');
        }
    }

    protected function rules(Request $request, ?Model $record): array
    {
        $speciesId = $request->integer('species_id') ?: ($record instanceof Pet ? $record->species_id : null);

        return [
            'name' => ['required', 'string', 'max:50'],
            'species_id' => ['required', 'integer', 'exists:species,id'],
            'breed_id' => ['required', 'integer', Rule::exists('breeds', 'id')->where('species_id', $speciesId)],
            'sex' => ['required', 'in:M,F'],
            'birth_date' => ['required', 'date', 'before_or_equal:today'],
            'estimated_age' => ['nullable', 'integer', 'min:0', 'max:100'],
            'color_id' => ['required', 'integer', 'exists:colors,id'],
            'weight_kg' => ['nullable', 'numeric', 'min:0', 'max:999.99'],
            'notes' => ['nullable', 'string'],
            'pet_status_id' => ['required', 'integer', 'exists:pet_statuses,id', $this->statusAssignable($record instanceof Pet ? $record : null)],
            'registered_at' => ['required', 'date'],
            'status' => ['sometimes', 'in:active,inactive'],
            'shelter_id' => ['required', 'integer', 'exists:shelters,id'],
            'photo_url' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Reserved and adopted belong to the adoption workflow; a held pet can only leave them by dying.
     */
    private function statusAssignable(?Pet $pet): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($pet) {
            if ((int) $value === $pet?->pet_status_id) {
                return;
            }

            $status = PetStatus::query()->whereKey($value)->value('name');

            if (in_array($status, PetStatus::WORKFLOW, true)) {
                $fail('Este estado lo asigna el flujo de solicitudes de adopción.');
            } elseif ($status !== PetStatus::DECEASED && $pet?->isHeld()) {
                $fail('La mascota tiene una adopción aprobada o entregada: resuélvela en Solicitudes.');
            }
        };
    }
}
