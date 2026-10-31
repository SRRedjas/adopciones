import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ResourceCrudView, FieldConfig } from '../../components/crud/ResourceCrudView';
import { Treatment, PetTreatment, Appointment, PetHistory } from '../../types/models';
import { Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

type MedicalTab = 'treatments' | 'applied' | 'appointments' | 'history';

const TABS: { id: MedicalTab; label: string; permission: string }[] = [
    { id: 'treatments', label: 'Catálogo de Tratamientos', permission: 'manage_treatments' },
    { id: 'applied', label: 'Tratamientos Aplicados', permission: 'manage_treatments' },
    { id: 'appointments', label: 'Agenda de Citas', permission: 'manage_appointments' },
    { id: 'history', label: 'Historial y Bitácora Médica', permission: 'manage_pets' },
];

export const MedicalAdminPage: React.FC = () => {
    const { hasPermission } = useAuth();
    const visibleTabs = TABS.filter((tab) => hasPermission(tab.permission));
    const [activeTab, setActiveTab] = useState<MedicalTab>(visibleTabs[0]?.id ?? 'history');

    const [petOptions, setPetOptions] = useState([
        { value: 1, label: 'Max (Perro)' },
        { value: 2, label: 'Luna (Gato)' },
        { value: 3, label: 'Toby (Perro)' },
        { value: 4, label: 'Rocky (Perro)' },
    ]);

    const [treatmentTypeOptions, setTreatmentTypeOptions] = useState([
        { value: 1, label: 'Vacunación' },
        { value: 2, label: 'Desparasitación' },
        { value: 3, label: 'Esterilización' },
        { value: 4, label: 'Cirugía' },
        { value: 5, label: 'Consulta general' },
        { value: 6, label: 'Tratamiento dental' },
    ]);

    const [treatmentOptions, setTreatmentOptions] = useState([
        { value: 1, label: 'Vacuna Antirrábica' },
        { value: 2, label: 'Vacuna Múltiple Canina' },
        { value: 3, label: 'Desparasitación Interna' },
        { value: 4, label: 'Esterilización / Castración' },
        { value: 5, label: 'Limpieza Dental' },
    ]);

    const [appointmentTypeOptions, setAppointmentTypeOptions] = useState([
        { value: 1, label: 'Consulta general' },
        { value: 2, label: 'Vacunación' },
        { value: 3, label: 'Cirugía' },
        { value: 4, label: 'Revisión post-adopción' },
        { value: 5, label: 'Emergencia' },
        { value: 6, label: 'Esterilización' },
    ]);

    const [personOptions, setPersonOptions] = useState([
        { value: 1, label: 'Carlos Ruiz (DPI: 1029384750101)' },
        { value: 2, label: 'María Fernanda Gómez (DPI: 2938475610101)' },
        { value: 3, label: 'Jorge Mendoza (DPI: 3847561020101)' },
    ]);

    const [petStatusOptions, setPetStatusOptions] = useState([
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
                const [pRes, ttRes, tRes, atRes, perRes, psRes] = await Promise.allSettled([
                    api.get('pets', { per_page: 50 }),
                    api.get('treatment-types'),
                    api.get('treatments', { per_page: 50 }),
                    api.get('appointment-types'),
                    api.get('people', { per_page: 50 }),
                    api.get('pet-statuses'),
                ]);

                if (pRes.status === 'fulfilled' && pRes.value) {
                    const list = Array.isArray(pRes.value) ? pRes.value : pRes.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setPetOptions(list.map((p: any) => ({
                            value: p.id,
                            label: `${p.name} (${p.species?.name || 'Mascota'})`,
                        })));
                    }
                }

                if (ttRes.status === 'fulfilled' && ttRes.value) {
                    const list = Array.isArray(ttRes.value) ? ttRes.value : ttRes.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setTreatmentTypeOptions(list.map((tt: any) => ({
                            value: tt.id,
                            label: tt.name,
                        })));
                    }
                }

                if (tRes.status === 'fulfilled' && tRes.value) {
                    const list = Array.isArray(tRes.value) ? tRes.value : tRes.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setTreatmentOptions(list.map((t: any) => ({
                            value: t.id,
                            label: `${t.name} (Q ${Number(t.cost || 0).toFixed(2)})`,
                        })));
                    }
                }

                if (atRes.status === 'fulfilled' && atRes.value) {
                    const list = Array.isArray(atRes.value) ? atRes.value : atRes.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setAppointmentTypeOptions(list.map((at: any) => ({
                            value: at.id,
                            label: at.name,
                        })));
                    }
                }

                if (perRes.status === 'fulfilled' && perRes.value) {
                    const list = Array.isArray(perRes.value) ? perRes.value : perRes.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setPersonOptions(list.map((pe: any) => ({
                            value: pe.id,
                            label: `${pe.name} (${pe.document_number || 'Sin Doc'})`,
                        })));
                    }
                }

                if (psRes.status === 'fulfilled' && psRes.value) {
                    const list = Array.isArray(psRes.value) ? psRes.value : psRes.value.data;
                    if (Array.isArray(list) && list.length > 0) {
                        setPetStatusOptions(list.map((ps: any) => ({
                            value: ps.id,
                            label: ps.name,
                        })));
                    }
                }
            } catch (e) {
                // Mantener fallbacks
            }
        };

        loadCatalogs();
    }, []);

    // 1. Columnas y campos para Catálogo de Tratamientos
    const treatmentColumns: Column<Treatment>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        { header: 'Nombre del Procedimiento', accessorKey: 'name', className: 'font-bold' },
        {
            header: 'Requiere Veterinario',
            cell: (t) => (
                <Badge variant={t.requires_veterinarian ? 'danger' : 'neutral'}>
                    {t.requires_veterinarian ? 'Sí (Médico Veterinario)' : 'No (Asistente)'}
                </Badge>
            ),
        },
        {
            header: 'Costo Estimado',
            cell: (t) => <span className="font-mono text-xs font-semibold">Q {Number(t.cost).toFixed(2)}</span>,
        },
        {
            header: 'Tipo',
            cell: (t) => <span className="text-xs text-gray-600">{t.treatment_type?.name || `Tipo #${t.treatment_type_id}`}</span>,
        },
    ];

    const treatmentFields: FieldConfig[] = [
        { name: 'name', label: 'Nombre del Tratamiento', required: true, placeholder: 'Ej: Vacuna Séxtuple, Desparasitación...' },
        {
            name: 'treatment_type_id',
            label: 'Tipo de Tratamiento',
            type: 'select',
            required: true,
            options: treatmentTypeOptions,
        },
        { name: 'cost', label: 'Costo en Quetzales (Q)', type: 'number', step: '0.01', required: true, placeholder: '0.00' },
        { name: 'requires_veterinarian', label: 'Requiere Veterinario Certificado', type: 'checkbox' },
    ];

    // 2. Columnas y campos para Tratamientos Aplicados a Mascotas
    const appliedColumns: Column<PetTreatment>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        {
            header: 'Mascota',
            cell: (pt) => <span className="font-bold text-gray-900">{pt.pet?.name || `Mascota #${pt.pet_id}`}</span>,
        },
        {
            header: 'Tratamiento',
            cell: (pt) => <span className="font-semibold text-emerald-800">{pt.treatment?.name || `Tratamiento #${pt.treatment_id}`}</span>,
        },
        { header: 'Fecha de Aplicación', accessorKey: 'treated_at', className: 'text-xs text-gray-700' },
        { header: 'Instrucciones / Dosis', accessorKey: 'instructions', className: 'text-xs text-gray-600' },
    ];

    const appliedFields: FieldConfig[] = [
        {
            name: 'pet_id',
            label: 'Mascota Atendida',
            type: 'select',
            required: true,
            options: petOptions,
        },
        {
            name: 'treatment_id',
            label: 'Tratamiento Administrado',
            type: 'select',
            required: true,
            options: treatmentOptions,
        },
        { name: 'treated_at', label: 'Fecha de Tratamiento', type: 'date', required: true },
        { name: 'instructions', label: 'Instrucciones Médicas y Dosis', type: 'textarea', required: true, placeholder: 'Dosis suministrada, vía de administración, observaciones...' },
    ];

    // 3. Columnas y campos para Citas
    const appointmentColumns: Column<Appointment>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        {
            header: 'Mascota',
            cell: (a) => <span className="font-bold text-gray-900">{a.pet?.name || `Mascota #${a.pet_id}`}</span>,
        },
        { header: 'Fecha / Hora', accessorKey: 'appointment_date', className: 'text-xs text-gray-700 font-mono' },
        {
            header: 'Tipo de Cita',
            cell: (a) => <span className="text-xs text-gray-700">{a.appointment_type?.name || `Tipo #${a.appointment_type_id}`}</span>,
        },
        {
            header: 'Encargado / Adoptante',
            cell: (a) => <span className="text-xs text-gray-700">{a.person?.name || `Persona #${a.person_id}`}</span>,
        },
        {
            header: 'Estado',
            cell: (a) => {
                const variants: Record<string, 'warning' | 'success' | 'danger'> = {
                    pending: 'warning',
                    completed: 'success',
                    missed: 'danger',
                };
                return <Badge variant={variants[a.status || 'pending'] || 'neutral'}>{a.status || 'pending'}</Badge>;
            },
        },
    ];

    const appointmentFields: FieldConfig[] = [
        {
            name: 'pet_id',
            label: 'Mascota',
            type: 'select',
            required: true,
            options: petOptions,
        },
        {
            name: 'appointment_type_id',
            label: 'Tipo de Cita',
            type: 'select',
            required: true,
            options: appointmentTypeOptions,
        },
        {
            name: 'person_id',
            label: 'Persona / Solicitante',
            type: 'select',
            required: true,
            options: personOptions,
        },
        { name: 'appointment_date', label: 'Fecha de la Cita', type: 'date', required: true },
        {
            name: 'status',
            label: 'Estado de la Cita',
            type: 'select',
            options: [
                { value: 'pending', label: 'Pendiente' },
                { value: 'completed', label: 'Completada' },
                { value: 'missed', label: 'Perdida / Cancelada' },
            ],
        },
        { name: 'notes', label: 'Notas de la cita', type: 'textarea' },
    ];

    // 4. Columnas y campos para Historial / Bitácora Clínica (PetHistory)
    const historyColumns: Column<PetHistory>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        {
            header: 'Mascota',
            cell: (h) => (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{h.pet?.name || `Mascota #${h.pet_id}`}</span>
                    <span className="text-xs text-gray-400">({h.pet?.species?.name || 'Mascota'})</span>
                </div>
            ),
        },
        {
            header: 'Estado Clínico',
            cell: (h) => {
                const name = h.pet_status?.name || `Estado #${h.pet_status_id}`;
                const lower = name.toLowerCase();
                let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
                if (lower.includes('disp') || lower.includes('recup')) variant = 'success';
                else if (lower.includes('tratam') || lower.includes('obs')) variant = 'warning';
                else if (lower.includes('cuaren') || lower.includes('grav') || lower.includes('fall')) variant = 'danger';
                return <Badge variant={variant}>{name}</Badge>;
            },
        },
        {
            header: 'Fecha Registro',
            accessorKey: 'recorded_at',
            className: 'text-xs text-gray-700 font-mono',
        },
        {
            header: 'Responsable',
            cell: (h) => (
                <span className="text-xs text-gray-600 font-medium">
                    {h.user?.name || `Usuario #${h.user_id || '—'}`}
                </span>
            ),
        },
        {
            header: 'Evolución y Diagnóstico',
            accessorKey: 'notes',
            className: 'text-xs text-gray-700 max-w-sm truncate',
        },
    ];

    const handleTreatmentTransform = (data: any) => ({
        ...data,
        treatment_type_id: data.treatment_type_id ? parseInt(String(data.treatment_type_id), 10) : undefined,
        cost: data.cost !== '' && data.cost !== null ? parseFloat(String(data.cost)) : 0,
        requires_veterinarian: !!data.requires_veterinarian,
    });

    const handleAppliedTransform = (data: any) => ({
        ...data,
        pet_id: data.pet_id ? parseInt(String(data.pet_id), 10) : undefined,
        treatment_id: data.treatment_id ? parseInt(String(data.treatment_id), 10) : undefined,
    });

    const handleAppointmentTransform = (data: any) => ({
        ...data,
        pet_id: data.pet_id ? parseInt(String(data.pet_id), 10) : undefined,
        appointment_type_id: data.appointment_type_id ? parseInt(String(data.appointment_type_id), 10) : undefined,
        person_id: data.person_id ? parseInt(String(data.person_id), 10) : undefined,
    });

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-gray-900">
                        Área Médica y Veterinaria
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Control de tratamientos clínicos, historial de salud, bitácora médica y agenda de citas.
                    </p>
                </div>

                {/* Tabs de Selección */}
                <div className="flex border-b border-gray-200 overflow-x-auto touch-pan-x">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2.5 sm:py-3 px-3.5 sm:px-5 text-xs font-bold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                                activeTab === tab.id
                                    ? 'border-[#006c49] text-[#006c49]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'treatments' && (
                    <ResourceCrudView<Treatment>
                        title="Tratamientos Médicos Disponibles"
                        description="Definición de procedimientos, vacunas y costos correspondientes."
                        endpoint="treatments"
                        columns={treatmentColumns}
                        fields={treatmentFields}
                        onTransformPayload={handleTreatmentTransform}
                    />
                )}

                {activeTab === 'applied' && (
                    <ResourceCrudView<PetTreatment>
                        title="Tratamientos Suministrados a Mascotas"
                        description="Registro de vacunas y procedimientos administrados a animales albergados."
                        endpoint="pet-treatments"
                        columns={appliedColumns}
                        fields={appliedFields}
                        onTransformPayload={handleAppliedTransform}
                        filterShelter={true}
                    />
                )}

                {activeTab === 'appointments' && (
                    <ResourceCrudView<Appointment>
                        title="Citas Médicas y Revisiones"
                        description="Control de calendario para chequeos clínicos y valoraciones."
                        endpoint="appointments"
                        columns={appointmentColumns}
                        fields={appointmentFields}
                        onTransformPayload={handleAppointmentTransform}
                        filterShelter={true}
                    />
                )}

                {activeTab === 'history' && (
                    <ResourceCrudView<PetHistory>
                        title="Bitácora de Historial Clínico de Mascotas"
                        description="Registro cronológico de los cambios de estado de cada mascota, generado por el sistema."
                        endpoint="pet-histories"
                        columns={historyColumns}
                        fields={[]}
                        filterShelter={true}
                        readOnly
                    />
                )}
            </div>
        </AppLayout>
    );
};
