import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ResourceCrudView, FieldConfig, FieldOption } from '../../components/crud/ResourceCrudView';
import { Adoption } from '../../types/models';
import { Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { api } from '../../api/client';

export const AdoptionsAdminPage: React.FC = () => {
    const [petOptions, setPetOptions] = useState<FieldOption[]>([]);
    const [personOptions, setPersonOptions] = useState<FieldOption[]>([]);
    const [pendingStatusId, setPendingStatusId] = useState<number | undefined>();

    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [pRes, peRes, stRes] = await Promise.allSettled([
                    api.get('pets', { per_page: 100, available: 1 }),
                    api.get('people', { per_page: 100 }),
                    api.get('adoption-statuses'),
                ]);

                if (pRes.status === 'fulfilled' && pRes.value) {
                    const list = Array.isArray(pRes.value) ? pRes.value : pRes.value.data;
                    if (Array.isArray(list)) {
                        setPetOptions(list.map((p: any) => ({
                            value: p.id,
                            label: `${p.name} (${p.species?.name || 'Mascota'})`,
                        })));
                    }
                }

                if (peRes.status === 'fulfilled' && peRes.value) {
                    const list = Array.isArray(peRes.value) ? peRes.value : peRes.value.data;
                    if (Array.isArray(list)) {
                        setPersonOptions(list.map((pe: any) => ({
                            value: pe.id,
                            label: `${pe.name} (${pe.email || pe.document_number || 'ID ' + pe.id})`,
                        })));
                    }
                }

                if (stRes.status === 'fulfilled' && stRes.value) {
                    const list = Array.isArray(stRes.value) ? stRes.value : stRes.value.data;
                    if (Array.isArray(list)) {
                        setPendingStatusId(list.find((s: any) => s.name === 'Pendiente')?.id);
                    }
                }
            } catch (e) {
                // Los formularios quedan sin opciones y la tabla sigue disponible
            }
        };

        loadCatalogs();
    }, []);

    const columns: Column<Adoption>[] = [
        { header: 'ID', accessorKey: 'id', className: 'w-16 font-mono text-xs' },
        {
            header: 'Mascota Solicitada',
            cell: (adop) => (
                <span className="font-bold text-gray-900">
                    {adop.pet?.name || `Mascota #${adop.pet_id}`}
                </span>
            ),
        },
        {
            header: 'Solicitante',
            cell: (adop) => (
                <div>
                    <span className="font-semibold text-gray-800">
                        {adop.person?.name || `Persona #${adop.person_id}`}
                    </span>
                    <p className="text-xs text-gray-400">{adop.person?.email}</p>
                </div>
            ),
        },
        { header: 'Fecha de Solicitud', accessorKey: 'requested_at', className: 'text-xs text-gray-700' },
        {
            header: 'Estado',
            cell: (adop) => {
                const name = adop.adoption_status?.name?.toLowerCase() || '';
                let variant: 'success' | 'warning' | 'danger' | 'info' = 'info';
                if (name.includes('aprob') || name.includes('entreg')) variant = 'success';
                else if (name.includes('rechaz') || name.includes('cancel')) variant = 'danger';
                else if (name.includes('revis') || name.includes('evalua')) variant = 'warning';

                return (
                    <Badge variant={variant}>
                        {adop.adoption_status?.name || `Estado #${adop.adoption_status_id}`}
                    </Badge>
                );
            },
        },
        {
            header: 'Evaluación',
            cell: (adop) => (
                <Link
                    to={`/admin/adoptions/eval/${adop.id}`}
                    className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    <span>Evaluar Perfil</span>
                </Link>
            ),
        },
    ];

    // Solo mascotas elegibles, más la que ya tiene la adopción en edición.
    const petOptionsFor = (_form: Record<string, any>, editing: Adoption | null): FieldOption[] => {
        if (!editing || petOptions.some((option) => option.value === editing.pet_id)) return petOptions;

        return [{ value: editing.pet_id, label: editing.pet?.name || `Mascota #${editing.pet_id}` }, ...petOptions];
    };

    // El estado y sus fechas solo cambian desde la evaluación de cada solicitud.
    const fields: FieldConfig[] = [
        {
            name: 'pet_id',
            label: 'Mascota Solicitada',
            type: 'select',
            required: true,
            getOptions: petOptionsFor,
        },
        {
            name: 'person_id',
            label: 'Persona Solicitante',
            type: 'select',
            required: true,
            options: personOptions,
        },
        { name: 'requested_at', label: 'Fecha de Solicitud', type: 'date', required: true },
        { name: 'document', label: 'Identificador / Código de Documento', placeholder: 'DOC-2024-X' },
        { name: 'notes', label: 'Notas del proceso de adopción', type: 'textarea' },
    ];

    const handleTransformPayload = (data: any) => ({
        ...data,
        pet_id: data.pet_id ? parseInt(String(data.pet_id), 10) : undefined,
        person_id: data.person_id ? parseInt(String(data.person_id), 10) : undefined,
        adoption_status_id: data.adoption_status_id ?? pendingStatusId,
    });

    return (
        <AppLayout>
            <ResourceCrudView<Adoption>
                title="Gestión de Solicitudes y Adopciones"
                description="Revisión de solicitudes ciudadanas, dictámenes y acuerdos de entrega."
                endpoint="adoptions"
                columns={columns}
                fields={fields}
                modalWidth="xl"
                onTransformPayload={handleTransformPayload}
            />
        </AppLayout>
    );
};


