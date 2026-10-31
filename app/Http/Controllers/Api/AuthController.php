<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ]);

        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => [__('auth.failed')]]);
        }

        return response()->json([
            'token' => $user->createToken($credentials['device_name'] ?? 'api')->plainTextToken,
            'user' => $this->profile($user),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $defaultRole = Role::query()->where('name', Role::ADOPTER)->first();
        if ($defaultRole) {
            $user->roles()->syncWithoutDetaching([$defaultRole->id]);
        }

        return response()->json([
            'token' => $user->createToken($data['device_name'] ?? 'api')->plainTextToken,
            'user' => $this->profile($user),
        ], 201);
    }

    public function logout(Request $request): Response
    {
        $token = $request->user()?->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->noContent();
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json($this->profile($request->user()));
    }

    /**
     * The account with its roles and the permissions the SPA uses to show each module.
     *
     * @return array<string, mixed>
     */
    private function profile(User $user): array
    {
        return [...$user->load('roles')->toArray(), 'permissions' => $user->permissionNames()->values()];
    }
}

