import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ResourceCrudView, FieldConfig } from '../../components/crud/ResourceCrudView';
import { Species, Breed, Color, PetStatus, AdoptionStatus, AppointmentType, TreatmentType } from '../../types/models';
import { Column } from '../../components/ui/Table';
import { api } from '../../api/client';

export const SettingsAdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'species' | 'breeds' | 'colors' | 'petStatuses' | 'adoptionStatuses' | 'aptTypes' | 'treatmentTypes'>('species');

    const [speciesOptions, setSpeciesOptions] = useState<{ value: number; label: string }[]>([
        { value: 1, label: 'Canino (Perro)' },
        { value: 2, label: 'Felino (Gato)' },
        { value: 3, label: 'Ave' },
        { value: 4, label: 'Otro' },
    ]);

    useEffect(() => {
        api.get('species', { per_page: 50 })
            .then((res: any) => {
                const list: Species[] = Array.isArray(res) ? res : res?.data;
                if (list && list.length > 0) {
                    setSpeciesOptions(list.map((s: Species) => ({
                        value: s.id,
                        label: s.name,
                    })));
                }
            })
            .catch(() => {});
    }, []);

    // 1. Especies
    const speciesColumns: Column<Species>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        { header: 'Especie', accessorKey: 'name', className: 'font-bold text-gray-900' },
        { header: 'Descripción', accessorKey: 'description', className: 'text-xs text-gray-600' },
    ];
    const speciesFields: FieldConfig[] = [
        { name: 'name', label: 'Nombre de la Especie', required: true, placeholder: 'Canino, Felino, Equino...' },
        { name: 'description', label: 'Descripción', required: true, placeholder: 'Mamífero domesticado...' },
    ];

    // 2. Razas
    const breedColumns: Column<Breed>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        { header: 'Raza', accessorKey: 'name', className: 'font-bold text-gray-900' },
        { header: 'Especie', cell: (b) => <span className="text-xs">{b.species?.name || `Especie #${b.species_id}`}</span> },
        { header: 'Descripción', accessorKey: 'description', className: 'text-xs text-gray-600' },
    ];
    const breedFields: FieldConfig[] = [
        {
            name: 'species_id',
            label: 'Especie',
            type: 'select',
            required: true,
            options: speciesOptions,
        },
        { name: 'name', label: 'Nombre de la Raza', required: true, placeholder: 'Labrador, Mestizo, Siamés...' },
        { name: 'description', label: 'Descripción / Características', required: true, placeholder: 'Pelaje corto, complexión atlética...' },
    ];

    // 3. Colores
    const colorColumns: Column<Color>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        { header: 'Color', accessorKey: 'name', className: 'font-bold text-gray-900' },
        {
            header: 'Muestra Hex',
            cell: (c) => (
                <div className="flex items-center gap-2">
                    {c.hex_color && (
                        <span
                            className="h-4 w-4 rounded-full border border-gray-300 shadow-2xs"
                            style={{ backgroundColor: c.hex_color }}
                        />
                    )}
                    <span className="font-mono text-xs">{c.hex_color || '—'}</span>
                </div>
            ),
        },
    ];
    const colorFields: FieldConfig[] = [
        { name: 'name', label: 'Nombre del Color', required: true, placeholder: 'Negro, Atigrado, Blanco...' },
        { name: 'hex_color', label: 'Código Hex (#RRGGBB)', placeholder: '#1a1a1a' },
    ];

    // 4. Estados de Mascotas
    const petStatusColumns: Column<PetStatus>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        { header: 'Estado del Animal', accessorKey: 'name', className: 'font-bold text-gray-900' },
        { header: 'Adoptable', cell: (s) => <span className="text-xs">{s.is_adoptable ? 'Sí' : 'No'}</span> },
    ];
    const petStatusFields: FieldConfig[] = [
        { name: 'name', label: 'Nombre del Estado', required: true, placeholder: 'En cuarentena, Disponible, En tratamiento...' },
        { name: 'is_adoptable', label: 'Se puede adoptar en este estado', type: 'checkbox' },
    ];

    // 5. Estados de Adopción
    const adopStatusColumns: Column<AdoptionStatus>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        { header: 'Estado del Trámite', accessorKey: 'name', className: 'font-bold text-gray-900' },
    ];
    const adopStatusFields: FieldConfig[] = [
        { name: 'name', label: 'Nombre del Estado', required: true, placeholder: 'En revisión, Aprobada, Entregada, Rechazada...' },
    ];

    // 6. Tipos de Cita
    const aptTypeColumns: Column<AppointmentType>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        { header: 'Tipo de Cita', accessorKey: 'name', className: 'font-bold text-gray-900' },
    ];
    const aptTypeFields: FieldConfig[] = [
        { name: 'name', label: 'Nombre del Tipo de Cita', required: true, placeholder: 'Visita de adopción, Chequeo post-operatorio...' },
    ];

    // 7. Tipos de Tratamiento
    const treatTypeColumns: Column<TreatmentType>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        { header: 'Clasificación de Tratamiento', accessorKey: 'name', className: 'font-bold text-gray-900' },
    ];
    const treatTypeFields: FieldConfig[] = [
        { name: 'name', label: 'Nombre de la Clasificación', required: true, placeholder: 'Vacunación, Cirugía, Antiparasitario...' },
    ];

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-gray-900">
                        Catálogos y Parámetros del Sistema
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Definición de especies, razas, estados operativos y clasificaciones médicas.
                    </p>
                </div>

                {/* Tabs de Configuración */}
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {[
                        { key: 'species', label: 'Especies' },
                        { key: 'breeds', label: 'Razas' },
                        { key: 'colors', label: 'Colores' },
                        { key: 'petStatuses', label: 'Estados de Mascota' },
                        { key: 'adoptionStatuses', label: 'Estados de Adopción' },
                        { key: 'aptTypes', label: 'Tipos de Cita' },
                        { key: 'treatmentTypes', label: 'Tipos de Tratamiento' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                                activeTab === tab.key
                                    ? 'border-[#006c49] text-[#006c49]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'species' && (
                    <ResourceCrudView<Species>
                        title="Catálogo de Especies"
                        endpoint="species"
                        columns={speciesColumns}
                        fields={speciesFields}
                    />
                )}

                {activeTab === 'breeds' && (
                    <ResourceCrudView<Breed>
                        title="Catálogo de Razas"
                        endpoint="breeds"
                        columns={breedColumns}
                        fields={breedFields}
                        onTransformPayload={(payload) => {
                            const data = { ...payload };
                            if (data.species_id !== undefined && data.species_id !== null && data.species_id !== '') {
                                data.species_id = parseInt(String(data.species_id), 10);
                            }
                            return data;
                        }}
                    />
                )}

                {activeTab === 'colors' && (
                    <ResourceCrudView<Color>
                        title="Catálogo de Colores y Pelajes"
                        endpoint="colors"
                        columns={colorColumns}
                        fields={colorFields}
                    />
                )}

                {activeTab === 'petStatuses' && (
                    <ResourceCrudView<PetStatus>
                        title="Estados Clínicos y Operativos de Mascotas"
                        endpoint="pet-statuses"
                        columns={petStatusColumns}
                        fields={petStatusFields}
                    />
                )}

                {activeTab === 'adoptionStatuses' && (
                    <ResourceCrudView<AdoptionStatus>
                        title="Estados del Trámite de Adopción"
                        endpoint="adoption-statuses"
                        columns={adopStatusColumns}
                        fields={adopStatusFields}
                    />
                )}

                {activeTab === 'aptTypes' && (
                    <ResourceCrudView<AppointmentType>
                        title="Tipos de Citas Veterinarias y Visitas"
                        endpoint="appointment-types"
                        columns={aptTypeColumns}
                        fields={aptTypeFields}
                    />
                )}

                {activeTab === 'treatmentTypes' && (
                    <ResourceCrudView<TreatmentType>
                        title="Tipos de Tratamientos Médicos"
                        endpoint="treatment-types"
                        columns={treatTypeColumns}
                        fields={treatTypeFields}
                    />
                )}
            </div>
        </AppLayout>
    );
};

