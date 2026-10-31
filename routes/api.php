<?php

use App\Http\Controllers\Api\AdopterController;
use App\Http\Controllers\Api\AdoptionController;
use App\Http\Controllers\Api\AdoptionFollowUpController;
use App\Http\Controllers\Api\AdoptionStatusController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AppointmentTypeController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BreedController;
use App\Http\Controllers\Api\ColorController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\DonationController;
use App\Http\Controllers\Api\DonorController;
use App\Http\Controllers\Api\OccupationController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\PersonController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\PetHistoryController;
use App\Http\Controllers\Api\PetStatusController;
use App\Http\Controllers\Api\PetTreatmentController;
use App\Http\Controllers\Api\RescueController;
use App\Http\Controllers\Api\ResidenceController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ShelterController;
use App\Http\Controllers\Api\SpeciesController;
use App\Http\Controllers\Api\TreatmentController;
use App\Http\Controllers\Api\TreatmentTypeController;
use App\Http\Controllers\Api\UserController;
use App\Support\Modules;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:6,1');
Route::post('register', [AuthController::class, 'register']);

// Rutas públicas de catálogo, metadatos y solicitudes de adopción
Route::get('pets', [PetController::class, 'index']);
Route::get('pets/{pet}', [PetController::class, 'show']);
Route::get('species', [SpeciesController::class, 'index']);
Route::get('species/{species}', [SpeciesController::class, 'show']);
Route::get('breeds', [BreedController::class, 'index']);
Route::get('breeds/{breed}', [BreedController::class, 'show']);
Route::get('colors', [ColorController::class, 'index']);
Route::get('colors/{color}', [ColorController::class, 'show']);
Route::get('pet-statuses', [PetStatusController::class, 'index']);
Route::get('pet-statuses/{pet_status}', [PetStatusController::class, 'show']);
Route::get('shelters', [ShelterController::class, 'index']);
Route::get('shelters/{shelter}', [ShelterController::class, 'show']);
Route::post('public/adoptions', [AdoptionController::class, 'publicApply']);
Route::get('public/my-applications', [AdoptionController::class, 'publicMyApplications'])->middleware('throttle:10,1');
Route::post('public/donations', [DonationController::class, 'publicDonate']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', [AuthController::class, 'user']);
    Route::post('logout', [AuthController::class, 'logout']);

    // Area del adoptante: solo opera sobre la persona vinculada a la cuenta.
    Route::middleware('can:adopt')->prefix('my')->controller(AdopterController::class)->group(function () {
        Route::get('adoptions', 'adoptions');
        Route::post('adoptions', 'request');
        Route::post('adoptions/{adoption}/cancel', 'cancel');
        Route::get('profile', 'profile');
        Route::put('profile', 'saveProfile');
    });

    Route::post('adoptions/{adoption}/transition', [AdoptionController::class, 'transition'])->middleware('can:manage_adoptions');

    Route::put('roles/{role}/permissions', [RoleController::class, 'syncPermissions'])->middleware('can:manage_users');
    Route::put('users/{user}/roles', [UserController::class, 'syncRoles'])->middleware('can:manage_users');

    // Cada recurso exige el mismo permiso que su modulo web (App\Support\Modules).
    $resources = [
        'users' => UserController::class,
        'species' => SpeciesController::class,
        'colors' => ColorController::class,
        'pet-statuses' => PetStatusController::class,
        'shelters' => ShelterController::class,
        'residences' => ResidenceController::class,
        'adoption-statuses' => AdoptionStatusController::class,
        'roles' => RoleController::class,
        'permissions' => PermissionController::class,
        'treatment-types' => TreatmentTypeController::class,
        'breeds' => BreedController::class,
        'occupations' => OccupationController::class,
        'people' => PersonController::class,
        'donors' => DonorController::class,
        'treatments' => TreatmentController::class,
        'pets' => PetController::class,
        'pet-histories' => PetHistoryController::class,
        'pet-treatments' => PetTreatmentController::class,
        'appointment-types' => AppointmentTypeController::class,
        'appointments' => AppointmentController::class,
        'donations' => DonationController::class,
        'rescues' => RescueController::class,
        'adoptions' => AdoptionController::class,
        'adoption-follow-ups' => AdoptionFollowUpController::class,
        'contracts' => ContractController::class,
    ];

    // Recursos con catálogo público: index y show ya están registrados arriba sin autenticación.
    $publicCatalog = ['pets', 'species', 'breeds', 'colors', 'pet-statuses', 'shelters'];

    // Catálogos que otros módulos usan en sus formularios: los lee cualquier cuenta, escribir exige el permiso.
    $sharedCatalogs = ['adoption-statuses', 'occupations', 'residences', 'appointment-types', 'treatment-types'];

    foreach ($sharedCatalogs as $slug) {
        Route::apiResource($slug, $resources[$slug])->only(['index', 'show']);
    }

    foreach ($resources as $slug => $controller) {
        $route = Route::apiResource($slug, $controller)->middleware('can:'.Modules::permission($slug));

        if (in_array($slug, [...$publicCatalog, ...$sharedCatalogs], true)) {
            $route->except(['index', 'show']);
        }

        // El historial lo escribe la aplicacion en cada cambio de estado de la mascota.
        if ($slug === 'pet-histories') {
            $route->only(['index', 'show']);
        }
    }
});
