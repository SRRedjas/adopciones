import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, FileText, LogOut, PawPrint, Shield, User as UserIcon, Wifi } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface PublicLayoutProps {
    children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
    const { isAuthenticated, user, homePath, hasPermission, logout, primaryRole } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const applicationsPath = hasPermission('adopt') ? '/mis-solicitudes' : '/public/my-applications';
    const isStaff = homePath === '/admin/dashboard';
    const isAdopter = hasPermission('adopt');

    useEffect(() => {
        if (!menuOpen) return;

        const closeOnOutsideClick = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
        };
        const closeOnEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [menuOpen]);

    const handleLogout = async () => {
        setMenuOpen(false);
        await logout();
        navigate('/catalog');
    };

    const menuItemClass = 'flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer';

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
            {/* Topbar Refugio Conectado (Exacta a la Imagen 3) */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <PawPrint className="h-6 w-6 sm:h-7 sm:w-7 text-[#006c49] shrink-0" />
                        <Link to="/catalog" className="text-base sm:text-xl font-bold text-[#006c49] tracking-tight truncate">
                            Refugio Conectado
                        </Link>
                    </div>

                    {/* Navegación Central (Mascotas, Donaciones, Mis Solicitudes) */}
                    <nav className="hidden md:flex items-center gap-8">
                        <NavLink
                            to="/catalog"
                            className={({ isActive }) =>
                                cn(
                                    'text-sm font-semibold transition-colors pb-1 border-b-2',
                                    isActive
                                        ? 'text-[#006c49] border-[#006c49]'
                                        : 'text-gray-600 border-transparent hover:text-gray-900'
                                )
                            }
                        >
                            Mascotas
                        </NavLink>

                        <NavLink
                            to="/public/donations"
                            className={({ isActive }) =>
                                cn(
                                    'text-sm font-semibold transition-colors pb-1 border-b-2',
                                    isActive
                                        ? 'text-[#006c49] border-[#006c49]'
                                        : 'text-gray-600 border-transparent hover:text-gray-900'
                                )
                            }
                        >
                            Donaciones
                        </NavLink>

                        <NavLink
                            to={applicationsPath}
                            className={({ isActive }) =>
                                cn(
                                    'text-sm font-semibold transition-colors pb-1 border-b-2',
                                    isActive
                                        ? 'text-[#006c49] border-[#006c49]'
                                        : 'text-gray-600 border-transparent hover:text-gray-900'
                                )
                            }
                        >
                            Mis Solicitudes
                        </NavLink>
                    </nav>

                    {/* Lado Derecho: Estado LAN y Perfil / Acceso Admin */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 bg-[#e5eeff] px-3 py-1 rounded-full font-medium">
                            <Wifi className="h-3 w-3 text-[#10b981]" />
                            <span>LAN: Conectado</span>
                        </div>

                        {isAuthenticated ? (
                            <div ref={menuRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((open) => !open)}
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                    aria-label="Menú de cuenta"
                                    className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <span className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-300 shrink-0">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                                    </span>
                                    <span className="hidden sm:block max-w-32 truncate text-xs font-semibold text-gray-800">{user?.name}</span>
                                    <ChevronDown className={cn('h-3.5 w-3.5 text-gray-500 transition-transform', menuOpen && 'rotate-180')} />
                                </button>

                                {menuOpen && (
                                    <div role="menu" className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 bg-white py-1 shadow-lg z-50">
                                        <div className="px-4 py-2.5 border-b border-gray-100">
                                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">{primaryRole}</p>
                                        </div>

                                        {isStaff && (
                                            <Link to={homePath} role="menuitem" onClick={() => setMenuOpen(false)} className={menuItemClass}>
                                                <Shield className="h-4 w-4 text-gray-500" />
                                                <span>Panel Operativo</span>
                                            </Link>
                                        )}

                                        {isAdopter && (
                                            <>
                                                <Link to="/mis-solicitudes" role="menuitem" onClick={() => setMenuOpen(false)} className={menuItemClass}>
                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                    <span>Mis Solicitudes</span>
                                                </Link>
                                                <Link to="/mi-perfil" role="menuitem" onClick={() => setMenuOpen(false)} className={menuItemClass}>
                                                    <UserIcon className="h-4 w-4 text-gray-500" />
                                                    <span>Mis Datos de Adoptante</span>
                                                </Link>
                                            </>
                                        )}

                                        <div className="border-t border-gray-100 mt-1 pt-1">
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={handleLogout}
                                                className={cn(menuItemClass, 'text-red-600 hover:bg-red-50')}
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>Cerrar Sesión</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#10b981] hover:bg-[#059669] px-3 sm:px-4 py-2 rounded-md shadow-xs transition-colors shrink-0"
                            >
                                <UserIcon className="h-3.5 w-3.5" />
                                <span>Iniciar Sesión</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Sub-barra de navegación móvil para pantallas pequeñas */}
                <div className="flex md:hidden border-t border-gray-100 bg-white px-3 py-2 justify-around text-xs font-semibold">
                    <NavLink
                        to="/catalog"
                        className={({ isActive }) =>
                            isActive ? 'text-[#006c49] font-bold border-b-2 border-[#006c49] pb-0.5' : 'text-gray-600 hover:text-gray-900'
                        }
                    >
                        Mascotas
                    </NavLink>
                    <NavLink
                        to="/public/donations"
                        className={({ isActive }) =>
                            isActive ? 'text-[#006c49] font-bold border-b-2 border-[#006c49] pb-0.5' : 'text-gray-600 hover:text-gray-900'
                        }
                    >
                        Donaciones
                    </NavLink>
                    <NavLink
                        to={applicationsPath}
                        className={({ isActive }) =>
                            isActive ? 'text-[#006c49] font-bold border-b-2 border-[#006c49] pb-0.5' : 'text-gray-600 hover:text-gray-900'
                        }
                    >
                        Mis Solicitudes
                    </NavLink>
                </div>
            </header>

            {/* Contenido público */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
                {children}
            </main>
        </div>
    );
};

