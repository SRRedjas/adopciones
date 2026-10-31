import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Heart, DollarSign, Package, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Pet } from '../../types/models';

export const PublicDonationsPage: React.FC = () => {
    const { user } = useAuth();
    const [donationType, setDonationType] = useState<'money' | 'items'>('money');
    const [selectedAmount, setSelectedAmount] = useState<number>(100);
    const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [donorName, setDonorName] = useState('');
    const [donorEmail, setDonorEmail] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [receiptCode, setReceiptCode] = useState('');

    const presetAmounts = [50, 100, 250, 500];

    // Con sesión iniciada el donante es la cuenta: no se vuelven a pedir sus datos.
    const effectiveName = user ? user.name.slice(0, 50) : donorName.trim();
    const effectiveEmail = user ? user.email : donorEmail.trim();

    useEffect(() => {
        api.get('pets', { per_page: 30 })
            .then((res: any) => {
                const list = Array.isArray(res) ? res : res?.data;
                if (Array.isArray(list)) {
                    setPets(list);
                }
            })
            .catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setIsLoading(true);

        let finalAmount = 0;
        if (donationType === 'money') {
            if (isCustomAmount) {
                const parsed = parseFloat(customAmount);
                if (isNaN(parsed) || parsed <= 0) {
                    setErrorMessage('Por favor ingresa un monto válido mayor a 0.');
                    setIsLoading(false);
                    return;
                }
                finalAmount = parsed;
            } else {
                finalAmount = selectedAmount;
            }
        }

        try {
            const res = await api.post('public/donations', {
                donor_name: effectiveName,
                email: effectiveEmail,
                amount: finalAmount,
                contribution_type: donationType === 'money' ? 'transfer' : 'in_kind',
                notes: donationType === 'items' ? itemDescription.trim() : 'Donación monetaria vía portal web.',
                pet_id: selectedPetId || null,
            });

            const code = res?.receipt_code || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
            setReceiptCode(code);
            setIsSubmitted(true);
        } catch (err: any) {
            setErrorMessage(err?.message || 'Ocurrió un error al registrar tu donación. Por favor inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PublicLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Hero Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        <Heart className="h-3.5 w-3.5 fill-current" />
                        <span>Haz la diferencia hoy</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Apoya a los Animales del Refugio
                    </h1>
                    <p className="text-sm text-gray-600 max-w-xl mx-auto">
                        Cada aporte se traduce directamente en alimento, atención veterinaria, vacunas y un espacio digno para cientos de mascotas rescatadas.
                    </p>
                </div>

                {/* Métricas de Impacto */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-xs">
                        <p className="text-2xl font-black text-[#006c49]">+1,200</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Kilos de alimento al mes</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-xs">
                        <p className="text-2xl font-black text-[#006c49]">85%</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Casos médicos rehabilitados</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-xs">
                        <p className="text-2xl font-black text-[#006c49]">340+</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Mascotas en adopción activa</p>
                    </div>
                </div>

                {/* Formulario de Donación */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
                    {isSubmitted ? (
                        <div className="text-center py-10 space-y-4">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">¡Muchas Gracias por tu Solidaridad!</h3>
                            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-full border border-emerald-200">
                                Comprobante Oficial: {receiptCode}
                            </div>
                            <p className="text-sm text-gray-600 max-w-md mx-auto">
                                Tu aporte ha sido registrado en la base de datos contable del refugio. Te hemos enviado un comprobante digital y la guía de recepción a <span className="font-semibold text-gray-800">{effectiveEmail || 'tu correo'}</span>.
                            </p>
                            <Button
                                onClick={() => {
                                    setIsSubmitted(false);
                                    setItemDescription('');
                                    setCustomAmount('');
                                    setIsCustomAmount(false);
                                }}
                                variant="outline"
                            >
                                Realizar otra donación
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {errorMessage && (
                                <div className="rounded-md bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Selector Tipo */}
                            <div className="flex border-b border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setDonationType('money')}
                                    className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                                        donationType === 'money'
                                            ? 'border-[#006c49] text-[#006c49]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <DollarSign className="h-4 w-4" />
                                    Donación Monetaria
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDonationType('items')}
                                    className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                                        donationType === 'items'
                                            ? 'border-[#006c49] text-[#006c49]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Package className="h-4 w-4" />
                                    Donación en Especie / Insumos
                                </button>
                            </div>

                            {donationType === 'money' ? (
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-gray-700">
                                        Selecciona o ingresa el monto en Quetzales (Q)
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        {presetAmounts.map((amt) => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAmount(amt);
                                                    setIsCustomAmount(false);
                                                }}
                                                className={`py-3 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                                                    !isCustomAmount && selectedAmount === amt
                                                        ? 'border-[#006c49] bg-emerald-50 text-[#006c49] ring-1 ring-[#006c49]'
                                                        : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                                                }`}
                                            >
                                                Q {amt}.00
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomAmount(true)}
                                            className={`py-3 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                                                isCustomAmount
                                                    ? 'border-[#006c49] bg-emerald-50 text-[#006c49] ring-1 ring-[#006c49]'
                                                    : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                                            }`}
                                        >
                                            Otro Monto
                                        </button>
                                    </div>

                                    {isCustomAmount && (
                                        <div className="pt-2">
                                            <Input
                                                label="Monto Personalizado (Q)"
                                                type="number"
                                                step="0.01"
                                                min="1"
                                                required
                                                value={customAmount}
                                                onChange={(e) => setCustomAmount(e.target.value)}
                                                placeholder="Ej. 150.00"
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Descripción de los Insumos (Alimento, Medicamentos, Mantas) *
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={itemDescription}
                                        onChange={(e) => setItemDescription(e.target.value)}
                                        placeholder="Ej. 2 sacos de concentrado para perro adulto de 25 kg, gasas y antiséptico..."
                                        className="w-full rounded-md border border-gray-300 p-3 text-sm text-gray-900 focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
                                    />
                                </div>
                            )}

                            {/* Padrinazgo Opcional a una Mascota */}
                            {pets.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                        <span>Dedicar este aporte a una mascota específica (Opcional)</span>
                                    </label>
                                    <select
                                        value={selectedPetId || ''}
                                        onChange={(e) => setSelectedPetId(e.target.value ? parseInt(e.target.value, 10) : null)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
                                    >
                                        <option value="">Fondo General del Refugio (Todos los animales)</option>
                                        {pets.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.species?.name || 'Mascota'} - {p.breed?.name || 'Raza'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Datos del Donante */}
                            {user ? (
                                <p className="rounded-md bg-gray-50 border border-gray-200 p-3 text-xs text-gray-700">
                                    Donando como <strong className="text-gray-900">{user.name}</strong> ({user.email})
                                </p>
                            ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Nombre Completo o Razón Social"
                                    required
                                    value={donorName}
                                    onChange={(e) => setDonorName(e.target.value)}
                                    placeholder="Tu nombre o empresa"
                                />
                                <Input
                                    label="Correo Electrónico"
                                    type="email"
                                    required
                                    value={donorEmail}
                                    onChange={(e) => setDonorEmail(e.target.value)}
                                    placeholder="tu@correo.com"
                                />
                            </div>
                            )}

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span>Tus donaciones son deducibles y se auditan bajo el registro contable del refugio.</span>
                            </div>

                            <Button
                                type="submit"
                                isLoading={isLoading}
                                className="w-full py-3.5 bg-[#006c49] hover:bg-[#005238] text-white font-semibold rounded-lg shadow-sm"
                            >
                                {donationType === 'money' ? 'Confirmar Donación' : 'Registrar Donación en Especie'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
};
