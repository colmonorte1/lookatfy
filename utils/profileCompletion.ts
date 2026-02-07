// Utility functions to calculate profile completion percentage

interface UserProfile {
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
}

interface ExpertProfile {
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  title?: string | null;
  bio?: string | null;
  languages?: Array<{ name: string; level: string }> | null;
  skills?: Array<{ name: string; level: string }> | null;
}

export interface ProfileField {
  label: string;
  completed: boolean;
}

export interface ProfileCompletionResult {
  percentage: number;
  completed: number;
  total: number;
  missingFields: string[];
}

/**
 * Calculate user profile completion percentage
 */
export function calculateUserProfileCompletion(profile: UserProfile): ProfileCompletionResult {
  const fields: ProfileField[] = [
    { label: 'Foto de perfil', completed: !!profile.avatar_url },
    { label: 'Nombre', completed: !!profile.first_name?.trim() },
    { label: 'Apellidos', completed: !!profile.last_name?.trim() },
    { label: 'Teléfono', completed: !!profile.phone?.trim() },
    { label: 'País', completed: !!profile.country?.trim() },
    { label: 'Ciudad', completed: !!profile.city?.trim() },
    { label: 'Zona horaria', completed: !!profile.timezone },
  ];

  const completed = fields.filter(f => f.completed).length;
  const total = fields.length;
  const percentage = Math.round((completed / total) * 100);
  const missingFields = fields.filter(f => !f.completed).map(f => f.label);

  return { percentage, completed, total, missingFields };
}

/**
 * Calculate expert profile completion percentage
 */
export function calculateExpertProfileCompletion(
  profile: UserProfile,
  expert: ExpertProfile | null
): ProfileCompletionResult {
  const fields: ProfileField[] = [
    { label: 'Foto de perfil', completed: !!profile.avatar_url },
    { label: 'Nombre', completed: !!profile.first_name?.trim() },
    { label: 'Apellidos', completed: !!profile.last_name?.trim() },
    { label: 'Profesión/Título', completed: !!expert?.title?.trim() },
    { label: 'Biografía (min 100 caracteres)', completed: !!expert?.bio?.trim() && expert.bio.length >= 100 },
    { label: 'Teléfono', completed: !!expert?.phone?.trim() },
    { label: 'País', completed: !!expert?.country?.trim() },
    { label: 'Ciudad', completed: !!expert?.city?.trim() },
    { label: 'Zona horaria', completed: !!expert?.timezone },
    { label: 'Idiomas (min 1)', completed: Array.isArray(expert?.languages) && expert.languages.length >= 1 },
    { label: 'Habilidades (min 1)', completed: Array.isArray(expert?.skills) && expert.skills.length >= 1 },
  ];

  const completed = fields.filter(f => f.completed).length;
  const total = fields.length;
  const percentage = Math.round((completed / total) * 100);
  const missingFields = fields.filter(f => !f.completed).map(f => f.label);

  return { percentage, completed, total, missingFields };
}

/**
 * Check if profile is complete
 */
export function isProfileComplete(percentage: number): boolean {
  return percentage === 100;
}
