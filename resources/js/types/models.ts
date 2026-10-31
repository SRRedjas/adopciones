// Tipos de datos para todos los recursos según referencia-api.md

export interface PaginationResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface User {
    id: number;
    name: string;
    email: string;
    created_at?: string;
    updated_at?: string;
    roles?: Role[];
    permissions?: string[];
}

export interface Role {
    id: number;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    permissions?: Permission[];
}

export interface Permission {
    id: number;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Species {
    id: number;
    name: string;
    description: string;
    created_at?: string;
    updated_at?: string;
}

export interface Breed {
    id: number;
    species_id: number;
    name: string;
    description: string;
    species?: Species;
    created_at?: string;
    updated_at?: string;
}

export interface Color {
    id: number;
    name: string;
    hex_color?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PetStatus {
    id: number;
    name: string;
    is_adoptable?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface AdoptionStatus {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface AppointmentType {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface TreatmentType {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface Shelter {
    id: number;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Residence {
    id: number;
    name?: string;
    animal_limit: number;
    created_at?: string;
    updated_at?: string;
}

export interface Occupation {
    id: number;
    name: string;
    formalidad: string;
    horarios: string;
    created_at?: string;
    updated_at?: string;
}

export interface Person {
    id: number;
    name: string;
    document_type: 'DPI' | 'PASSPORT';
    document_number: string;
    email: string;
    estado_civil: string;
    cantidad_hijos: number;
    occupation_id: number;
    residence_id: number;
    income: number;
    current_pets_count?: number;
    occupation?: Occupation;
    residence?: Residence;
    created_at?: string;
    updated_at?: string;
}

export interface Donor {
    id: number;
    name: string;
    person_id: number;
    person?: Person;
    created_at?: string;
    updated_at?: string;
}

export interface Treatment {
    id: number;
    name: string;
    requires_veterinarian: boolean;
    cost: number;
    treatment_type_id: number;
    treatment_type?: TreatmentType;
    created_at?: string;
    updated_at?: string;
}

export interface Pet {
    id: number;
    name: string;
    species_id: number;
    breed_id: number;
    sex: 'M' | 'F';
    birth_date: string;
    estimated_age?: number;
    color_id: number;
    weight_kg?: number;
    notes?: string;
    pet_status_id: number;
    registered_at: string;
    shelter_id: number;
    status?: 'active' | 'inactive';
    species?: Species;
    breed?: Breed;
    color?: Color;
    pet_status?: PetStatus;
    shelter?: Shelter;
    photo_url?: string;
    pet_treatments?: PetTreatment[];
    created_at?: string;
    updated_at?: string;
}

export interface PetHistory {
    id: number;
    pet_id: number;
    pet_status_id: number;
    notes: string;
    recorded_at: string;
    user_id?: number;
    pet?: Pet;
    pet_status?: PetStatus;
    user?: User;
    created_at?: string;
    updated_at?: string;
}

export interface PetTreatment {
    id: number;
    pet_id: number;
    treatment_id: number;
    instructions: string;
    treated_at: string;
    pet?: Pet;
    treatment?: Treatment;
    created_at?: string;
    updated_at?: string;
}

export interface Appointment {
    id: number;
    pet_id: number;
    appointment_date: string;
    appointment_type_id: number;
    person_id: number;
    notes?: string;
    status?: 'pending' | 'completed' | 'missed';
    user_id?: number;
    pet?: Pet;
    appointment_type?: AppointmentType;
    person?: Person;
    user?: User;
    created_at?: string;
    updated_at?: string;
}

export interface Donation {
    id: number;
    donor_id: number;
    amount: number;
    contribution_type: 'cash' | 'transfer' | 'in_kind';
    pet_id?: number;
    donor?: Donor;
    pet?: Pet;
    created_at?: string;
    updated_at?: string;
}

export interface Rescue {
    id: number;
    pet_id: number;
    pet_status_id: number;
    rescued_at: string;
    notes?: string;
    user_id?: number;
    pet?: Pet;
    pet_status?: PetStatus;
    user?: User;
    created_at?: string;
    updated_at?: string;
}

export interface Adoption {
    id: number;
    pet_id: number;
    person_id: number;
    requested_at: string;
    adoption_status_id: number;
    approved_at?: string;
    delivered_at?: string;
    notes?: string;
    document?: string;
    holds_pet?: boolean;
    user_id?: number;
    pet?: Pet;
    person?: Person;
    adoption_status?: AdoptionStatus;
    next_statuses?: AdoptionStep[];
    user?: User;
    created_at?: string;
    updated_at?: string;
}

export interface AdoptionStep {
    status: string;
    label: string;
    blocker: string | null;
}

export interface AdoptionFollowUp {
    id: number;
    adoption_id: number;
    followed_at: string;
    notes: string;
    user_id?: number;
    adoption?: Adoption;
    user?: User;
    created_at?: string;
    updated_at?: string;
}

export interface Contract {
    id: number;
    adoption_id: number;
    name: string;
    document_path?: string;
    user_id?: number;
    adoption?: Adoption;
    user?: User;
    created_at?: string;
    updated_at?: string;
}

