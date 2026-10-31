<?php

use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionRoleSeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Laravel\Sanctum\Sanctum;
use Livewire\Volt\Volt;

beforeEach(function () {
    $this->seed([RoleSeeder::class, PermissionSeeder::class, PermissionRoleSeeder::class]);
});

function userWithRole(string $role): User
{
    $user = User::factory()->create();
    $user->roles()->attach(Role::where('name', $role)->firstOrFail());

    return $user;
}

test('registering assigns the adopter role', function () {
    Volt::test('pages.auth.register')
        ->set('name', 'Nueva Persona')
        ->set('email', 'nueva@example.com')
        ->set('password', 'password')
        ->set('password_confirmation', 'password')
        ->call('register')
        ->assertRedirect(route('dashboard', absolute: false));

    expect(User::where('email', 'nueva@example.com')->firstOrFail()->roles->pluck('name')->all())
        ->toBe([Role::ADOPTER]);
});

test('adopters cannot open management modules', function () {
    $adopter = userWithRole(Role::ADOPTER);

    $this->actingAs($adopter)->get('/dashboard')->assertOk()->assertSee('Mascotas disponibles');
    $this->actingAs($adopter)->get('/pets')->assertForbidden();
    $this->actingAs($adopter)->get('/users')->assertForbidden();
});

test('modules are limited to the permissions of the role', function () {
    $vet = userWithRole('Veterinario');

    $this->actingAs($vet)->get('/pets')->assertOk();
    $this->actingAs($vet)->get('/treatments')->assertOk();
    $this->actingAs($vet)->get('/adoptions')->assertForbidden();
    $this->actingAs($vet)->get('/users')->assertForbidden();
    $this->actingAs($vet)->get('/species')->assertForbidden();
    $this->actingAs($vet)->get('/adoptar')->assertForbidden();
});

test('administrators can open every module', function () {
    $admin = userWithRole('Administrador');

    foreach (['/pets', '/adoptions', '/donations', '/species', '/users', '/roles'] as $uri) {
        $this->actingAs($admin)->get($uri)->assertOk();
    }
});

test('the api applies the same permissions', function () {
    $receptionist = userWithRole('Recepcionista');
    Sanctum::actingAs($receptionist);

    $this->getJson('/api/adoptions')->assertOk();
    $this->postJson('/api/pets')->assertForbidden();
    $this->getJson('/api/users')->assertForbidden();
    $this->putJson("/api/users/{$receptionist->id}/roles", ['role_ids' => []])->assertForbidden();
});
