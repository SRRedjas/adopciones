<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Unique indexes on the name of each catalog.
     *
     * @var array<string, list<string>>
     */
    private array $uniques = [
        'species' => ['name'],
        'colors' => ['name'],
        'pet_statuses' => ['name'],
        'adoption_statuses' => ['name'],
        'shelters' => ['name'],
        'occupations' => ['name'],
        'treatment_types' => ['name'],
        'appointment_types' => ['name'],
        'breeds' => ['species_id', 'name'],
        'treatments' => ['treatment_type_id', 'name'],
        'people' => ['email'],
    ];

    /**
     * CHECK constraints by table. SQLite cannot add them to an existing table, so they exist on SQL Server and MySQL.
     *
     * @var array<string, array<string, string>>
     */
    private array $checks = [
        'adoptions' => [
            'adoptions_approved_after_requested' => 'approved_at >= requested_at',
            'adoptions_delivered_after_approved' => 'delivered_at >= approved_at',
            'adoptions_delivered_after_requested' => 'delivered_at >= requested_at',
        ],
        'people' => [
            'people_income_positive' => 'income >= 0',
            'people_current_pets_positive' => 'current_pets_count >= 0',
        ],
        'pets' => ['pets_weight_positive' => 'weight_kg >= 0'],
        'residences' => ['residences_animal_limit_positive' => 'animal_limit >= 0'],
        'treatments' => ['treatments_cost_positive' => 'cost >= 0'],
        'donations' => ['donations_amount_positive' => 'amount >= 0'],
    ];

    public function up(): void
    {
        // MySQL no revierte DDL: cada paso se puede repetir si un despliegue anterior se quedo a medias.

        // Los cambios automaticos de estado pueden no tener un usuario que los origine.
        Schema::table('pet_histories', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });

        // Un indice no puede consultar adoption_statuses: la adopcion guarda si retiene a la mascota.
        if (! Schema::hasColumn('adoptions', 'holds_pet')) {
            Schema::table('adoptions', function (Blueprint $table) {
                $table->boolean('holds_pet')->default(false);
            });
        }

        DB::table('adoptions')
            ->whereIn('adoption_status_id', DB::table('adoption_statuses')->whereIn('name', ['Aprobada', 'Entregada'])->select('id'))
            ->update(['holds_pet' => true]);

        if (! Schema::hasIndex('adoptions', 'adoptions_pet_holding_unique')) {
            $this->addHoldingIndex();
        }

        foreach ($this->uniques as $table => $columns) {
            if (! Schema::hasIndex($table, $columns, 'unique')) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->unique($columns));
            }
        }

        if (! Schema::hasIndex('residences', 'residences_name_unique')) {
            $this->addResidenceNameIndex();
        }

        if ($this->supportsChecks()) {
            foreach ($this->checks as $table => $checks) {
                foreach ($checks as $name => $expression) {
                    if (! $this->hasCheck($name)) {
                        DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$name} CHECK ({$expression})");
                    }
                }
            }
        }
    }

    public function down(): void
    {
        if ($this->supportsChecks()) {
            foreach ($this->checks as $table => $checks) {
                foreach (array_keys($checks) as $name) {
                    DB::statement("ALTER TABLE {$table} DROP ".($this->isMysql() ? 'CHECK' : 'CONSTRAINT')." {$name}");
                }
            }
        }

        Schema::table('residences', fn (Blueprint $table) => $table->dropIndex('residences_name_unique'));

        foreach ($this->uniques as $table => $columns) {
            Schema::table($table, function (Blueprint $blueprint) use ($columns) {
                // MySQL reuses the composite index for the foreign key of its first column.
                if ($this->isMysql() && count($columns) > 1 && ! Schema::hasIndex($blueprint->getTable(), [$columns[0]])) {
                    $blueprint->index($columns[0]);
                }

                $blueprint->dropUnique($columns);
            });
        }

        Schema::table('adoptions', function (Blueprint $table) {
            $table->dropIndex('adoptions_pet_holding_unique');
        });

        Schema::table('adoptions', function (Blueprint $table) {
            $table->dropColumn($this->isMysql() ? ['held_pet_id', 'holds_pet'] : ['holds_pet']);
        });

        Schema::table('pet_histories', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }

    /**
     * One holding adoption per pet. MySQL has no filtered indexes: a generated column is NULL unless the
     * adoption holds the pet, and a unique index admits any number of NULLs.
     */
    private function addHoldingIndex(): void
    {
        if ($this->isMysql()) {
            Schema::table('adoptions', function (Blueprint $table) {
                $table->unsignedBigInteger('held_pet_id')->nullable()->virtualAs('CASE WHEN holds_pet = 1 THEN pet_id END');
                $table->unique('held_pet_id', 'adoptions_pet_holding_unique');
            });

            return;
        }

        DB::statement('CREATE UNIQUE INDEX adoptions_pet_holding_unique ON adoptions (pet_id) WHERE holds_pet = 1');
    }

    /**
     * The name is optional: SQL Server only admits one NULL in a plain unique index and needs the filter.
     */
    private function addResidenceNameIndex(): void
    {
        if ($this->isMysql()) {
            Schema::table('residences', fn (Blueprint $table) => $table->unique('name', 'residences_name_unique'));

            return;
        }

        DB::statement('CREATE UNIQUE INDEX residences_name_unique ON residences (name) WHERE name IS NOT NULL');
    }

    private function supportsChecks(): bool
    {
        return $this->isMysql() || DB::getDriverName() === 'sqlsrv';
    }

    private function hasCheck(string $name): bool
    {
        return $this->isMysql()
            ? DB::table('information_schema.table_constraints')->whereRaw('constraint_schema = DATABASE()')->where('constraint_name', $name)->exists()
            : DB::table('sys.check_constraints')->where('name', $name)->exists();
    }

    private function isMysql(): bool
    {
        return in_array(DB::getDriverName(), ['mysql', 'mariadb'], true);
    }
};
