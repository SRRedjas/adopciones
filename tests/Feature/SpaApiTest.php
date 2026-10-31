<?php

use App\Models\Adoption;
use App\Models\AdoptionStatus;
use App\Models\Breed;
use App\Models\Occupation;
use App\Models\Pet;
use App\Models\PetStatus;
use App\Models\Residence;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function accountWithRole(string $role): User
{
    $user = User::factory()->create();
    $user->roles()->attach(Role::where('name', $role)->firstOrFail());

    return $user;
}

function adoptionIn(string $status): Adoption
{
    return Adoption::whereHas('adoptionStatus', fn ($query) => $query->where('name', $status))->firstOrFail();
}

function statusId(string $status): int
{
    return AdoptionStatus::where('name', $status)->value('id');
}

function eligiblePet(): Pet
{
    return Pet::query()->available()->firstOrFail();
}

test('the workflow advances through the api and offers the next steps', function () {
    Sanctum::actingAs(accountWithRole('Recepcionista'));
    $adoption = adoptionIn(AdoptionStatus::PENDING);
    Adoption::where('pet_id', $adoption->pet_id)->whereKeyNot($adoption->id)->delete();
    $adoption->pet->update(['pet_status_id' => PetStatus::where('name', PetStatus::AVAILABLE)->value('id')]);

    $this->getJson("/api/adoptions/{$adoption->id}")
        ->assertOk()
        ->assertJsonPath('next_statuses.0.status', AdoptionStatus::IN_REVIEW)
        ->assertJsonStructure(['person' => ['residence', 'occupation'], 'pet' => ['species', 'pet_status']]);

    $this->postJson("/api/adoptions/{$adoption->id}/transition", ['status' => AdoptionStatus::APPROVED, 'notes' => 'Apta'])
        ->assertOk()
        ->assertJsonPath('adoption_status.name', AdoptionStatus::APPROVED)
        ->assertJsonPath('pet.pet_status.name', PetStatus::RESERVED)
        ->assertJsonPath('notes', 'Apta');

    $this->postJson("/api/adoptions/{$adoption->id}/transition", ['status' => AdoptionStatus::DELIVERED])
        ->assertOk()
        ->assertJsonPath('pet.pet_status.name', PetStatus::ADOPTED)
        ->assertJsonPath('next_statuses', []);
});

test('a transition the workflow does not allow is refused', function () {
    Sanctum::actingAs(accountWithRole('Recepcionista'));
    $adoption = adoptionIn(AdoptionStatus::DELIVERED);

    $this->postJson("/api/adoptions/{$adoption->id}/transition", ['status' => AdoptionStatus::REJECTED])
        ->assertJsonValidationErrors('status');

    expect($adoption->fresh()->adoptionStatus->name)->toBe(AdoptionStatus::DELIVERED);
});

test('the update cannot skip the workflow and release a delivered pet', function () {
    Sanctum::actingAs(accountWithRole('Recepcionista'));
    $adoption = adoptionIn(AdoptionStatus::DELIVERED);

    $this->putJson("/api/adoptions/{$adoption->id}", ['adoption_status_id' => statusId(AdoptionStatus::REJECTED)])
        ->assertJsonValidationErrors('adoption_status_id');

    expect($adoption->pet->fresh()->petStatus->name)->toBe(PetStatus::ADOPTED);
});

test('transitions require the adoptions permission', function () {
    Sanctum::actingAs(accountWithRole('Veterinario'));
    $adoption = adoptionIn(AdoptionStatus::PENDING);

    $this->postJson("/api/adoptions/{$adoption->id}/transition", ['status' => AdoptionStatus::APPROVED])->assertForbidden();
});

test('the catalog can ask only for available pets', function () {
    $response = $this->getJson('/api/pets?available=1&per_page=100')->assertOk();

    expect($response->json('total'))->toBe(Pet::query()->available()->count())
        ->and($response->json('total'))->toBeLessThan(Pet::count());
});

test('every breed fits in one request for the pets form', function () {
    expect($this->getJson('/api/breeds?per_page=100')->json('total'))->toBe(Breed::count());
    expect(count($this->getJson('/api/breeds?per_page=100')->json('data')))->toBe(Breed::count());
});

test('the photo of a pet is stored', function () {
    Sanctum::actingAs(accountWithRole('Veterinario'));
    $base = eligiblePet();

    $this->postJson('/api/pets', [
        ...$base->only(['species_id', 'breed_id', 'sex', 'color_id', 'pet_status_id', 'shelter_id']),
        'name' => 'Foto',
        'birth_date' => '2024-01-01',
        'registered_at' => '2024-01-01',
        'photo_url' => 'https://example.com/foto.jpg',
    ])->assertCreated()->assertJsonPath('photo_url', 'https://example.com/foto.jpg');
});

