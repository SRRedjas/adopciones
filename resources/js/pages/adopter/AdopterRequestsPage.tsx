import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Inbox, UserCog } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { api } from '../../api/client';
import { Adoption } from '../../types/models';

const statusVariant = (name = ''): 'success' | 'warning' | 'danger' | 'info' => {
    if (name === 'Aprobada' || name === 'Entregada') return 'success';
    if (name === 'Rechazada' || name === 'Cancelada') return 'danger';
    if (name === 'En revisión') return 'warning';
    return 'info';
};

export const AdopterRequestsPage: React.FC = () => {
    const [adoptions, setAdoptions] = useState<Adoption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<Adoption[]>('my/adoptions')
            .then(setAdoptions)
            .catch((err) => setError(err?.message || 'No se pudieron cargar tus solicitudes.'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleCancel = async (id: number) => {
        if (!confirm('¿Deseas cancelar esta solicitud?')) return;

        setCancellingId(id);
        setError(null);
        try {
            const updated = await api.post<Adoption>(`my/adoptions/${id}/cancel`);
            setAdoptions((prev) => prev.map((adoption) => (adoption.id === id ? updated : adoption)));
        } catch (err: any) {
            setError(err?.message || 'No se pudo cancelar la solicitud.');
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <PublicLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Mis Solicitudes</h1>
                        <p className="text-sm text-gray-600">Sigue el estado de cada solicitud de adopción que has enviado.</p>
                    </div>
                    <Link
                        to="/mi-perfil"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50"
                    >
                        <UserCog className="h-4 w-4" />
                        <span>Mis Datos de Adoptante</span>
                    </Link>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">{error}</div>
                )}

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Spinner size="lg" />
                    </div>
                ) : adoptions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-3">
                        <Inbox className="mx-auto h-8 w-8 text-gray-400" />
                        <h2 className="text-base font-bold text-gray-800">Aún no tienes solicitudes</h2>
                        <Link to="/catalog">
                            <Button variant="outline" size="sm">
                                Ver Mascotas Disponibles
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {adoptions.map((adoption) => (
                            <article
                                key={adoption.id}
                                className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-base font-bold text-gray-900">
                                            {adoption.pet?.name || `Mascota #${adoption.pet_id}`}
                                        </h2>
                                        <Badge variant={statusVariant(adoption.adoption_status?.name)}>
                                            {adoption.adoption_status?.name || 'Pendiente'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {adoption.pet?.species?.name} • {adoption.pet?.breed?.name} • Solicitud #{adoption.id}
                                    </p>
                                    <p className="inline-flex items-center gap-1 text-xs text-gray-500 mt-2">
                                        <Calendar className="h-3 w-3 text-gray-400" />
                                        Solicitada el {adoption.requested_at}
                                    </p>
                                </div>

                                {adoption.adoption_status?.name === 'Pendiente' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        isLoading={cancellingId === adoption.id}
                                        onClick={() => handleCancel(adoption.id)}
                                    >
                                        Cancelar Solicitud
                                    </Button>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
};
