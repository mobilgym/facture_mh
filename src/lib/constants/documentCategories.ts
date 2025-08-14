import { Users, Calculator, Scale, Building2 } from 'lucide-react';

export const categories = [
  { id: 'rh', name: 'Ressources Humaines', icon: Users },
  { id: 'compta', name: 'Comptabilité', icon: Calculator },
  { id: 'juridique', name: 'Juridique', icon: Scale },
  { id: 'admin', name: 'Administration', icon: Building2 }
] as const;

export type DocumentCategory = typeof categories[number]['id'];