test('the account carries its permissions', function () {
    Sanctum::actingAs(accountWithRole('Recepcionista'));

    expect($this->getJson('/api/user')->json('permissions'))->toContain('manage_adoptions');
});

test('registering through the api creates an adopter', function () {
    $response = $this->postJson('/api/register', ['name' => 'Ana', 'email' => 'ana.nueva@example.com', 'password' => 'secret1'])->assertCreated();

    expect($response->json('user.roles.0.name'))->toBe(Role::ADOPTER)
        ->and($response->json('user.permissions'))->toBe(['adopt']);
});

test('shared catalogs can be read by any account but only written with the permission', function () {
    Sanctum::actingAs(accountWithRole('Recepcionista'));

    foreach (['adoption-statuses', 'occupations', 'residences', 'appointment-types', 'treatment-types'] as $slug) {
        $this->getJson("/api/{$slug}")->assertOk();
        $this->postJson("/api/{$slug}", ['name' => 'X'])->assertForbidden();
    }

    Sanctum::actingAs(accountWithRole('Administrador'));
    $this->postJson('/api/adoption-statuses', ['name' => 'Nuevo'])->assertCreated();
});

test('the public lookup needs email and document and exposes no personal data', function () {
    $person = adoptionIn(AdoptionStatus::PENDING)->person;

    $this->getJson('/api/public/my-applications?email='.urlencode($person->email))->assertJsonValidationErrors('document_number');
    $this->getJson('/api/public/my-applications?email='.urlencode($person->email).'&document_number=otro')->assertExactJson([]);

    $response = $this->getJson('/api/public/my-applications?email='.urlencode($person->email).'&document_number='.urlencode($person->document_number))->assertOk();

    expect(array_keys($response->json('0')))->toBe(['id', 'requested_at', 'approved_at', 'delivered_at', 'adoption_status', 'pet']);
});

test('a public request cannot be repeated nor reuse the document of another person', function () {
    $pet = eligiblePet();
    $request = ['pet_id' => $pet->id, 'name' => 'Ana', 'email' => 'ana.nueva@example.com', 'document_number' => '1234567890'];

    $this->postJson('/api/public/adoptions', $request)->assertCreated();
    $this->postJson('/api/public/adoptions', $request)->assertJsonValidationErrors('pet_id');
    $this->postJson('/api/public/adoptions', [...$request, 'email' => 'otra@example.com'])->assertJsonValidationErrors('document_number');
    $this->postJson('/api/public/adoptions', [...$request, 'name' => str_repeat('a', 51)])->assertJsonValidationErrors('name');
});

test('an adopter manages their profile and requests through the api', function () {
    $adopter = accountWithRole(Role::ADOPTER);
    Sanctum::actingAs($adopter);
    $pet = eligiblePet();

    $this->postJson('/api/my/adoptions', ['pet_id' => $pet->id])->assertJsonValidationErrors('profile');

    $this->putJson('/api/my/profile', [
        'document_type' => 'DPI',
        'document_number' => '1234567890',
        'estado_civil' => 'Soltero/a',
        'cantidad_hijos' => 0,
        'occupation_id' => Occupation::value('id'),
        'residence_id' => Residence::value('id'),
        'income' => 5000,
        'current_pets_count' => 0,
    ])->assertOk()->assertJsonPath('email', $adopter->email);

    $id = $this->postJson('/api/my/adoptions', ['pet_id' => $pet->id, 'notes' => 'Tengo patio'])->assertCreated()->json('id');
    $this->postJson('/api/my/adoptions', ['pet_id' => $pet->id])->assertJsonValidationErrors('pet_id');
    $this->getJson('/api/my/adoptions')->assertOk()->assertJsonCount(1);

    $this->postJson("/api/my/adoptions/{$id}/cancel")->assertOk()->assertJsonPath('adoption_status.name', AdoptionStatus::CANCELLED);
    $this->postJson("/api/my/adoptions/{$id}/cancel")->assertJsonValidationErrors('status');
});

test('an adopter cannot touch the requests of other people', function () {
    $other = adoptionIn(AdoptionStatus::PENDING);
    Sanctum::actingAs(accountWithRole(Role::ADOPTER));

    $this->postJson("/api/my/adoptions/{$other->id}/cancel")->assertNotFound();
});

test('the adopter area needs the adopt permission', function () {
    Sanctum::actingAs(accountWithRole('Veterinario'));

    $this->getJson('/api/my/adoptions')->assertForbidden();
});
