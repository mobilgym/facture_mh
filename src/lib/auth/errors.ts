import { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'User already registered':
      return 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.';
    case 'Invalid login credentials':
      return 'Email ou mot de passe incorrect';
    case 'Email not confirmed':
      return 'Veuillez confirmer votre email avant de vous connecter';
    case 'Password should be at least 6 characters':
      return 'Le mot de passe doit contenir au moins 6 caractères';
    default:
      return 'Une erreur est survenue. Veuillez réessayer.';
  }
}