import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Occupation, Person, Residence } from '../../types/models';

const EMPTY_FORM = {
    document_type: 'DPI',
    document_number: '',
    estado_civil: '',
    cantidad_hijos: '0',
    occupation_id: '',
    residence_id: '',
    income: '',
    current_pets_count: '0',
};

type ProfileForm = typeof EMPTY_FORM;

const SELECT_CLASS =
    'w-full rounded border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]';

export const AdopterProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
    const [occupations, setOccupations] = useState<Occupation[]>([]);
    const [residences, setResidences] = useState<Residence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            api.get<Person | null>('my/profile'),
            api.get('occupations', { per_page: 100 }),
            api.get('residences', { per_page: 100 }),
        ])
            .then(([person, occupationList, residenceList]) => {
                setOccupations(occupationList.data);
                setResidences(residenceList.data);
                if (person) {
                    setForm({
                        document_type: person.document_type,
                        document_number: person.document_number,
                        estado_civil: person.estado_civil,
                        cantidad_hijos: String(person.cantidad_hijos),
                        occupation_id: String(person.occupation_id),
                        residence_id: String(person.residence_id),
                        income: String(Math.trunc(Number(person.income))),
                        current_pets_count: String(person.current_pets_count ?? 0),
                    });
                }
            })
            .catch((err) => setMessage(err?.message || 'No se pudieron cargar tus datos.'))
            .finally(() => setIsLoading(false));
    }, []);

    const setField = (name: keyof ProfileForm, value: string) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setIsSaved(false);
        setErrors({});
        setMessage(null);

        try {
            await api.put('my/profile', {
                ...form,
                cantidad_hijos: Number(form.cantidad_hijos),
                occupation_id: Number(form.occupation_id),
                residence_id: Number(form.residence_id),
                income: Number(form.income),
                current_pets_count: Number(form.current_pets_count),
            });
            setIsSaved(true);
        } catch (err: any) {
            setErrors(err?.errors || {});
            setMessage(err?.message || 'No se pudieron guardar tus datos.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PublicLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Mis Datos de Adoptante</h1>
                    <p className="text-sm text-gray-600">
                        El refugio usa estos datos para evaluar tus solicitudes. Tu nombre y correo se toman de tu cuenta.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                        {message && (
                            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">{message}</div>
                        )}
                        {isSaved && (
                            <div className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                                ✓ Tus datos fueron guardados. <Link to="/catalog" className="font-bold underline">Ver mascotas disponibles</Link>
                            </div>
                        )}

                        <p className="rounded-md bg-gray-50 border border-gray-200 p-3 text-xs text-gray-700">
                            Cuenta: <strong className="text-gray-900">{user?.name}</strong> ({user?.email})
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="document_type" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Tipo de Documento
                                </label>
                                <select
                                    id="document_type"
                                    value={form.document_type}
                                    onChange={(e) => setField('document_type', e.target.value)}
                                    className={SELECT_CLASS}
                                >
                                    <option value="DPI">DPI</option>
                                    <option value="PASSPORT">Pasaporte</option>
                                </select>
                            </div>
                            <Input
                                label="Número de Documento"
                                required
                                maxLength={25}
                                value={form.document_number}
                                error={errors.document_number?.[0]}
                                onChange={(e) => setField('document_number', e.target.value)}
                            />
                            <Input
                                label="Estado Civil"
                                required
                                maxLength={50}
                                value={form.estado_civil}
                                error={errors.estado_civil?.[0]}
                                onChange={(e) => setField('estado_civil', e.target.value)}
                            />
                            <Input
                                label="Cantidad de Hijos"
                                type="number"
                                required
                                min={0}
                                max={99}
                                value={form.cantidad_hijos}
                                error={errors.cantidad_hijos?.[0]}
                                onChange={(e) => setField('cantidad_hijos', e.target.value)}
                            />
                            <div>
                                <label htmlFor="occupation_id" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Ocupación <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="occupation_id"
                                    required
                                    value={form.occupation_id}
                                    onChange={(e) => setField('occupation_id', e.target.value)}
                                    className={SELECT_CLASS}
                                >
                                    <option value="">Seleccione...</option>
                                    {occupations.map((occupation) => (
                                        <option key={occupation.id} value={occupation.id}>
                                            {occupation.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="residence_id" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Vivienda <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="residence_id"
                                    required
                                    value={form.residence_id}
                                    onChange={(e) => setField('residence_id', e.target.value)}
                                    className={SELECT_CLASS}
                                >
                                    <option value="">Seleccione...</option>
                                    {residences.map((residence) => (
                                        <option key={residence.id} value={residence.id}>
                                            {residence.name || `Vivienda #${residence.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Ingresos Mensuales (Q)"
                                type="number"
                                required
                                min={0}
                                step={1}
                                value={form.income}
                                error={errors.income?.[0]}
                                onChange={(e) => setField('income', e.target.value)}
                            />
                            <Input
                                label="Mascotas Actuales"
                                type="number"
                                required
                                min={0}
                                value={form.current_pets_count}
                                error={errors.current_pets_count?.[0]}
                                onChange={(e) => setField('current_pets_count', e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                            <Link to="/mis-solicitudes">
                                <Button type="button" variant="outline">
                                    Volver
                                </Button>
                            </Link>
                            <Button type="submit" isLoading={isSaving} className="bg-[#006c49] hover:bg-[#005238]">
                                Guardar Datos
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </PublicLayout>
    );
};
