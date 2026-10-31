<?php

namespace App\Http\Controllers\Api;

use App\Models\Donation;
use App\Models\Donor;
use App\Models\Occupation;
use App\Models\Person;
use App\Models\Residence;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DonationController extends ResourceController
{
    /** @var class-string<Donation> */
    protected string $model = Donation::class;

    /** @var list<string> */
    protected array $with = ['donor', 'pet'];

    protected function rules(Request $request, ?Model $record): array
    {
        return [
            'donor_id' => ['required', 'integer', 'exists:donors,id'],
            'amount' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'contribution_type' => ['required', 'in:cash,transfer,in_kind'],
            'pet_id' => ['nullable', 'integer', 'exists:pets,id'],
        ];
    }

    public function publicDonate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'donor_name' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:150'],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'contribution_type' => ['required', 'in:cash,transfer,in_kind'],
            'notes' => ['nullable', 'string', 'max:500'],
            'pet_id' => ['nullable', 'integer', 'exists:pets,id'],
        ]);

        $defaultOccupationId = Occupation::query()->first()?->id ?? 1;
        $defaultResidenceId = Residence::query()->first()?->id ?? 1;

        $person = Person::query()->firstOrCreate(
            ['email' => $data['email']],
            [
                'name' => $data['donor_name'],
                'document_type' => 'DPI',
                'document_number' => 'DON-' . rand(1000000, 9999999),
                'current_pets_count' => 0,
                'estado_civil' => 'No especificado',
                'cantidad_hijos' => 0,
                'income' => 3000,
                'occupation_id' => $defaultOccupationId,
                'residence_id' => $defaultResidenceId,
            ]
        );

        $donor = Donor::query()->firstOrCreate(
            ['person_id' => $person->id],
            ['name' => $data['donor_name']]
        );

        $amount = isset($data['amount']) && is_numeric($data['amount']) ? (float) $data['amount'] : 0.00;

        $donation = Donation::query()->create([
            'donor_id' => $donor->id,
            'amount' => $amount,
            'contribution_type' => $data['contribution_type'],
            'pet_id' => $data['pet_id'] ?? null,
        ]);

        return response()->json([
            'message' => '¡Donación registrada con éxito! Muchas gracias por tu aporte.',
            'donation' => $donation->load(['donor', 'pet']),
            'receipt_code' => sprintf('REF-%06d', $donation->id),
        ], 201);
    }
}
