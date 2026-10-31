import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ResourceCrudView, FieldConfig, FieldOption } from '../../components/crud/ResourceCrudView';
import { Breed, Pet } from '../../types/models';
import { Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';

// Estos estados los asigna el flujo de solicitudes de adopción, nunca el formulario.
const WORKFLOW_STATUSES = ['Reservado', 'Adoptado'];

export const PetsAdminPage: React.FC = () => {
    const [speciesOptions, setSpeciesOptions] = useState([
        { value: 1, label: 'Perro' },
        { value: 2, label: 'Gato' },
        { value: 3, label: 'Ave' },
        { value: 4, label: 'Conejo' },
        { value: 5, label: 'Reptil' },
    ]);

    const [breeds, setBreeds] = useState<Breed[]>([]);

    const [colorOptions, setColorOptions] = useState([
        { value: 1, label: 'Negro' },
        { value: 2, label: 'Blanco' },
        { value: 3, label: 'Café' },
        { value: 4, label: 'Gris' },
        { value: 5, label: 'Dorado' },
        { value: 6, label: 'Naranja' },
        { value: 7, label: 'Marrón claro' },
        { value: 8, label: 'Atigrado' },
        { value: 9, label: 'Manchado' },
        { value: 10, label: 'Blanco y negro' },
    ]);

    const [shelterOptions, setShelterOptions] = useState([
        { value: 1, label: 'Refugio Esperanza Animal (Zona 10)' },
        { value: 2, label: 'Refugio Patitas Felices (Quetzaltenango)' },
        { value: 3, label: 'Refugio Huellas de Amor (Escuintla)' },
    ]);

    const [statusOptions, setStatusOptions] = useState([
        { value: 1, label: 'Disponible' },
        { value: 2, label: 'En tratamiento' },
        { value: 3, label: 'En cuarentena' },
        { value: 4, label: 'Reservado' },
        { value: 5, label: 'Adoptado' },
        { value: 6, label: 'Fallecido' },
    ]);

    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [sp, br, col, sh, st] = await Promise.allSettled([
                    api.get('species'),
                    api.get('breeds', { per_page: 100 }),
                    api.get('colors'),
                    api.get('shelters'),
                    api.get('pet-statuses'),
                ]);

                if (sp.status === 'fulfilled' && sp.value) {
                    const list = Array.isArray(sp.value) ? sp.value : sp.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setSpeciesOptions(list.map((item: any) => ({ value: item.id, label: item.name })));
                    }
                }

                if (br.status === 'fulfilled' && br.value) {
                    const list = Array.isArray(br.value) ? br.value : br.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setBreeds(list);
                    }
                }

                if (col.status === 'fulfilled' && col.value) {
                    const list = Array.isArray(col.value) ? col.value : col.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setColorOptions(list.map((item: any) => ({ value: item.id, label: item.name })));
                    }
                }

                if (sh.status === 'fulfilled' && sh.value) {
                    const list = Array.isArray(sh.value) ? sh.value : sh.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setShelterOptions(list.map((item: any) => ({ value: item.id, label: item.name })));
                    }
                }

                if (st.status === 'fulfilled' && st.value) {
                    const list = Array.isArray(st.value) ? st.value : st.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setStatusOptions(list.map((item: any) => ({ value: item.id, label: item.name })));
                    }
                }
            } catch (e) {
                // Mantener fallbacks
            }
        };

        loadCatalogs();
    }, []);

    const columns: Column<Pet>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        {
            header: 'Mascota',
            cell: (pet) => (
                <div className="flex items-center gap-3">
                    {pet.photo_url ? (
                        <img
                            src={pet.photo_url}
                            alt={pet.name}
                            className="h-9 w-9 shrink-0 rounded-full object-cover border border-emerald-300 shadow-2xs"
                        />
                    ) : (
                        <div className="h-9 w-9 shrink-0 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200">
                            {pet.name ? pet.name.charAt(0).toUpperCase() : '?'}
                        </div>
                    )}
                    <div>
                        <span className="font-bold text-gray-900">{pet.name}</span>
                        <p className="text-xs text-gray-500">
                            {pet.breed?.name || 'Raza N/A'} • {pet.species?.name || 'Especie N/A'}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Sexo',
            cell: (pet) => (
                <span className="font-semibold text-xs">
                    {pet.sex === 'M' ? 'Macho' : 'Hembra'}
                </span>
            ),
        },
        {
            header: 'Edad / Peso',
            cell: (pet) => (
                <span className="text-xs text-gray-700">
                    {pet.estimated_age ? `${pet.estimated_age} años` : '—'} • {pet.weight_kg ? `${pet.weight_kg} kg` : '—'}
                </span>
            ),
        },
        {
            header: 'Refugio',
            cell: (pet) => (
                <span className="text-xs text-gray-700">
                    {pet.shelter?.name || `Refugio #${pet.shelter_id}`}
                </span>
            ),
        },
        {
            header: 'Estado',
            cell: (pet) => (
                <Badge variant={pet.status === 'active' ? 'success' : 'neutral'}>
                    {pet.pet_status?.name || pet.status || 'Activo'}
                </Badge>
            ),
        },
    ];

    // Solo las razas de la especie elegida: la API rechaza cualquier otra combinación.
    const breedOptionsFor = (form: Record<string, any>): FieldOption[] =>
        breeds
            .filter((breed) => Number(breed.species_id) === Number(form.species_id))
            .map((breed) => ({ value: breed.id, label: breed.name }));

    // Un registro en edición conserva su estado aunque sea uno del flujo de adopción.
    const statusOptionsFor = (_form: Record<string, any>, editing: Pet | null): FieldOption[] =>
        statusOptions.filter(
            (status) => !WORKFLOW_STATUSES.includes(status.label) || status.value === editing?.pet_status_id
        );

    const fields: FieldConfig[] = [
        { name: 'name', label: 'Nombre de la Mascota', required: true, placeholder: 'Ej: Max' },
        {
            name: 'sex',
            label: 'Sexo',
            type: 'select',
            required: true,
            options: [
                { value: 'M', label: 'Macho (M)' },
                { value: 'F', label: 'Hembra (F)' },
            ],
        },
        {
            name: 'species_id',
            label: 'Especie',
            type: 'select',
            required: true,
            options: speciesOptions,
            resets: ['breed_id'],
        },
        {
            name: 'breed_id',
            label: 'Raza',
            type: 'select',
            required: true,
            placeholder: 'Seleccione primero la especie...',
            getOptions: breedOptionsFor,
        },
        {
            name: 'color_id',
            label: 'Color Principal',
            type: 'select',
            required: true,
            options: colorOptions,
        },
        {
            name: 'shelter_id',
            label: 'Refugio / Sede',
            type: 'select',
            required: true,
            options: shelterOptions,
        },
        {
            name: 'pet_status_id',
            label: 'Estado de Disponibilidad',
            type: 'select',
            required: true,
            getOptions: statusOptionsFor,
        },
        { name: 'birth_date', label: 'Fecha de Nacimiento Estimada', type: 'date', required: true },
        { name: 'registered_at', label: 'Fecha de Ingreso al Refugio', type: 'date', required: true },
        { name: 'estimated_age', label: 'Edad Estimada (años)', type: 'number', min: 0, max: 100 },
        { name: 'weight_kg', label: 'Peso en Kg', type: 'number', step: '0.1', min: 0 },
        {
            name: 'status',
            label: 'Estado Operativo del Registro',
            type: 'select',
            options: [
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
            ],
        },
        { name: 'photo_url', label: 'URL de Fotografía de la Mascota', placeholder: 'https://images.unsplash.com/... o enlace de foto' },
        { name: 'notes', label: 'Notas Médicas o de Comportamiento', type: 'textarea', placeholder: 'Historial previo, alergias, carácter...' },
    ];

    const handleTransformPayload = (data: any) => ({
        ...data,
        species_id: data.species_id ? parseInt(String(data.species_id), 10) : undefined,
        breed_id: data.breed_id ? parseInt(String(data.breed_id), 10) : undefined,
        color_id: data.color_id ? parseInt(String(data.color_id), 10) : undefined,
        shelter_id: data.shelter_id ? parseInt(String(data.shelter_id), 10) : undefined,
        pet_status_id: data.pet_status_id ? parseInt(String(data.pet_status_id), 10) : undefined,
        estimated_age: data.estimated_age !== '' && data.estimated_age !== null && data.estimated_age !== undefined
            ? parseInt(String(data.estimated_age), 10)
            : null,
        weight_kg: data.weight_kg !== '' && data.weight_kg !== null && data.weight_kg !== undefined
            ? parseFloat(String(data.weight_kg))
            : null,
        photo_url: data.photo_url?.trim() || null,
    });

    return (
        <AppLayout>
            <ResourceCrudView<Pet>
                title="Gestión de Mascotas y Albergados"
                description="Registro clínico, asignación de refugio y control de disponibilidad para adopción."
                endpoint="pets"
                columns={columns}
                fields={fields}
                modalWidth="xl"
                onTransformPayload={handleTransformPayload}
                filterShelter={true}
            />
        </AppLayout>
    );
};


