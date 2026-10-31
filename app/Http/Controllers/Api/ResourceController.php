<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

abstract class ResourceController extends Controller
{
    /** @var class-string<Model> */
    protected string $model;

    /** @var list<string> */
    protected array $with = [];

    /**
     * Validation rules for the resource; `$record` is set when updating.
     *
     * @return array<string, array<int, mixed>>
     */
    abstract protected function rules(Request $request, ?Model $record): array;

    /**
     * Attributes filled on create when the client does not send them.
     *
     * @return array<string, mixed>
     */
    protected function defaults(Request $request): array
    {
        return [];
    }

    /**
     * Narrows the index listing with the filters a resource supports.
     *
     * @param  Builder<Model>  $query
     */
    protected function filter(Builder $query, Request $request): void
    {
        //
    }

    /**
     * Exposes the validation rules so the Livewire views reuse the same source of truth as the API.
     *
     * @return array<string, array<int, mixed>>
     */
    public function validationRules(Request $request, ?Model $record): array
    {
        return $this->rules($request, $record);
    }

    /**
     * @return array<string, mixed>
     */
    public function defaultAttributes(Request $request): array
    {
        return $this->defaults($request);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 15), 1), 100);
        $dummy = new $this->model;
        $table = $dummy->getTable();
        $query = $this->model::query()->with($this->with);

        if ($request->filled('shelter_id')) {
            $shelterId = (int) $request->input('shelter_id');
            if ($shelterId > 0) {
                if (Schema::hasColumn($table, 'shelter_id')) {
                    $query->where($table . '.shelter_id', $shelterId);
                } elseif (method_exists($dummy, 'pet')) {
                    $query->whereHas('pet', function ($q) use ($shelterId) {
                        $q->where('shelter_id', $shelterId);
                    });
                }
            }
        }

        $this->filter($query, $request);

        $direction = strtolower($request->input('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $sortBy = $request->input('sort_by', 'id');

        if (Schema::hasColumn($table, $sortBy)) {
            $query->orderBy($table . '.' . $sortBy, $direction);
        } else {
            $query->orderBy($table . '.id', $direction);
        }

        return response()->json($query->paginate($perPage));
    }

    public function show(string $id): JsonResponse
    {
        return response()->json($this->find($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules($request, null));

        $record = DB::transaction(fn () => $this->model::query()->create([...$this->defaults($request), ...$data]));

        return response()->json($record->refresh()->load($this->with), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $record = $this->find($id);

        $rules = array_map(
            fn (array $fieldRules) => ['sometimes', ...$fieldRules],
            $this->rules($request, $record)
        );

        $data = $request->validate($rules);

        DB::transaction(fn () => $record->update($data));

        return response()->json($record->refresh()->load($this->with));
    }

    public function destroy(string $id): Response
    {
        $this->find($id)->delete();

        return response()->noContent();
    }

    protected function find(string $id): Model
    {
        return $this->model::query()->with($this->with)->findOrFail($id);
    }
}
