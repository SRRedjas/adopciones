import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import {
    ArrowLeft,
    Printer,
    CheckCircle2,
    XCircle,
    Heart,
    ShieldCheck,
    Stethoscope,
    Inbox,
    FileCheck2,
    Calendar,
    Sparkles,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Skeleton, SkeletonText } from '../../components/ui/Skeleton';
import { api } from '../../api/client';
import { LegalContractModal } from '../../components/contracts/LegalContractModal';
import { Adoption, AdoptionStep, AppointmentType, Contract } from '../../types/models';

export const ApplicationReviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [adoption, setAdoption] = useState<Adoption | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [evaluationType, setEvaluationType] = useState('Socioeconómica');
    const [score, setScore] = useState('85');
    const [notes, setNotes] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [submittingStatus, setSubmittingStatus] = useState<string | null>(null);
    const [decisionError, setDecisionError] = useState<string | null>(null);
    const [deliveryTypeId, setDeliveryTypeId] = useState<number | undefined>();

    // Contrato vinculado y estado
    const [existingContract, setExistingContract] = useState<Contract | null>(null);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);

    // Cita de Entrega
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentNotes, setAppointmentNotes] = useState('Cita de entrega oficial y entrega de mascota.');
    const [isSchedulingAppointment, setIsSchedulingAppointment] = useState(false);
    const [appointmentScheduled, setAppointmentScheduled] = useState(false);

    const loadData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const [adopRes, contractsRes, typesRes] = await Promise.allSettled([
                api.get<Adoption>(`adoptions/${id}`),
                api.get('contracts', { per_page: 100 }),
                api.get('appointment-types', { per_page: 100 }),
            ]);

            if (typesRes.status === 'fulfilled') {
                const types: AppointmentType[] = typesRes.value?.data ?? [];
                setDeliveryTypeId(types.find((type) => type.name === 'Revisión post-adopción')?.id);
            }

            if (adopRes.status === 'fulfilled' && adopRes.value) {
                const data = adopRes.value;
                setAdoption(data);
                setNotes(data.notes || '');
            }

            if (contractsRes.status === 'fulfilled' && contractsRes.value) {
                const raw = contractsRes.value as any;
                const list = Array.isArray(raw) ? raw : raw.data;
                if (Array.isArray(list)) {
                    const found = list.find((c: any) => c.adoption_id === parseInt(id, 10));
                    if (found) {
                        setExistingContract(found);
                    }
                }
            }
        } catch {
            setAdoption(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    // El backend valida cada paso del flujo y sincroniza el estado de la mascota.
    const handleTransition = async (step: AdoptionStep) => {
        if (!id) return;

        setSubmittingStatus(step.status);
        setDecisionError(null);
        setIsSaved(false);
        try {
            const updated = await api.post<Adoption>(`adoptions/${id}/transition`, {
                status: step.status,
                notes: `${notes} [Dictamen: ${step.status} - Puntaje: ${score}/100 - Tipo: ${evaluationType}]`.trim(),
            });
            setAdoption(updated);
            setNotes(updated.notes || '');
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 4000);
        } catch (err: any) {
            setDecisionError(err?.message || 'No se pudo aplicar la decisión.');
        } finally {
            setSubmittingStatus(null);
        }
    };

    const handleGenerateContract = async () => {
        if (!adoption) return;
        setIsGeneratingContract(true);
        try {
            const petName = adoption.pet?.name || 'Mascota';
            const newContract = await api.post('contracts', {
                adoption_id: adoption.id,
                name: `Contrato de Adopción Responsable #${adoption.id} - ${petName}`,
                document_path: `contracts/2026/contrato_adopcion_${adoption.id}.pdf`,
            });
            setExistingContract(newContract);
            setIsContractModalOpen(true);
        } catch (e: any) {
            alert(e?.message || 'Error al emitir el contrato');
        } finally {
            setIsGeneratingContract(false);
        }
    };

    const handleScheduleAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adoption || !appointmentDate) return;
        setIsSchedulingAppointment(true);
        try {
            await api.post('appointments', {
                pet_id: adoption.pet_id,
                person_id: adoption.person_id,
                appointment_type_id: deliveryTypeId,
                appointment_date: appointmentDate,
                notes: appointmentNotes,
                status: 'pending',
            });
            setAppointmentScheduled(true);
            setTimeout(() => {
                setIsAppointmentModalOpen(false);
                setAppointmentScheduled(false);
            }, 1800);
        } catch (err: any) {
            alert(err?.message || 'Error al programar la cita');
        } finally {
            setIsSchedulingAppointment(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-44" />
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-60" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                            <Skeleton className="h-8 w-32 rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-7 rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-4" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>

                        <div className="lg:col-span-5 space-y-6">
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!adoption) {
        return (
            <AppLayout>
                <div className="max-w-xl mx-auto my-12 text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <Inbox className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Solicitud no encontrada</h2>
                    <p className="text-xs text-gray-500">
                        No se encontró ningún expediente correspondiente al código de solicitud #{id}.
                    </p>
                    <Link
                        to="/admin/adoptions"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#006c49] px-4 py-2 text-xs font-semibold text-white hover:bg-[#005238] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Volver al Listado de Adopciones</span>
                    </Link>
                </div>
            </AppLayout>
        );
    }

    const applicantName = adoption?.person?.name || `Persona #${adoption?.person_id}`;
    const petName = adoption?.pet?.name || `Mascota #${adoption?.pet_id}`;
    const statusName = adoption?.adoption_status?.name || 'En Revisión';
    const nextSteps = adoption?.next_statuses ?? [];
    const isApproved = statusName.toLowerCase().includes('aprob') || statusName.toLowerCase().includes('entreg');
    const solCode = `#SOL-${adoption?.id || id}`;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Cabecera */}
                <div>
                    <Link
                        to="/admin/adoptions"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-2 transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Volver a Solicitudes de Adopción</span>
                    </Link>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-black tracking-tight text-gray-900">
                                Evaluando Solicitud: {solCode}
                            </h2>
                            <Badge variant={isApproved ? 'success' : 'info'} size="md">
                                {statusName}
                            </Badge>
                            <span className="text-sm font-medium text-gray-600">
                                Solicitante: <strong className="text-gray-900 font-bold">{applicantName}</strong> • Mascota: <strong className="text-gray-900 font-bold">{petName}</strong>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {existingContract ? (
                                <Button
                                    type="button"
                                    onClick={() => setIsContractModalOpen(true)}
                                    className="bg-[#006c49] hover:bg-[#005238] flex items-center gap-2 text-xs font-bold"
                                >
                                    <FileCheck2 className="h-4 w-4" />
                                    <span>Ver / Imprimir Contrato</span>
                                </Button>
                            ) : isApproved && (
                                <Button
                                    type="button"
                                    onClick={handleGenerateContract}
                                    isLoading={isGeneratingContract}
                                    className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 text-xs font-bold"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    <span>Emitir Contrato Oficial</span>
                                </Button>
                            )}

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-md shadow-2xs cursor-pointer"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Imprimir Ficha</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid Split-Screen */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Panel Izquierdo: Perfil del Solicitante */}
                    <div className="lg:col-span-7 rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-2.5 text-gray-900 font-bold text-lg">
                                <ShieldCheck className="h-5 w-5 text-[#006c49]" />
                                <span>Perfil del Solicitante</span>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">DPI: {adoption?.person?.document_number || 'N/A'}</span>
                        </div>

                        {/* CONDICIONES DE VIVIENDA */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                CONDICIONES DE VIVIENDA
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500">Tipo de Inmueble</p>
                                    <p className="font-semibold text-gray-900">
                                        {adoption?.person?.residence?.name || 'Casa propia'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Estado Civil</p>
                                    <p className="font-semibold text-gray-900">
                                        {adoption?.person?.estado_civil || 'No especificado'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Límite Permitido de Mascotas</p>
                                    <p className="font-semibold text-emerald-800">
                                        {adoption?.person?.residence?.animal_limit ? `Hasta ${adoption.person.residence.animal_limit} animales` : 'Apto'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Identificación Oficial</p>
                                    <p className="font-semibold text-gray-900">
                                        {adoption?.person?.document_type || 'DPI'}: {adoption?.person?.document_number || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* COMPOSICIÓN FAMILIAR */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                COMPOSICIÓN FAMILIAR
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500">Cantidad de Hijos</p>
                                    <p className="font-semibold text-gray-900">
                                        {adoption?.person?.cantidad_hijos ?? 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Mascotas Actuales</p>
                                    <p className="font-semibold text-gray-900">
                                        {adoption?.person?.current_pets_count ?? 0}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Correo de Contacto</p>
                                <span className="inline-block rounded bg-[#eff4ff] px-2.5 py-1 text-xs font-semibold text-gray-800 border border-blue-100">
                                    {adoption?.person?.email || 'Sin correo registrado'}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* ESTUDIO SOCIOECONÓMICO */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                ESTUDIO SOCIOECONÓMICO
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500">Ocupación / Profesión</p>
                                    <p className="font-semibold text-gray-900">
                                        {adoption?.person?.occupation?.name || 'Empleado'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Ingresos Mensuales Estimados</p>
                                    <p className="font-semibold text-emerald-800 font-mono">
                                        Q {adoption?.person?.income ? Number(adoption.person.income).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '0.00'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Compromiso Financiero (Atención Veterinaria y Nutrición)</p>
                                    <p className="font-semibold text-emerald-700 flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Declaración de responsabilidad firmada
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Panel Derecho: Mascota, Resolución y Automatización */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Pet Summary Card */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                            <div className="relative aspect-16/9 bg-gray-100">
                                <img
                                    src={adoption?.pet?.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600"}
                                    alt={petName}
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                    <h3 className="text-2xl font-black text-white">{petName}</h3>
                                </div>
                            </div>

                            <div className="p-5 space-y-4 text-xs">
                                <div className="flex flex-wrap gap-1.5">
                                    <span className="rounded bg-[#dbeafe] px-2 py-0.5 font-bold uppercase text-[#1e40af]">
                                        {adoption?.pet?.species?.name || 'ANIMAL'}
                                    </span>
                                    <span className="rounded bg-[#eff4ff] px-2 py-0.5 font-bold uppercase text-gray-700">
                                        {adoption?.pet?.estimated_age ? `${adoption.pet.estimated_age} AÑOS` : 'JOVEN'}
                                    </span>
                                    <span className="rounded bg-[#eff4ff] px-2 py-0.5 font-bold uppercase text-gray-700">
                                        {adoption?.pet?.weight_kg ? `${adoption.pet.weight_kg} KG` : 'MEDIANO'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <p className="font-bold text-gray-500 uppercase flex items-center gap-1">
                                        <Stethoscope className="h-3 w-3" /> ESTADO CLÍNICO
                                    </p>
                                    <p className="text-gray-800 leading-relaxed">
                                        Estado de resguardo: <strong className="capitalize">{adoption?.pet?.pet_status?.name || 'Evaluación'}</strong>.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="font-bold text-gray-500 uppercase flex items-center gap-1">
                                        <Heart className="h-3 w-3" /> MOTIVACIÓN DEL SOLICITANTE
                                    </p>
                                    <p className="text-gray-800 leading-relaxed">
                                        {adoption.notes || 'Solicitud tramitada a través del portal de adopciones.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ACCIONES DE CONTRATO Y ENTREGA POST-APROBACIÓN */}
                        {isApproved && (
                            <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-5 space-y-3 shadow-xs">
                                <div className="flex items-center gap-2 text-sm font-bold text-emerald-950">
                                    <FileCheck2 className="h-5 w-5 text-emerald-700" />
                                    <span>Trámites de Entrega y Contrato</span>
                                </div>
                                <p className="text-xs text-emerald-900 leading-relaxed">
                                    Esta solicitud ha sido aprobada. Puedes formalizar el contrato legal y agendar la fecha para entrega de la mascota.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                    {existingContract ? (
                                        <Button
                                            type="button"
                                            onClick={() => setIsContractModalOpen(true)}
                                            className="flex-1 bg-[#006c49] hover:bg-[#005238] text-xs font-bold flex items-center justify-center gap-1.5"
                                        >
                                            <Printer className="h-3.5 w-3.5" />
                                            <span>Ver / Imprimir Contrato</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={handleGenerateContract}
                                            isLoading={isGeneratingContract}
                                            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5"
                                        >
                                            <Sparkles className="h-3.5 w-3.5" />
                                            <span>Generar Contrato Legal</span>
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAppointmentModalOpen(true)}
                                        className="flex-1 border-emerald-300 text-emerald-900 hover:bg-emerald-100/60 text-xs font-bold flex items-center justify-center gap-1.5"
                                    >
                                        <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                                        <span>Agendar Entrega</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Formulario de Decisión */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 text-base font-bold text-gray-900">
                                <ShieldCheck className="h-5 w-5 text-[#10b981]" />
                                <span>Resolución del Comité Evaluador</span>
                            </div>

                            {isSaved && (
                                <div className="rounded bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200">
                                    ✓ Decisión de evaluación guardada satisfactoriamente.
                                </div>
                            )}

                            {decisionError && (
                                <div className="rounded bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                                    {decisionError}
                                </div>
                            )}

                            {nextSteps.length === 0 ? (
                                <p className="text-xs text-gray-600">
                                    Esta solicitud está cerrada ({statusName}): ya no admite más cambios de estado.
                                </p>
                            ) : (
                            <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Tipo de Evaluación
                                    </label>
                                    <select
                                        value={evaluationType}
                                        onChange={(e) => setEvaluationType(e.target.value)}
                                        className="w-full rounded border border-gray-300 p-2 text-xs focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                                    >
                                        <option value="Socioeconómica">Socioeconómica</option>
                                        <option value="Aptitud Veterinaria">Aptitud Veterinaria</option>
                                        <option value="Visita Domiciliar">Visita Domiciliar</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Puntaje Obtenido (1-100)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={score}
                                        onChange={(e) => setScore(e.target.value)}
                                        className="w-full rounded border border-gray-300 p-2 text-xs focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Dictamen y Notas Oficiales
                                </label>
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full rounded border border-gray-300 p-2 text-xs focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-700">Resolución</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {nextSteps.map((step) => {
                                        const isReject = step.status === 'Rechazada';

                                        return (
                                            <Button
                                                key={step.status}
                                                type="button"
                                                variant={isReject ? 'outline' : 'primary'}
                                                disabled={step.blocker !== null || submittingStatus !== null}
                                                isLoading={submittingStatus === step.status}
                                                title={step.blocker ?? undefined}
                                                onClick={() => handleTransition(step)}
                                                className="flex items-center justify-center gap-2 text-xs font-bold"
                                            >
                                                {isReject ? <XCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4" />}
                                                <span>{step.label}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                                {nextSteps.filter((step) => step.blocker).map((step) => (
                                    <p key={step.status} className="text-[11px] text-amber-700">
                                        {step.label}: {step.blocker}
                                    </p>
                                ))}
                            </div>
                            </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Contrato Legal Oficial */}
            <LegalContractModal
                isOpen={isContractModalOpen}
                onClose={() => setIsContractModalOpen(false)}
                contract={existingContract}
                adoption={adoption}
            />

            {/* Modal para Agendar Cita de Entrega */}
            <Modal
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
                title={`Agendar Cita de Entrega: ${petName}`}
                description="Coordina el día y hora para la entrega formal del animal y la firma física del contrato."
            >
                {appointmentScheduled ? (
                    <div className="py-6 text-center space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">¡Cita Agendada Exitosamente!</h4>
                        <p className="text-xs text-gray-600">
                            La cita ha quedado programada en la agenda veterinaria y de recepción.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleScheduleAppointment} className="space-y-4">
                        <Input
                            label="Fecha y Hora de la Cita de Entrega"
                            type="datetime-local"
                            required
                            value={appointmentDate}
                            onChange={(e) => setAppointmentDate(e.target.value)}
                        />

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Indicaciones para la Recepción o Visita
                            </label>
                            <textarea
                                rows={3}
                                value={appointmentNotes}
                                onChange={(e) => setAppointmentNotes(e.target.value)}
                                className="w-full rounded border border-gray-300 p-2 text-xs focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                            <Button type="button" variant="outline" onClick={() => setIsAppointmentModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" isLoading={isSchedulingAppointment} className="bg-[#006c49] hover:bg-[#005238]">
                                Confirmar y Agendar
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </AppLayout>
    );
};
