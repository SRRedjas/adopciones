<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Adoption;
use App\Models\AdoptionStatus;
use App\Models\Person;
use App\Models\Pet;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * API of the adopter area: same rules as the Volt pages under resources/views/livewire/adopter.
 */
class AdopterController extends Controller
{
    public function adoptions(Request $request): JsonResponse
    {
        return response()->json(
            $this->requests($request)
                ->with(['pet.species', 'pet.breed', 'adoptionStatus'])
                ->orderByDesc('requested_at')
                ->orderByDesc('id')
                ->get()
        );
    }

    public function request(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pet_id' => ['required', 'integer'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $person = $request->user()->person()->first();

        if ($person === null) {
            throw ValidationException::withMessages(['profile' => ['Completa tus datos de adoptante antes de solicitar una adopción.']]);
        }

        if (! Pet::query()->available()->whereKey($data['pet_id'])->exists()) {
            throw ValidationException::withMessages(['pet_id' => ['Esta mascota ya no está disponible para adopción.']]);
        }

        $hasOpenRequest = $this->requests($request)
            ->where('pet_id', $data['pet_id'])
            ->whereHas('adoptionStatus', fn (Builder $query) => $query->whereIn('name', AdoptionStatus::OPEN))
            ->exists();

        if ($hasOpenRequest) {
            throw ValidationException::withMessages(['pet_id' => ['Ya tienes una solicitud en curso para esta mascota.']]);
        }

        $adoption = Adoption::query()->create([
            'pet_id' => $data['pet_id'],
            'person_id' => $person->id,
            'requested_at' => today(),
            'notes' => $data['notes'] ?? null,
            'adoption_status_id' => AdoptionStatus::query()->where('name', AdoptionStatus::PENDING)->value('id'),
            'user_id' => $request->user()->id,
        ]);

        return response()->json($adoption->load(['pet.species', 'pet.breed', 'adoptionStatus']), 201);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $adoption = $this->requests($request)->with('adoptionStatus')->findOrFail($id);

        if ($adoption->adoptionStatus?->name !== AdoptionStatus::PENDING) {
            throw ValidationException::withMessages(['status' => ['Solo puedes cancelar solicitudes pendientes.']]);
        }

        $adoption->update([
            'adoption_status_id' => AdoptionStatus::query()->where('name', AdoptionStatus::CANCELLED)->value('id'),
        ]);

        return response()->json($adoption->refresh()->load(['pet.species', 'pet.breed', 'adoptionStatus']));
    }

    public function profile(Request $request): JsonResponse
    {
        return response()->json($request->user()->person()->first());
    }

    public function saveProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $person = $user->person()->first();

        // Mismas reglas que PersonController; nombre y correo se toman de la cuenta.
        $data = $request->validate([
            'document_type' => ['required', 'in:DPI,PASSPORT'],
            'document_number' => ['required', 'string', 'max:25', Rule::unique('people', 'document_number')->ignore($person)],
            'estado_civil' => ['required', 'string', 'max:50'],
            'cantidad_hijos' => ['required', 'integer', 'min:0', 'max:99'],
            'occupation_id' => ['required', 'integer', 'exists:occupations,id'],
            'residence_id' => ['required', 'integer', 'exists:residences,id'],
            'income' => ['required', 'integer', 'min:0'],
            'current_pets_count' => ['required', 'integer', 'min:0'],
        ]);

        if (Person::query()->where('email', $user->email)->whereKeyNot($person?->getKey())->exists()) {
            throw ValidationException::withMessages(['document_number' => ['Ya existe una persona registrada con tu correo. Contacta al refugio.']]);
        }

        $saved = Person::query()->updateOrCreate(
            ['user_id' => $user->id],
            [...$data, 'name' => mb_substr($user->name, 0, 50), 'email' => $user->email],
        );

        return response()->json($saved);
    }

    /**
     * Requests made by the people record of the signed in adopter.
     *
     * @return Builder<Adoption>
     */
    private function requests(Request $request): Builder
    {
        return Adoption::query()->whereHas('person', fn (Builder $query) => $query->where('user_id', $request->user()->id));
    }
}
