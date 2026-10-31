import React, { useState, useEffect } from 'react';
import { useResource } from '../../hooks/useResource';
import { Table, Column } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Plus, Search, Trash2, Edit2, AlertCircle, Download, Building } from 'lucide-react';

export interface FieldOption {
    value: string | number;
    label: string;
}

export interface FieldConfig {
    name: string;
    label: string;
    type?: 'text' | 'password' | 'number' | 'email' | 'date' | 'select' | 'checkbox' | 'textarea';
    required?: boolean;
    options?: FieldOption[];
    // Opciones que dependen del formulario o del registro en edición
    getOptions?: (form: Record<string, any>, editing: any | null) => FieldOption[];
    // Campos que se vacían al cambiar este (p. ej. la raza al cambiar la especie)
    resets?: string[];
    placeholder?: string;
    min?: number;
    max?: number;
    step?: string;
}

export interface ResourceCrudViewProps<T extends { id: number }> {
    title: string;
    description?: string;
    endpoint: string;
    columns: Column<T>[];
    fields: FieldConfig[];
    modalWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    onTransformPayload?: (data: any) => any;
    filterShelter?: boolean;
    initialParams?: Record<string, any>;
    readOnly?: boolean;
}

export function ResourceCrudView<T extends { id: number }>({
    title,
    description,
    endpoint,
    columns,
    fields,
    modalWidth = 'lg',
    onTransformPayload,
    filterShelter = false,
    initialParams = {},
    readOnly = false,
}: ResourceCrudViewProps<T>) {
    const [activeShelterId, setActiveShelterId] = useState<number>(() => {
        if (!filterShelter) return 0;
        const saved = localStorage.getItem('shelter_active_id');
        return saved ? parseInt(saved, 10) : 0;
    });

    const initialCombinedParams = {
        ...initialParams,
        ...(filterShelter && activeShelterId > 0 ? { shelter_id: activeShelterId } : {}),
        direction: 'desc',
    };

    const {
        items,
        pagination,
        page,
        setPage,
        setParams,
        isLoading,
        error,
        createItem,
        updateItem,
        deleteItem,
        refetch,
    } = useResource<T>({ endpoint, initialParams: initialCombinedParams });

    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const handleOpenCreate = () => {
        setEditingItem(null);
        setFormData({});
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: T) => {
        setEditingItem(item);
        setFormData({ ...item });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleFieldChange = (name: string, value: any, resets: string[] = []) => {
        setFormData((prev) => ({
            ...prev,
            ...Object.fromEntries(resets.map((field) => [field, ''])),
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        try {
            const rawPayload = onTransformPayload ? onTransformPayload(formData) : formData;
            const payload: Record<string, any> = {};

            Object.entries(rawPayload).forEach(([key, val]) => {
                if (val === '') {
                    payload[key] = null;
                } else {
                    payload[key] = val;
                }
            });

            if (editingItem) {
                await updateItem(editingItem.id, payload as any);
            } else {
                await createItem(payload as any);
            }
            setIsModalOpen(false);
        } catch (err: any) {
            if (err?.errors) {
                setFormErrors(err.errors);
            } else {
                alert(err?.message || 'Error al guardar');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este registro permanentemente?')) return;
        try {
            await deleteItem(id);
        } catch (err: any) {
            alert(err?.message || 'Error al eliminar');
        }
    };

    // Escuchar cambios de sede activa global si filterShelter está activo
    useEffect(() => {
        if (!filterShelter) return;

        const handleBranchChange = (e: any) => {
            const newId = e.detail?.shelterId ?? 0;
            setActiveShelterId(newId);
            setPage(1);
            setParams((prev) => {
                const next: Record<string, any> = { ...prev };
                if (newId > 0) {
                    next.shelter_id = newId;
                } else {
                    delete next.shelter_id;
                }
                return next;
            });
        };

        window.addEventListener('shelter:branch-changed', handleBranchChange);
        return () => {
            window.removeEventListener('shelter:branch-changed', handleBranchChange);
        };
    }, [filterShelter, setParams, setPage]);

    const handleResetShelter = () => {
        setActiveShelterId(0);
        localStorage.setItem('shelter_active_id', '0');
        window.dispatchEvent(new CustomEvent('shelter:branch-changed', { detail: { shelterId: 0 } }));
        setPage(1);
        setParams((prev) => {
            const next: Record<string, any> = { ...prev };
            delete next.shelter_id;
            return next;
        });
    };

    const handleExportCsv = () => {
        if (!items || items.length === 0) {
            alert('No hay registros disponibles para exportar.');
            return;
        }

        const dataToExport = filteredItems.length > 0 ? filteredItems : items;
        const exportCols = columns.filter(
            (c) => c.header && !['Acciones', 'Acción', 'Actions', 'Action'].includes(String(c.header))
        );

        const headerLine = exportCols.map((c) => `"${String(c.header).replace(/"/g, '""')}"`).join(',');

        const rowLines = dataToExport.map((item) => {
            return exportCols.map((col) => {
                let val: any = '';
                if (col.accessorKey) {
                    val = (item as any)[col.accessorKey];
                } else {
                    const hk = String(col.header).toLowerCase();
                    if (hk.includes('mascota') || hk.includes('pet')) {
                        val = (item as any).pet?.name || (item as any).name;
                    } else if (hk.includes('refugio') || hk.includes('sede') || hk.includes('shelter')) {
                        val = (item as any).shelter?.name || (item as any).shelter_id;
                    } else if (hk.includes('estado') || hk.includes('status')) {
                        val = (item as any).status || (item as any).pet_status?.name || (item as any).adoption_status?.name;
                    } else if (hk.includes('persona') || hk.includes('solicitante') || hk.includes('applicant')) {
                        val = (item as any).person?.name || (item as any).applicant;
                    } else if (hk.includes('sexo') || hk.includes('sex')) {
                        val = (item as any).sex === 'M' ? 'Macho' : (item as any).sex === 'F' ? 'Hembra' : (item as any).sex;
                    } else if (hk.includes('edad') || hk.includes('age')) {
                        val = (item as any).estimated_age ? `${(item as any).estimated_age} años` : '';
                    } else if (hk.includes('monto') || hk.includes('amount')) {
                        val = (item as any).amount;
                    } else if (hk.includes('fecha') || hk.includes('date')) {
                        val = (item as any).requested_at || (item as any).registered_at || (item as any).appointment_date || (item as any).created_at;
                    } else {
                        val = (item as any)[col.header as string] ?? '';
                    }
                }

                if (val === null || val === undefined) val = '';
                if (typeof val === 'object') {
                    val = val.name || val.title || val.description || '';
                }
                const formatted = String(val).replace(/"/g, '""');
                return `"${formatted}"`;
            }).join(',');
        });

        const csvString = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const filteredItems = items.filter((item) => {
        if (!search) return true;
        return Object.values(item).some((val) =>
            String(val || '').toLowerCase().includes(search.toLowerCase())
        );
    });

    const fullColumns: Column<T>[] = readOnly ? columns : [
        ...columns,
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (item: T) => (
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        title="Editar"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header del recurso */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">{title}</h2>
                    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="secondary"
                        onClick={handleExportCsv}
                        className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer shadow-2xs py-2 sm:py-1.5"
                        title="Exportar registros a archivo CSV (Excel)"
                    >
                        <Download className="h-4 w-4 text-emerald-700" />
                        <span>Exportar CSV</span>
                    </Button>
                    {!readOnly && (
                        <Button onClick={handleOpenCreate} className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 py-2 sm:py-1.5">
                            <Plus className="h-4 w-4 mr-0.5" />
                            Nuevo Registro
                        </Button>
                    )}
                </div>
            </div>

            {/* Banner de Sede Activa Filtrada */}
            {filterShelter && activeShelterId > 0 && (
                <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs text-emerald-900 shadow-2xs">
                    <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-emerald-700 shrink-0" />
                        <span>
                            Filtrando registros por la sede activa seleccionada (Sede #{activeShelterId}).
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleResetShelter}
                        className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer text-xs shrink-0"
                    >
                        Ver todas las sedes
                    </button>
                </div>
            )}

            {/* Error banner si existe */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-xs text-red-800 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{error}</span>
                </div>
            )}

            {/* Barra de búsqueda */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar en la tabla..."
                        className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-4 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
                    />
                </div>
            </div>

            {/* Tabla con datos */}
            <Table
                columns={fullColumns}
                data={filteredItems}
                isLoading={isLoading}
                emptyMessage={`No hay registros en ${title}.`}
            />

            {/* Paginación */}
            <Pagination
                currentPage={pagination.current_page}
                lastPage={pagination.last_page}
                total={pagination.total}
                from={pagination.from}
                to={pagination.to}
                onPageChange={setPage}
            />

            {/* Modal de Crear / Editar */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? `Editar en ${title}` : `Crear en ${title}`}
                maxWidth={modalWidth}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map((f) => {
                            const err = formErrors[f.name]?.[0];
                            const val = formData[f.name] ?? '';
                            const options = f.getOptions ? f.getOptions(formData, editingItem) : f.options;

                            if (f.type === 'select') {
                                return (
                                    <div key={f.name} className="col-span-1">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            {f.label} {f.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <select
                                            value={val}
                                            required={f.required}
                                            onChange={(e) => handleFieldChange(f.name, e.target.value, f.resets)}
                                            className="w-full rounded border border-gray-300 p-2 text-xs focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                                        >
                                            <option value="">{f.placeholder || 'Seleccione...'}</option>
                                            {options?.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        {err && <p className="text-[11px] text-red-600 mt-1">{err}</p>}
                                    </div>
                                );
                            }

                            if (f.type === 'checkbox') {
                                return (
                                    <div key={f.name} className="col-span-1 flex items-center gap-2 pt-5">
                                        <input
                                            type="checkbox"
                                            id={f.name}
                                            checked={!!formData[f.name]}
                                            onChange={(e) => handleFieldChange(f.name, e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-[#006c49] focus:ring-[#006c49]"
                                        />
                                        <label htmlFor={f.name} className="text-xs font-semibold text-gray-700">
                                            {f.label}
                                        </label>
                                    </div>
                                );
                            }

                            if (f.type === 'textarea') {
                                return (
                                    <div key={f.name} className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            {f.label} {f.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={val}
                                            required={f.required}
                                            placeholder={f.placeholder}
                                            onChange={(e) => handleFieldChange(f.name, e.target.value)}
                                            className="w-full rounded border border-gray-300 p-2 text-xs focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                                        />
                                        {err && <p className="text-[11px] text-red-600 mt-1">{err}</p>}
                                    </div>
                                );
                            }

                            return (
                                <div key={f.name} className="col-span-1">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        {f.label} {f.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type={f.type || 'text'}
                                        value={val}
                                        required={f.required}
                                        min={f.min}
                                        max={f.max}
                                        step={f.step}
                                        placeholder={f.placeholder}
                                        onChange={(e) => handleFieldChange(f.name, e.target.value)}
                                        className="w-full rounded border border-gray-300 p-2 text-xs focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                                    />
                                    {err && <p className="text-[11px] text-red-600 mt-1">{err}</p>}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            {editingItem ? 'Guardar Cambios' : 'Crear Registro'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

