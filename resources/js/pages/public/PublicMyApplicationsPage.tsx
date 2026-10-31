import React, { useState } from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Search, FileText, CheckCircle, Clock, XCircle, AlertCircle, Calendar, Heart } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

interface ApplicationResult {
    id: number;
    pet?: {
        name: string;
        photo_url?: string;
        species?: { name: string };
        breed?: { name: string };
    };
    adoption_status?: {
        name: string;
    };
    requested_at: string;
    approved_at?: string;
    notes?: string;
}

export const PublicMyApplicationsPage: React.FC = () => {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [documentNumber, setDocumentNumber] = useState('');
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [results, setResults] = useState<ApplicationResult[]>([]);

    const lookupEmail = user ? user.email : email.trim();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lookupEmail || !documentNumber.trim()) return;

        setIsLoading(true);
        setHasSearched(true);
        setSearchError(null);

        try {
            const data = await api.get<ApplicationResult[]>('public/my-applications', {
                email: lookupEmail,
                document_number: documentNumber.trim(),
            });
            setResults(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setResults([]);
            setSearchError(err?.message || 'No se pudo consultar la solicitud. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (statusName?: string) => {
        const lower = (statusName || '').toLowerCase();
        if (lower.includes('entreg')) {
            return <Badge variant="success">Entregada</Badge>;
        }
        if (lower.includes('aprob') || lower.includes('finaliz')) {
            return <Badge variant="success">Aprobada</Badge>;
        }
        if (lower.includes('rechaz') || lower.includes('cancel')) {
            return <Badge variant="danger">Rechazada</Badge>;
        }
        if (lower.includes('evalua') || lower.includes('revis')) {
            return <Badge variant="warning">En Evaluación</Badge>;
        }
        return <Badge variant="info">Pendiente de Revisión</Badge>;
    };

    return (
        <PublicLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Seguimiento Ciudadano</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Consulta el Estado de tu Solicitud
                    </h1>
                    <p className="text-sm text-gray-600 max-w-xl mx-auto">
                        Ingresa el correo electrónico y el número de DPI / documento con los que registraste tu solicitud para ver en qué etapa se encuentra.
                    </p>
                </div>

                {/* Buscador */}
                <form onSubmit={handleSearch} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row gap-3">
                    {!user && (
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Correo (ej. adoptante@correo.com)"
                            className="w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
                        />
                    </div>
                    )}
                    <input
                        type="text"
                        required
                        maxLength={25}
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        placeholder="DPI / Documento"
                        className="flex-1 rounded-md border border-gray-300 py-2.5 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
                    />
                    <Button type="submit" isLoading={isLoading} className="bg-[#006c49] hover:bg-[#005238]">
                        Buscar Solicitud
                    </Button>
                </form>

                {/* Resultados / Skeletons */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-xl bg-gray-200 animate-pulse shrink-0" />
                                    <div className="space-y-2">
                                        <div className="h-5 w-48 bg-gray-200 animate-pulse rounded" />
                                        <div className="h-3.5 w-36 bg-gray-200 animate-pulse rounded" />
                                        <div className="h-3 w-28 bg-gray-200 animate-pulse rounded" />
                                    </div>
                                </div>
                                <div className="sm:text-right space-y-2">
                                    <div className="h-3.5 w-24 bg-gray-200 animate-pulse rounded sm:ml-auto" />
                                    <div className="h-5 w-36 bg-gray-200 animate-pulse rounded sm:ml-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hasSearched && (
                    <div className="space-y-4">
                        {results.length > 0 ? (
                            results.map((app) => (
                                <div
                                    key={app.id}
                                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                            <img
                                                src={
                                                    app.pet?.photo_url ||
                                                    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'
                                                }
                                                alt={app.pet?.name || 'Mascota'}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-gray-900">
                                                    Mascota: {app.pet?.name || 'Sin nombre'}
                                                </h3>
                                                {getStatusBadge(app.adoption_status?.name)}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {app.pet?.breed?.name || 'Raza mestiza'} • Solicitud #{app.id}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-gray-400" />
                                                    Fecha: {app.requested_at ? new Date(app.requested_at).toLocaleDateString() : 'Reciente'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sm:text-right">
                                        <p className="text-xs font-semibold text-gray-700">Estado Actual</p>
                                        <p className="text-sm font-bold text-[#006c49]">
                                            {app.adoption_status?.name || 'Pendiente de Evaluación'}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            Pronto un evaluador te contactará
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-3">
                                <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                                <h4 className="text-base font-bold text-gray-800">{searchError ? 'No se pudo consultar' : 'No se encontraron solicitudes'}</h4>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                    {searchError || 'No hay registros con esos datos. Verifica que el correo y el documento sean los mismos que registraste.'}
                                </p>
                                <div className="pt-2">
                                    <Link to="/catalog">
                                        <Button variant="outline" size="sm">
                                            Ir al Catálogo de Mascotas
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
};

