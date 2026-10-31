import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from './Badge';

interface AccessDeniedPageProps {
    moduleName?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
    moduleName = 'esta sección',
}) => {
    const { user, primaryRole, logout, homePath } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200">
                    <ShieldAlert className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                        Acceso Restringido (RBAC)
                    </span>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-2">
                        Módulo No Autorizado
                    </h2>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Tu cuenta actual no cuenta con los privilegios requeridos para acceder a <strong className="text-gray-900">{moduleName}</strong>.
                    </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 border border-gray-200 text-left text-xs space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Usuario conectado:</span>
                        <span className="font-bold text-gray-900">{user?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Rol asignado:</span>
                        <Badge variant="info">{primaryRole}</Badge>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Link to={homePath} className="w-full sm:w-auto">
                        <Button
                            variant="primary"
                            size="sm"
                            className="w-full flex items-center justify-center gap-1.5 bg-[#006c49] hover:bg-[#005238]"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Volver a mi Panel</span>
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Cambiar Cuenta</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

