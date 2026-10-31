import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { homePathFor } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Usuarios reales existentes en los Seeders
    const handleQuickLogin = (role: 'admin' | 'vet' | 'receptionist' | 'volunteer') => {
        const credentials = {
            admin: { email: 'admin@refugio.test', pass: 'password' },
            vet: { email: 'ana.gomez@refugio.test', pass: 'password' },
            receptionist: { email: 'lucia.ramirez@refugio.test', pass: 'password' },
            volunteer: { email: 'jose.martinez@refugio.test', pass: 'password' },
        }[role];

        setEmail(credentials.email);
        setPassword(credentials.pass);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (activeTab === 'register') {
                if (!name.trim()) {
                    throw new Error('Por favor ingrese su nombre completo.');
                }
                navigate(homePathFor(await register(name, email, password)));
            } else {
                navigate(homePathFor(await login(email, password)));
            }
        } catch (err: any) {
            setError(err?.message || 'Error de autenticación. Comprueba tus datos.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                {/* Tabs: Iniciar Sesión / Crear Cuenta */}
                <div className="flex border-b border-gray-200 text-center font-medium">
                    <button
                        type="button"
                        onClick={() => setActiveTab('login')}
                        className={`flex-1 py-4 text-sm transition-colors ${
                            activeTab === 'login'
                                ? 'border-b-2 border-[#10b981] font-bold text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 py-4 text-sm transition-colors ${
                            activeTab === 'register'
                                ? 'border-b-2 border-[#10b981] font-bold text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Crear Cuenta
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && (
                        <div className="rounded-md bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
                            {error}
                        </div>
                    )}

                    {activeTab === 'register' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Nombre completo
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Tu nombre"
                                className="w-full rounded border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Correo electrónico
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ejemplo@correo.com"
                                className="w-full rounded border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                            />
                            <Mail className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <div className="mt-1.5 text-right">
                            <a
                                href="#olvido"
                                onClick={(e) => {
                                    e.preventDefault();
                                    alert('Contacte al administrador de TI del servidor local.');
                                }}
                                className="text-xs text-[#006c49] hover:underline"
                            >
                                ¿Olvidó su contraseña?
                            </a>
                        </div>
                    </div>

                    {/* Acceso Rápido Demo (Exacto a la Imagen 2) */}
                    <div className="pt-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                            ACCESO RÁPIDO (DEMO)
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('admin')}
                                className="rounded-full border border-emerald-600 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                            >
                                👑 Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('vet')}
                                className="rounded-full border border-blue-400 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors"
                            >
                                🩺 Veterinario
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('receptionist')}
                                className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                            >
                                📋 Recepcionista
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('volunteer')}
                                className="rounded-full border border-emerald-400 bg-white px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                                🤝 Voluntario
                            </button>
                        </div>
                    </div>

                    {/* Botón Principal (Verde Esmeralda) */}
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-white font-semibold rounded-md shadow-sm"
                    >
                        {activeTab === 'register' ? 'Crear Cuenta y Entrar' : 'Ingresar al Sistema'}
                    </Button>

                    <div className="text-center pt-1">
                        <Link to="/catalog" className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline">
                            ← Volver al Catálogo Público
                        </Link>
                    </div>
                </form>

                {/* Footer del card */}
                <div className="bg-[#eff4ff] px-6 py-3.5 text-center border-t border-gray-100">
                    <p className="text-[11px] font-bold tracking-wider text-[#565e74] uppercase">
                        USO INTERNO EXCLUSIVO PARA PERSONAL AUTORIZADO
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

