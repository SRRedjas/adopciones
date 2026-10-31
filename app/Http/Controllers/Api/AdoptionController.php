<?php

namespace App\Http\Controllers\Api;

use App\Models\Adoption;
use App\Models\AdoptionStatus;
use App\Models\Person;
use App\Models\Pet;
use Closure;
use DomainException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdoptionController extends ResourceController
{
    /** @var class-string<Adoption> */
    protected string $model = Adoption::class;

    /** @var list<string> */
    protected array $with = ['pet.species', 'pet.breed', 'pet.petStatus', 'person.residence', 'person.occupation', 'adoptionStatus', 'user'];

    protected function defaults(Request $request): array
    {
        return ['user_id' => $request->user()?->id ?? \App\Models\User::query()->first()?->id ?? 1];
    }

    protected function rules(Request $request, ?Model $record): array
    {
        $adoption = $record instanceof Adoption ? $record : null;
        $requestedAt = $request->input('requested_at') ?: $adoption?->requested_at?->toDateString();
        $approvedAt = $request->input('approved_at') ?: $adoption?->approved_at?->toDateString();
        $deliveredAt = $request->input('delivered_at') ?: $adoption?->delivered_at?->toDateString();

        return [
            'pet_id' => ['required', 'integer', 'exists:pets,id', $this->petAdoptable($adoption)],
            'person_id' => ['required', 'integer', 'exists:people,id'],
            'requested_at' => ['required', 'date', 'before_or_equal:today', ...(($approvedAt ?: $deliveredAt) ? ['before_or_equal:'.($approvedAt ?: $deliveredAt)] : [])],
            'approved_at' => ['nullable', 'date', 'before_or_equal:today', ...($requestedAt ? ['after_or_equal:'.$requestedAt] : []), ...($deliveredAt ? ['before_or_equal:'.$deliveredAt] : [])],
            'delivered_at' => ['nullable', 'date', 'before_or_equal:today', ...(($approvedAt ?: $requestedAt) ? ['after_or_equal:'.($approvedAt ?: $requestedAt)] : [])],
            'notes' => ['nullable', 'string'],
            'document' => ['nullable', 'string', 'max:255'],
            'adoption_status_id' => ['required', 'integer', 'exists:adoption_statuses,id', $this->statusReachable($request, $adoption)],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
        ];
    }

    /**
     * A request can only start on an eligible pet; an existing adoption keeps its pet.
     */
    private function petAdoptable(?Adoption $adoption): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($adoption) {
            if ((int) $value === $adoption?->pet_id) {
                return;
            }

            if (! Pet::query()->available()->whereKey($value)->exists()) {
                $fail('La mascota no es elegible para adopción.');
            } elseif ($adoption?->holds_pet && Adoption::query()->holding()->where('pet_id', $value)->exists()) {
                $fail('La mascota ya tiene otra adopción aprobada o entregada.');
            }
        };
    }

    public function show(string $id): JsonResponse
    {
        return response()->json($this->withWorkflow($this->findAdoption($id)));
    }

    /**
     * Moves a request to the next status of the workflow, with the same checks as the staff panel.
     */
    public function transition(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $adoption = $this->findAdoption($id);

        try {
            DB::transaction(function () use ($adoption, $data) {
                $adoption->moveTo($data['status']);

                if (array_key_exists('notes', $data)) {
                    $adoption->update(['notes' => $data['notes']]);
                }
            });
        } catch (DomainException $e) {
            throw ValidationException::withMessages(['status' => [$e->getMessage()]]);
        }

        return response()->json($this->withWorkflow($this->findAdoption($id)));
    }

    private function findAdoption(string $id): Adoption
    {
        /** @var Adoption */
        return $this->find($id);
    }

    /**
     * The adoption plus the steps available from its status and what blocks each one.
     *
     * @return array<string, mixed>
     */
    private function withWorkflow(Adoption $adoption): array
    {
        $steps = [];

        foreach ($adoption->nextStatuses() as $status => $label) {
            $steps[] = [
                'status' => $status,
                'label' => $label,
                'blocker' => Adoption::blockerFor($status, $adoption->pet_id, $adoption->getKey()),
            ];
        }

        return [...$adoption->toArray(), 'next_statuses' => $steps];
    }

    /**
     * Same checks as the workflow; records that keep their status and pet are left as they are.
     */
    private function statusReachable(Request $request, ?Adoption $adoption): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($request, $adoption) {
            $petId = $request->integer('pet_id') ?: $adoption?->pet_id;
            $unchanged = (int) $value === $adoption?->adoption_status_id && $petId === $adoption?->pet_id;
            $status = AdoptionStatus::query()->whereKey($value)->value('name');

            if ($adoption !== null && (int) $value !== $adoption->adoption_status_id && ! array_key_exists($status, $adoption->nextStatuses())) {
                $fail('La solicitud no admite ese cambio de estado.');

                return;
            }

            if (! $unchanged && $status !== null && ($blocker = Adoption::blockerFor($status, $petId, $adoption?->getKey())) !== null) {
                $fail($blocker);
            }
        };
    }

    public function publicApply(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate([
            'pet_id' => ['required', 'integer', 'exists:pets,id', $this->petAdoptable(null)],
            'name' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'document_number' => ['nullable', 'string', 'max:25'],
            'notes' => ['nullable', 'string'],
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($data, $request) {
            $defaultOccupationId = \App\Models\Occupation::query()->first()?->id ?? 1;
            $defaultResidenceId = \App\Models\Residence::query()->first()?->id ?? 1;
            $defaultUserId = $request->user()?->id ?? \App\Models\User::query()->first()?->id ?? 1;

            $documentTaken = ! empty($data['document_number']) && Person::query()
                ->where('document_number', $data['document_number'])
                ->where('email', '!=', $data['email'])
                ->exists();

            if ($documentTaken) {
                throw ValidationException::withMessages(['document_number' => ['Ese documento ya está registrado con otro correo.']]);
            }

            $person = \App\Models\Person::query()->firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'document_type' => 'DPI',
                    'document_number' => $data['document_number'] ?? ('DOC-' . rand(100000, 999999)),
                    'current_pets_count' => 0,
                    'estado_civil' => 'Soltero/a',
                    'cantidad_hijos' => 0,
                    'income' => 3000,
                    'occupation_id' => $defaultOccupationId,
                    'residence_id' => $defaultResidenceId,
                ]
            );

            $hasOpenRequest = Adoption::query()
                ->where('pet_id', $data['pet_id'])
                ->where('person_id', $person->id)
                ->whereHas('adoptionStatus', fn (Builder $query) => $query->whereIn('name', AdoptionStatus::OPEN))
                ->exists();

            if ($hasOpenRequest) {
                throw ValidationException::withMessages(['pet_id' => ['Ya tienes una solicitud en curso para esta mascota.']]);
            }

            $statusId = AdoptionStatus::query()->where('name', AdoptionStatus::PENDING)->value('id');

            $notes = ($data['notes'] ?? '');
            if (!empty($data['phone'])) {
                $notes .= ' [Teléfono: ' . $data['phone'] . ']';
            }

            $adoption = Adoption::query()->create([
                'pet_id' => $data['pet_id'],
                'person_id' => $person->id,
                'requested_at' => now(),
                'adoption_status_id' => $statusId,
                'user_id' => $defaultUserId,
                'notes' => $notes ?: null,
            ]);

            return response()->json([
                'message' => 'Solicitud de adopción recibida con éxito.',
                'adoption' => $adoption->load(['pet', 'person', 'adoptionStatus']),
            ], 201);
        });
    }

    /**
     * Status of the requests of a person, who proves it with both their email and document.
     * Only the data of the process is returned: this endpoint is public.
     */
    public function publicMyApplications(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'document_number' => ['required', 'string', 'max:25'],
        ]);

        $adoptions = Adoption::query()
            ->with(['pet.breed', 'adoptionStatus'])
            ->whereHas('person', fn (Builder $query) => $query
                ->where('email', $data['email'])
                ->where('document_number', $data['document_number']))
            ->orderByDesc('id')
            ->get()
            ->map(fn (Adoption $adoption) => [
                'id' => $adoption->id,
                'requested_at' => $adoption->requested_at->toDateString(),
                'approved_at' => $adoption->approved_at?->toDateString(),
                'delivered_at' => $adoption->delivered_at?->toDateString(),
                'adoption_status' => ['name' => $adoption->adoptionStatus?->name],
                'pet' => [
                    'name' => $adoption->pet?->name,
                    'photo_url' => $adoption->pet?->photo_url,
                    'breed' => ['name' => $adoption->pet?->breed?->name],
                ],
            ]);

        return response()->json($adoptions);
    }
}
