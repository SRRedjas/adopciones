import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { useResource } from '../../hooks/useResource';
import { Pet, Shelter } from '../../types/models';
import {
    Search,
    MapPin,
    Calendar,
    Weight,
    Building2,
    Heart,
    Inbox,
    Sparkles,
    Stethoscope,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    X,
    Filter,
    Check,
    FileText,
    Syringe,
    Info,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { SkeletonPetCard } from '../../components/ui/Skeleton';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export const PetCatalogPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const isAdopter = hasPermission('adopt');

    const {
        items: pets,
        pagination,
        page,
        setPage,
        isLoading,
    } = useResource<Pet>({
        endpoint: 'pets',
        perPage: 24,
        initialParams: { available: 1 },
    });

    // Catálogo de sedes para filtro
    const [shelters, setShelters] = useState<Shelter[]>([]);
    const [selectedShelterId, setSelectedShelterId] = useState<number | 'all'>('all');

    // Filtros
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'dogs' | 'cats' | 'others'>('all');
    const [selectedSex, setSelectedSex] = useState<'all' | 'M' | 'F'>('all');
    const [selectedAgeRange, setSelectedAgeRange] = useState<'all' | 'puppy' | 'adult' | 'senior'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal de Expediente y Adopción
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'dossier' | 'apply'>('dossier');

    // Formulario de Solicitud
    const [applicantName, setApplicantName] = useState('');
    const [applicantEmail, setApplicantEmail] = useState('');
    const [applicantPhone, setApplicantPhone] = useState('');
    const [applicantDocument, setApplicantDocument] = useState('');
    const [applicantNotes, setApplicantNotes] = useState('');
    const [adoptionSuccess, setAdoptionSuccess] = useState(false);
    const [submittedAdoptionId, setSubmittedAdoptionId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [needsProfile, setNeedsProfile] = useState(false);

    // Cargar lista de sedes
    useEffect(() => {
        api.get('shelters')
            .then((res: any) => {
                const list = Array.isArray(res) ? res : res?.data;
                if (Array.isArray(list)) {
                    setShelters(list);
                }
            })
            .catch(() => {});
    }, []);

    // Determinar foto y características mapeadas
    const getPetDisplayData = (p: Pet) => {
        const speciesName = p.species?.name || 'Mascota';
        const breedName = p.breed?.name || 'Mestizo';
        const isDog = speciesName.toLowerCase().includes('perr') || speciesName.toLowerCase().includes('can') || p.species_id === 1;
        const isCat = speciesName.toLowerCase().includes('gat') || speciesName.toLowerCase().includes('fel') || p.species_id === 2;

        const fallbackImg = isDog
            ? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600'
            : isCat
              ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600'
              : 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600';

        const statusLower = (p.pet_status?.name || p.status || '').toLowerCase();
        let statusVariant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (statusLower.includes('disp')) statusVariant = 'success';
        else if (statusLower.includes('tratam') || statusLower.includes('obs')) statusVariant = 'warning';
        else if (statusLower.includes('cuaren') || statusLower.includes('fall')) statusVariant = 'danger';

        const isSterilized =
            p.notes?.toLowerCase().includes('esteriliz') ||
            p.pet_treatments?.some((pt) => pt.treatment?.name?.toLowerCase().includes('esteril') || pt.treatment?.name?.toLowerCase().includes('castra')) ||
            false;

        return {
            photo: p.photo_url || fallbackImg,
            speciesName,
            breedName,
            statusLabel: p.pet_status?.name?.toUpperCase() || (p.status === 'active' ? 'DISPONIBLE' : 'EN TRATAMIENTO'),
            statusVariant,
            ageText: p.estimated_age !== null && p.estimated_age !== undefined ? `${p.estimated_age} años` : 'Edad no especificada',
            weightText: p.weight_kg ? `${p.weight_kg} kg` : 'Mediano',
            shelterName: p.shelter?.name || 'Sede Central',
            isSterilized,
        };
    };

    // Filtrar mascotas según criterios
    const filteredPets = pets.filter((pet) => {
        const display = getPetDisplayData(pet);

        // Búsqueda textual
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matches =
                pet.name.toLowerCase().includes(q) ||
                display.breedName.toLowerCase().includes(q) ||
                display.speciesName.toLowerCase().includes(q) ||
                (pet.color?.name && pet.color.name.toLowerCase().includes(q));
            if (!matches) return false;
        }

        // Categoría / Especie
        if (selectedCategory === 'dogs') {
            if (!display.speciesName.toLowerCase().includes('perr') && !display.speciesName.toLowerCase().includes('can') && pet.species_id !== 1) {
                return false;
            }
        } else if (selectedCategory === 'cats') {
            if (!display.speciesName.toLowerCase().includes('gat') && !display.speciesName.toLowerCase().includes('fel') && pet.species_id !== 2) {
                return false;
            }
        } else if (selectedCategory === 'others') {
            const isDog = display.speciesName.toLowerCase().includes('perr') || display.speciesName.toLowerCase().includes('can') || pet.species_id === 1;
            const isCat = display.speciesName.toLowerCase().includes('gat') || display.speciesName.toLowerCase().includes('fel') || pet.species_id === 2;
            if (isDog || isCat) return false;
        }

        // Sede
        if (selectedShelterId !== 'all') {
            if (pet.shelter_id !== selectedShelterId) return false;
        }

        // Sexo
        if (selectedSex !== 'all') {
            if (pet.sex !== selectedSex) return false;
        }

        // Rango de edad
        if (selectedAgeRange !== 'all') {
            const age = pet.estimated_age ?? 2;
            if (selectedAgeRange === 'puppy' && age > 1) return false;
            if (selectedAgeRange === 'adult' && (age <= 1 || age > 7)) return false;
            if (selectedAgeRange === 'senior' && age <= 7) return false;
        }

        return true;
    });

    const hasActiveFilters =
        selectedCategory !== 'all' ||
        selectedShelterId !== 'all' ||
        selectedSex !== 'all' ||
        selectedAgeRange !== 'all' ||
        searchQuery.trim() !== '';

    const handleClearFilters = () => {
        setSelectedCategory('all');
        setSelectedShelterId('all');
        setSelectedSex('all');
        setSelectedAgeRange('all');
        setSearchQuery('');
    };

    const handleOpenDossier = (pet: Pet) => {
        setSelectedPet(pet);
        setModalTab('dossier');
        setAdoptionSuccess(false);
        setSubmitError(null);
        setSubmittedAdoptionId(null);
        setIsDossierModalOpen(true);
    };

    const handleAdoptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setNeedsProfile(false);
        setIsSubmitting(true);

        try {
            if (isAdopter) {
                const adoption = await api.post('my/adoptions', {
                    pet_id: selectedPet?.id,
                    notes: applicantNotes.trim() || null,
                });

                setSubmittedAdoptionId(adoption?.id || null);
                setAdoptionSuccess(true);
                return;
            }

            const res = await api.post('public/adoptions', {
                pet_id: selectedPet?.id,
                name: user ? user.name.slice(0, 50) : applicantName.trim(),
                email: user ? user.email : applicantEmail.trim(),
                phone: applicantPhone.trim(),
                document_number: applicantDocument.trim(),
                notes: applicantNotes.trim() || 'Solicitud registrada desde el catálogo web público con expediente revisado.',
            });

            setSubmittedAdoptionId(res?.adoption?.id || null);
            setAdoptionSuccess(true);
        } catch (err: any) {
            setNeedsProfile(Boolean(err?.errors?.profile));
            setSubmitError(err?.message || 'Error al enviar la solicitud. Por favor verifica tus datos.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedDisplay = selectedPet ? getPetDisplayData(selectedPet) : null;

    return (
        <PublicLayout>
            <div className="space-y-6">
                {/* Hero Banner Ciudadano */}
                <div className="rounded-2xl bg-gradient-to-r from-[#006c49] to-[#004d34] p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-semibold backdrop-blur-xs">
                            <Heart className="h-3.5 w-3.5 fill-current" />
                            <span>Adopta con Responsabilidad</span>
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Encuentra a tu Compañero Ideal
                        </h1>
                        <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                            Todos nuestros rescatados cuentan con revisión clínica, esquema de vacunación y evaluación de temperamento. Conoce su expediente completo y postula en línea.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/15">
                        <div className="text-center px-2">
                            <p className="text-2xl font-black text-white">{pagination.total || pets.length}</p>
                            <p className="text-[11px] font-medium text-emerald-100">En Adopción</p>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div className="text-center px-2">
                            <p className="text-2xl font-black text-white">{shelters.length || 3}</p>
                            <p className="text-[11px] font-medium text-emerald-100">Sedes Activas</p>
                        </div>
                    </div>
                </div>

                {/* Barra de Filtros Multifunción */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
                    {/* Fila Superior: Búsqueda y Selector de Sede */}
                    <div className="flex flex-col lg:flex-row items-center gap-3 justify-between">
                        {/* Buscador */}
                        <div className="relative w-full lg:w-96">
                            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por nombre, raza o color..."
                                className="w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
                            />
                        </div>

                        {/* Filtros Dropdowns: Sedes, Sexo y Edad */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-2 w-full lg:w-auto">
                            {/* Selector de Sede Funcional */}
                            <div className="relative flex items-center w-full lg:w-auto">
                                <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
                                <select
                                    value={selectedShelterId}
                                    onChange={(e) =>
                                        setSelectedShelterId(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
                                    }
                                    className="w-full lg:w-auto rounded-md border border-gray-300 py-2 pl-9 pr-8 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:border-[#006c49] focus:outline-none cursor-pointer"
                                >
                                    <option value="all">Todas las Sedes</option>
                                    {shelters.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector de Sexo */}
                            <select
                                value={selectedSex}
                                onChange={(e) => setSelectedSex(e.target.value as any)}
                                className="w-full lg:w-auto rounded-md border border-gray-300 py-2 px-3 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:border-[#006c49] focus:outline-none cursor-pointer"
                            >
                                <option value="all">Sexo: Todos</option>
                                <option value="M">Macho</option>
                                <option value="F">Hembra</option>
                            </select>

                            {/* Selector de Edad */}
                            <select
                                value={selectedAgeRange}
                                onChange={(e) => setSelectedAgeRange(e.target.value as any)}
                                className="w-full lg:w-auto rounded-md border border-gray-300 py-2 px-3 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:border-[#006c49] focus:outline-none cursor-pointer"
                            >
                                <option value="all">Edad: Todas</option>
                                <option value="puppy">Cachorro (&lt; 1 año)</option>
                                <option value="adult">Adulto (1 - 7 años)</option>
                                <option value="senior">Senior (7+ años)</option>
                            </select>

                            {/* Botón Limpiar Filtros */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="col-span-full lg:col-auto inline-flex items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                                    title="Restablecer todos los filtros"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span>Limpiar</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Fila Inferior: Pills de Especie y Contador */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 touch-pan-x">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('all')}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                    selectedCategory === 'all'
                                        ? 'bg-[#006c49] text-white shadow-xs'
                                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Todos
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('dogs')}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                    selectedCategory === 'dogs'
                                        ? 'bg-[#006c49] text-white shadow-xs'
                                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Perros 🐶
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('cats')}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                    selectedCategory === 'cats'
                                        ? 'bg-[#006c49] text-white shadow-xs'
                                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Gatos 🐱
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('others')}
                                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                    selectedCategory === 'others'
                                        ? 'bg-[#006c49] text-white shadow-xs'
                                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Otras Especies 🦜
                            </button>
                        </div>

                        <span className="text-xs text-gray-500 font-medium">
                            Mostrando <strong className="text-gray-800">{filteredPets.length}</strong> de{' '}
                            <strong>{pets.length}</strong> animales
                        </span>
                    </div>
                </div>

                {/* Grid de Mascotas / Skeletons */}
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonPetCard key={i} />
                        ))}
                    </div>
                ) : filteredPets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-xs">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#006c49] mb-3">
                            <Inbox className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No se encontraron mascotas</h3>
                        <p className="text-xs text-gray-500 max-w-sm mt-1">
                            No hay animales albergados que coincidan con los filtros seleccionados. Intenta modificar tus criterios de búsqueda.
                        </p>
                        {hasActiveFilters && (
                            <Button variant="outline" size="sm" className="mt-4" onClick={handleClearFilters}>
                                Restablecer filtros
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredPets.map((pet) => {
                            const display = getPetDisplayData(pet);

                            return (
                                <div
                                    key={pet.id}
                                    className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md hover:border-emerald-300"
                                >
                                    {/* Imagen de la Mascota */}
                                    <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
                                        <img
                                            src={display.photo}
                                            alt={pet.name}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute right-3 top-3">
                                            <Badge variant={display.statusVariant}>{display.statusLabel}</Badge>
                                        </div>
                                        <div className="absolute left-3 bottom-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded">
                                            {pet.sex === 'M' ? 'Macho ♂' : 'Hembra ♀'}
                                        </div>
                                    </div>

                                    {/* Contenido de la Tarjeta */}
                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-black text-gray-900 group-hover:text-[#006c49] transition-colors">
                                                    {pet.name}
                                                </h3>
                                                <span className="text-[11px] font-mono font-semibold text-gray-400">
                                                    #{pet.id}
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-gray-500">{display.breedName}</p>
                                        </div>

                                        {/* Pills con datos rápidos */}
                                        <div className="mb-4 flex flex-wrap gap-1.5">
                                            <span className="inline-flex items-center gap-1 rounded bg-[#eff4ff] px-2.5 py-1 text-xs font-medium text-gray-700">
                                                <Calendar className="h-3 w-3 text-gray-500" />
                                                {display.ageText}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded bg-[#eff4ff] px-2.5 py-1 text-xs font-medium text-gray-700">
                                                <Weight className="h-3 w-3 text-gray-500" />
                                                {display.weightText}
                                            </span>
                                            {display.isSterilized && (
                                                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                                                    <Check className="h-3 w-3 text-emerald-600" />
                                                    Esterilizado
                                                </span>
                                            )}
                                        </div>

                                        {/* Sede y Botón Ver Expediente */}
                                        <div className="mt-auto border-t border-gray-100 pt-3 space-y-3">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate">{display.shelterName}</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleOpenDossier(pet)}
                                                className="w-full rounded-md bg-[#006c49] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#005238] shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <span>Ver Expediente y Solicitar</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Paginación */}
                {!isLoading && pagination.total > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-xs">
                        <Pagination
                            currentPage={page}
                            lastPage={pagination.last_page}
                            total={pagination.total}
                            from={pagination.from}
                            to={pagination.to}
                            onPageChange={(newPage) => setPage(newPage)}
                        />
                    </div>
                )}
            </div>

            {/* Modal Integral: Expediente Clínico + Solicitud de Adopción */}
            <Modal
                isOpen={isDossierModalOpen}
                onClose={() => setIsDossierModalOpen(false)}
                title={selectedPet ? `Expediente: ${selectedPet.name} (#${selectedPet.id})` : 'Expediente'}
                description={
                    modalTab === 'dossier'
                        ? 'Ficha técnica, historial médico y perfil de comportamiento.'
                        : 'Formulario oficial de postulación para evaluación socioeconómica.'
                }
                maxWidth="2xl"
            >
                {selectedPet && selectedDisplay && (
                    <div className="space-y-5">
                        {/* Tabs del Modal */}
                        <div className="flex border-b border-gray-200 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setModalTab('dossier')}
                                className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                                    modalTab === 'dossier'
                                        ? 'border-[#006c49] text-[#006c49]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FileText className="h-4 w-4" />
                                <span>Ficha y Salud</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalTab('apply')}
                                className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                                    modalTab === 'apply'
                                        ? 'border-[#006c49] text-[#006c49]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Heart className="h-4 w-4" />
                                <span>Solicitud de Adopción</span>
                            </button>
                        </div>

                        {/* CONTENIDO TAB 1: FICHA Y EXPEDIENTE */}
                        {modalTab === 'dossier' && (
                            <div className="space-y-5">
                                {/* Encabezado de la mascota con foto y datos principales */}
                                <div className="flex flex-col sm:flex-row gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="h-32 w-32 shrink-0 rounded-xl overflow-hidden bg-gray-200 border border-gray-300">
                                        <img
                                            src={selectedDisplay.photo}
                                            alt={selectedPet.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>

                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xl font-extrabold text-gray-900">{selectedPet.name}</h4>
                                            <Badge variant={selectedDisplay.statusVariant}>
                                                {selectedDisplay.statusLabel}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium">
                                            {selectedPet.breed?.name || 'Mestizo'} • {selectedDisplay.speciesName}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                            <div>
                                                <span className="text-gray-400">Sexo:</span>{' '}
                                                <strong className="text-gray-800">
                                                    {selectedPet.sex === 'M' ? 'Macho' : 'Hembra'}
                                                </strong>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Edad Estimada:</span>{' '}
                                                <strong className="text-gray-800">{selectedDisplay.ageText}</strong>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Peso:</span>{' '}
                                                <strong className="text-gray-800">{selectedDisplay.weightText}</strong>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Color:</span>{' '}
                                                <strong className="text-gray-800">{selectedPet.color?.name || 'No especificado'}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Ubicación y Sede */}
                                <div className="rounded-lg border border-gray-200 p-3.5 flex items-center justify-between text-xs bg-white">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-[#006c49]" />
                                        <div>
                                            <p className="font-bold text-gray-900">{selectedDisplay.shelterName}</p>
                                            <p className="text-gray-500">{selectedPet.shelter?.address || 'Instalaciones Centrales del Refugio'}</p>
                                        </div>
                                    </div>
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200">
                                        Listo para visita
                                    </span>
                                </div>

                                {/* Tratamientos y Esquema Clínico */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
                                        <Syringe className="h-4 w-4 text-[#006c49]" />
                                        <span>Tratamientos y Vacunas Aplicadas</span>
                                    </div>

                                    {selectedPet.pet_treatments && selectedPet.pet_treatments.length > 0 ? (
                                        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden bg-white text-xs">
                                            {selectedPet.pet_treatments.map((pt) => (
                                                <div key={pt.id} className="p-3 flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-gray-900">{pt.treatment?.name || 'Tratamiento Clínico'}</p>
                                                        <p className="text-gray-500 text-[11px] mt-0.5">{pt.instructions || 'Aplicación completada satisfactoriamente.'}</p>
                                                    </div>
                                                    <span className="text-[11px] font-mono text-gray-500 whitespace-nowrap">
                                                        {pt.treated_at}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg bg-gray-50 p-3.5 text-xs text-gray-600 border border-gray-200 flex items-center gap-2">
                                            <Info className="h-4 w-4 text-gray-400 shrink-0" />
                                            <span>
                                                Este animal cuenta con chequeo médico preventivo general. Los refuerzos se completan en la sede.
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Notas de Temperamento y Comportamiento */}
                                {selectedPet.notes && (
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                            Comportamiento y Observaciones
                                        </span>
                                        <p className="text-xs text-gray-700 bg-gray-50 p-3.5 rounded-lg border border-gray-200 leading-relaxed">
                                            {selectedPet.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Botón para pasar a la solicitud */}
                                <div className="pt-2 flex justify-end">
                                    <Button
                                        onClick={() => setModalTab('apply')}
                                        className="bg-[#006c49] hover:bg-[#005238] flex items-center gap-2"
                                    >
                                        <span>Quiero Adoptar a {selectedPet.name}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* CONTENIDO TAB 2: FORMULARIO DE SOLICITUD */}
                        {modalTab === 'apply' && (
                            <div>
                                {adoptionSuccess ? (
                                    <div className="py-6 text-center space-y-4">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                            <CheckCircle2 className="h-8 w-8" />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900">
                                            ¡Solicitud Registrada con Éxito!
                                        </h4>
                                        {submittedAdoptionId && (
                                            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-full border border-emerald-200">
                                                Expediente #{submittedAdoptionId}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                                            Hemos recibido tu postulación para adoptar a{' '}
                                            <strong className="text-gray-900">{selectedPet.name}</strong>. Nuestro equipo evaluador revisará tu perfil socioeconómico
                                            {isAdopter ? ' y verás el avance en Mis Solicitudes.' : (
                                                <>
                                                    {' '}y se comunicará a{' '}
                                                    <span className="font-semibold text-gray-800">{user?.email ?? applicantEmail}</span> o al teléfono{' '}
                                                    <span className="font-semibold text-gray-800">{applicantPhone}</span> para coordinar la entrevista.
                                                </>
                                            )}
                                        </p>
                                        <div className="pt-2">
                                            {isAdopter ? (
                                                <Link to="/mis-solicitudes">
                                                    <Button>Ver Mis Solicitudes</Button>
                                                </Link>
                                            ) : (
                                                <Button onClick={() => setIsDossierModalOpen(false)}>
                                                    Aceptar y Cerrar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleAdoptSubmit} className="space-y-4">
                                        {submitError && (
                                            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                                                {submitError}
                                                {needsProfile && (
                                                    <Link to="/mi-perfil" className="ml-1 font-bold underline">
                                                        Completar mis datos
                                                    </Link>
                                                )}
                                            </div>
                                        )}

                                        <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                                            <span>
                                                Postulando para: <strong>{selectedPet.name}</strong> ({selectedDisplay.breedName}). Tus datos serán tratados con confidencialidad.
                                            </span>
                                        </div>

                                        {!isAdopter && (
                                            <>
                                        {user ? (
                                            <p className="rounded-md bg-gray-50 border border-gray-200 p-3 text-xs text-gray-700">
                                                Postulando como <strong className="text-gray-900">{user.name}</strong> ({user.email})
                                            </p>
                                        ) : (
                                            <>
                                                <Input
                                                    label="Nombre Completo del Solicitante"
                                                    required
                                                    maxLength={50}
                                                    value={applicantName}
                                                    onChange={(e) => setApplicantName(e.target.value)}
                                                    placeholder="Nombres y Apellidos completos"
                                                />
                                                <Input
                                                    label="Correo Electrónico"
                                                    type="email"
                                                    required
                                                    value={applicantEmail}
                                                    onChange={(e) => setApplicantEmail(e.target.value)}
                                                    placeholder="tu@correo.com"
                                                />
                                            </>
                                        )}

                                        <Input
                                            label="Teléfono / WhatsApp"
                                            required
                                            value={applicantPhone}
                                            onChange={(e) => setApplicantPhone(e.target.value)}
                                            placeholder="Ej. 5555-1234"
                                        />

                                        <Input
                                            label="Número de DPI / Documento de Identificación"
                                            required
                                            maxLength={25}
                                            value={applicantDocument}
                                            onChange={(e) => setApplicantDocument(e.target.value)}
                                            placeholder="Ej. 2450 12345 0101 (13 dígitos)"
                                        />
                                            </>
                                        )}

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                                Motivación o Condiciones del Hogar (Opcional)
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={applicantNotes}
                                                onChange={(e) => setApplicantNotes(e.target.value)}
                                                placeholder="Cuéntanos si tienes patio, si conviven otros animales o qué experiencia previa tienes con mascotas..."
                                                className="w-full rounded border border-gray-300 p-3 text-xs text-gray-900 focus:border-[#006c49] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setModalTab('dossier')}
                                            >
                                                ← Volver al Expediente
                                            </Button>

                                            <Button type="submit" isLoading={isSubmitting} className="bg-[#006c49] hover:bg-[#005238]">
                                                Enviar Solicitud de Adopción
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </PublicLayout>
    );
};
