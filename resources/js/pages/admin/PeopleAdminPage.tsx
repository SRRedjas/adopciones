import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ResourceCrudView, FieldConfig } from '../../components/crud/ResourceCrudView';
import { Person, Occupation, Residence } from '../../types/models';
import { Column } from '../../components/ui/Table';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

export const PeopleAdminPage: React.FC = () => {
    const { hasPermission } = useAuth();
    const canEditCatalogs = hasPermission('manage_catalogs');
    const [activeTab, setActiveTab] = useState<'people' | 'occupations' | 'residences'>('people');

    const [occupationOptions, setOccupationOptions] = useState<{ value: number; label: string }[]>([
        { value: 1, label: 'Ingeniero de Software (Formal)' },
        { value: 2, label: 'Docente Universitario (Formal)' },
        { value: 3, label: 'Comerciante Independiente (Informal)' },
        { value: 4, label: 'Veterinario / Zootecnista (Formal)' },
    ]);

    const [residenceOptions, setResidenceOptions] = useState<{ value: number; label: string }[]>([
        { value: 1, label: 'Casa con jardín cercado (Límite: 4)' },
        { value: 2, label: 'Apartamento Pet-Friendly (Límite: 2)' },
        { value: 3, label: 'Casa pequeña sin patio (Límite: 1)' },
        { value: 4, label: 'Finca / Terreno amplio (Límite: 10)' },
    ]);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [occRes, resRes] = await Promise.allSettled([
                    api.get('occupations', { per_page: 50 }),
                    api.get('residences', { per_page: 50 }),
                ]);

                if (occRes.status === 'fulfilled' && occRes.value) {
                    const raw = occRes.value as any;
                    const list: Occupation[] = Array.isArray(raw) ? raw : raw.data;
                    if (list?.length) {
                        setOccupationOptions(list.map((o: Occupation) => ({
                            value: o.id,
                            label: `${o.name} (${o.formalidad || 'General'})`,
                        })));
                    }
                }

                if (resRes.status === 'fulfilled' && resRes.value) {
                    const raw = resRes.value as any;
                    const list: Residence[] = Array.isArray(raw) ? raw : raw.data;
                    if (list?.length) {
                        setResidenceOptions(list.map((r: Residence) => ({
                            value: r.id,
                            label: `${r.name} (Límite: ${r.animal_limit ?? 'N/A'})`,
                        })));
                    }
                }
            } catch {
                // fallbacks are active
            }
        };

        loadOptions();
    }, []);

    // Personas
    const peopleColumns: Column<Person>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        {
            header: 'Nombre Completo',
            cell: (p) => (
                <div>
                    <span className="font-bold text-gray-900">{p.name}</span>
                    <p className="text-xs text-gray-500">{p.email}</p>
                </div>
            ),
        },
        {
            header: 'Identificación',
            cell: (p) => (
                <span className="text-xs font-mono font-semibold text-gray-700">
                    {p.document_type}: {p.document_number}
                </span>
            ),
        },
        {
            header: 'Ingreso Mensual',
            cell: (p) => <span className="font-mono text-xs font-semibold text-gray-800">Q {p.income}</span>,
        },
        {
            header: 'Mascotas Actuales',
            cell: (p) => <span className="text-xs text-gray-700">{p.current_pets_count ?? 0}</span>,
        },
    ];

    const peopleFields: FieldConfig[] = [
        { name: 'name', label: 'Nombre Completo', required: true, placeholder: 'Nombres y Apellidos' },
        {
            name: 'document_type',
            label: 'Tipo de Documento',
            type: 'select',
            required: true,
            options: [
                { value: 'DPI', label: 'DPI (Documento Personal de Identificación)' },
                { value: 'PASSPORT', label: 'Pasaporte' },
            ],
        },
        { name: 'document_number', label: 'Número de Documento', required: true, placeholder: 'CUI o No. Pasaporte' },
        { name: 'email', label: 'Correo Electrónico', type: 'email', required: true, placeholder: 'correo@ejemplo.com' },
        { name: 'estado_civil', label: 'Estado Civil', required: true, placeholder: 'Soltero, Casado, etc.' },
        { name: 'cantidad_hijos', label: 'Cantidad de Hijos', type: 'number', min: 0, max: 99, required: true },
        {
            name: 'occupation_id',
            label: 'Ocupación',
            type: 'select',
            required: true,
            options: occupationOptions,
        },
        {
            name: 'residence_id',
            label: 'Tipo de Vivienda / Residencia',
            type: 'select',
            required: true,
            options: residenceOptions,
        },
        { name: 'income', label: 'Ingresos Mensuales Estimados (Q)', type: 'number', min: 0, required: true },
        { name: 'current_pets_count', label: 'Mascotas que Posee Actualmente', type: 'number', min: 0 },
    ];

    // Ocupaciones
    const occupationColumns: Column<Occupation>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        { header: 'Ocupación', accessorKey: 'name', className: 'font-bold' },
        { header: 'Formalidad', accessorKey: 'formalidad', className: 'text-xs' },
        { header: 'Horarios de Trabajo', accessorKey: 'horarios', className: 'text-xs text-gray-600' },
    ];

    const occupationFields: FieldConfig[] = [
        { name: 'name', label: 'Nombre de la Profesión u Oficio', required: true, placeholder: 'Ingeniero, Docente, Independiente...' },
        { name: 'formalidad', label: 'Formalidad del Empleo', required: true, placeholder: 'Formal, Informal, Emprendedor...' },
        { name: 'horarios', label: 'Disponibilidad / Horarios', required: true, placeholder: 'Lunes a Viernes 8am-5pm, Remoto...' },
    ];

    // Residencias
    const residenceColumns: Column<Residence>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        { header: 'Tipo de Residencia', accessorKey: 'name', className: 'font-bold' },
        { header: 'Límite Permitido de Animales', accessorKey: 'animal_limit', className: 'text-xs font-semibold' },
    ];

    const residenceFields: FieldConfig[] = [
        { name: 'name', label: 'Descripción / Tipo de Inmueble', placeholder: 'Casa con patio, Apartamento, Granja...' },
        { name: 'animal_limit', label: 'Límite Máximo de Animales', type: 'number', required: true, min: 0, max: 32767 },
    ];

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-gray-900">
                        Padrón Ciudadano y Estudio Socioeconómico
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Expediente de adoptantes, tipos de vivienda y perfiles ocupacionales.
                    </p>
                </div>

                <div className="flex border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('people')}
                        className={`py-3 px-5 text-xs font-bold transition-colors border-b-2 ${
                            activeTab === 'people'
                                ? 'border-[#006c49] text-[#006c49]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Solicitantes Registrados
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('occupations')}
                        className={`py-3 px-5 text-xs font-bold transition-colors border-b-2 ${
                            activeTab === 'occupations'
                                ? 'border-[#006c49] text-[#006c49]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Catálogo de Ocupaciones
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('residences')}
                        className={`py-3 px-5 text-xs font-bold transition-colors border-b-2 ${
                            activeTab === 'residences'
                                ? 'border-[#006c49] text-[#006c49]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Tipos de Residencia y Capacidad
                    </button>
                </div>

                {activeTab === 'people' && (
                    <ResourceCrudView<Person>
                        title="Padrón de Solicitantes y Dueños"
                        description="Registro de datos para evaluación de tenencia responsable."
                        endpoint="people"
                        columns={peopleColumns}
                        fields={peopleFields}
                        modalWidth="xl"
                        onTransformPayload={(payload) => {
                            const data = { ...payload };
                            if (data.income !== undefined && data.income !== null && data.income !== '') {
                                data.income = parseFloat(String(data.income));
                            }
                            if (data.cantidad_hijos !== undefined && data.cantidad_hijos !== null && data.cantidad_hijos !== '') {
                                data.cantidad_hijos = parseInt(String(data.cantidad_hijos), 10);
                            }
                            if (data.current_pets_count !== undefined && data.current_pets_count !== null && data.current_pets_count !== '') {
                                data.current_pets_count = parseInt(String(data.current_pets_count), 10);
                            }
                            if (data.occupation_id !== undefined && data.occupation_id !== null && data.occupation_id !== '') {
                                data.occupation_id = parseInt(String(data.occupation_id), 10);
                            }
                            if (data.residence_id !== undefined && data.residence_id !== null && data.residence_id !== '') {
                                data.residence_id = parseInt(String(data.residence_id), 10);
                            }
                            return data;
                        }}
                    />
                )}

                {activeTab === 'occupations' && (
                    <ResourceCrudView<Occupation>
                        title="Perfiles Ocupacionales"
                        description="Parámetros de horario y estabilidad laboral."
                        endpoint="occupations"
                        columns={occupationColumns}
                        fields={occupationFields}
                        readOnly={!canEditCatalogs}
                    />
                )}

                {activeTab === 'residences' && (
                    <ResourceCrudView<Residence>
                        title="Clasificación de Residencias"
                        description="Reglas de habitabilidad y límite de mascotas según tipo de vivienda."
                        endpoint="residences"
                        columns={residenceColumns}
                        fields={residenceFields}
                        readOnly={!canEditCatalogs}
                    />
                )}
            </div>
        </AppLayout>
    );
};

