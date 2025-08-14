import { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Email ou mot de passe incorrect';
    case 'Email not confirmed':
      return 'Veuillez confirmer votre email avant de vous connecter';
    case 'User already registered':
      return 'Un compte existe déjà avec cet email';
    case 'Password should be at least 6 characters':
      return 'Le mot de passe doit contenir au moins 6 caractères';
    default:
      return error.message;
  }
}