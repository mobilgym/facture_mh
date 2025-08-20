export interface Badge {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface BadgeWithStats extends Badge {
  total_amount: number;
  expenses_count: number;
  percentage_of_total: number;
  files_count: number; // Nombre de fichiers/factures avec ce badge
}

export interface BudgetBadge {
  id: string;
  budget_id: string;
  badge_id: string;
  created_at: string;
  created_by: string;
  badge?: Badge; // Relation optionnelle
}

export interface FileBadge {
  id: string;
  file_id: string;
  badge_id: string;
  amount_allocated?: number; // Montant alloué à ce badge
  created_at: string;
  created_by: string;
  badge?: Badge; // Relation optionnelle
}

// Formulaires
export interface CreateBadgeForm {
  name: string;
  description?: string;
  color: string;
  icon?: string;
}

export interface UpdateBadgeForm extends Partial<CreateBadgeForm> {
  is_active?: boolean;
}

// Analyse et statistiques
export interface BadgeAnalysis {
  badge: Badge;
  total_amount: number;
  files_count: number;
  percentage_of_budget: number;
  files: {
    id: string;
    name: string;
    amount: number;
    document_date: string;
    url: string;
  }[];
}

export interface BadgeFilter {
  budgetId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

// Couleurs prédéfinies pour les badges
export const BADGE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald  
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
] as const;

export type BadgeColor = typeof BADGE_COLORS[number];

// Icons prédéfinis pour les badges
export const BADGE_ICONS = [
  'tag',
  'star',
  'heart',
  'lightning',
  'fire',
  'shield',
  'trophy',
  'gem',
  'crown',
  'rocket',
] as const;

export type BadgeIcon = typeof BADGE_ICONS[number];
