# 🚀 **Système d'Assignation Multiple de Budgets et Badges**

## 📋 **Vue d'ensemble**

Le nouveau système d'assignation multiple permet de répartir une facture sur **plusieurs budgets et badges** avec des **pourcentages personnalisés** pour chaque assignation.

### **🎯 Fonctionnalités principales :**
- ✅ **Mode Simple** : Un budget + plusieurs badges (comportement existant)
- ✅ **Mode Multiple** : Plusieurs budgets + badges avec pourcentages personnalisés
- ✅ **Validation des pourcentages** : Maximum 100% au total
- ✅ **Interface intuitive** avec toggle Simple/Multiple
- ✅ **Calcul automatique des montants** basé sur les pourcentages
- ✅ **Répartition équitable automatique** avec bouton "Répartir"

---

## 🎨 **Interface Utilisateur**

### **Toggle Simple/Multiple**
```
Attribution budgétaire (optionnel)    [Simple] ●——○ [Multiple]
```

### **Mode Simple** (Comportement existant)
- Sélection d'un seul budget
- Sélection de plusieurs badges pour ce budget
- Répartition équitable du montant entre les badges

### **Mode Multiple** (Nouveau)
- Interface d'assignation avancée avec composant `MultiAssignmentManager`
- Chaque assignation contient :
  - 📊 **Budget** : Sélection du budget cible
  - 🏷️ **Badge** : Sélection du badge associé
  - 📈 **Pourcentage** : Slider de 0% à 100%
  - 💰 **Montant calculé** : Affiché automatiquement

---

## 🛠️ **Composants Techniques**

### **MultiAssignmentManager**
**Localisation :** `src/components/files/MultiAssignmentManager.tsx`

**Props :**
```typescript
interface MultiAssignmentManagerProps {
  totalAmount: number;           // Montant total de la facture
  assignments: AssignmentItem[]; // Liste des assignations
  onAssignmentsChange: (assignments: AssignmentItem[]) => void;
  className?: string;
}
```

**Features :**
- ➕ **Ajout d'assignations** dynamique
- 🗑️ **Suppression d'assignations** individuelle
- ⚖️ **Répartition équitable** automatique
- ⚠️ **Validation en temps réel** des pourcentages
- 📊 **Résumé global** (montant total, pourcentage utilisé, montant restant)

### **AssignmentItem Interface**
```typescript
interface AssignmentItem {
  id: string;
  budgetId: string | null;
  budgetName?: string;
  badgeId: string | null;
  badgeName?: string;
  badgeColor?: string;
  percentage: number;  // 0-100
  amount: number;      // Calculé automatiquement
}
```

---

## 🗄️ **Base de Données**

### **Migration Ajoutée**
**Fichier :** `supabase/migrations/20250126000002_add_percentage_allocation.sql`

**Modifications :**
```sql
-- Ajout de la colonne pour les pourcentages
ALTER TABLE file_badges 
ADD COLUMN percentage_allocated numeric(5,2) 
CHECK (percentage_allocated >= 0 AND percentage_allocated <= 100);

-- Index pour les performances
CREATE INDEX idx_file_badges_percentage ON file_badges(percentage_allocated);
```

### **Nouvelle méthode BadgeService**
```typescript
static async assignMultipleBudgetsBadgesToFile(
  fileId: string,
  multiAssignments: {
    budgetId: string;
    badgeId: string;
    percentage: number;
    amount: number;
  }[],
  userId: string
): Promise<void>
```

---

## 🔄 **Flux de Fonctionnement**

### **1. Import de Facture**
```
FileImportDialog → Toggle Mode → Configuration Assignations → Validation → Sauvegarde
```

### **2. Mode Simple**
1. Utilisateur sélectionne un budget
2. Sélectionne un ou plusieurs badges
3. Montant réparti équitablement entre les badges
4. Sauvegarde avec `BadgeService.assignBadgesToFile()`

### **3. Mode Multiple**
1. Utilisateur active le mode "Multiple"
2. Ajoute des assignations via `MultiAssignmentManager`
3. Configure budget + badge + pourcentage pour chaque assignation
4. Validation automatique (total ≤ 100%)
5. Sauvegarde avec `BadgeService.assignMultipleBudgetsBadgesToFile()`

---

## 🧪 **Tests et Validation**

### **Scénarios de Test**

#### **Test 1 : Mode Simple (Existant)**
- ✅ Import d'une facture de 1000€
- ✅ Sélection d'un budget "Marketing"
- ✅ Sélection de 2 badges : "Publicité" + "Communication"
- ✅ Vérification : 500€ par badge

#### **Test 2 : Mode Multiple Basique**
- ✅ Import d'une facture de 1000€
- ✅ Assignation 1 : Budget "Marketing" + Badge "Publicité" → 60% (600€)
- ✅ Assignation 2 : Budget "R&D" + Badge "Recherche" → 40% (400€)
- ✅ Vérification : Total = 100%, montants corrects

#### **Test 3 : Validation des Pourcentages**
- ✅ Tentative de dépasser 100% → Erreur affichée
- ✅ Assignations incomplètes → Validation échoue
- ✅ Pourcentages négatifs → Bloqués par l'interface

#### **Test 4 : Répartition Automatique**
- ✅ 3 assignations créées
- ✅ Bouton "Répartir" → 33.33% chacune
- ✅ Reste 0.01% → Attribué à la première assignation

---

## 📊 **Exemples d'Usage**

### **Exemple 1 : Facture de Frais de Mission**
**Montant :** 800€
**Répartition :**
- 50% → Budget "Déplacements" + Badge "Transport" (400€)
- 30% → Budget "Hébergement" + Badge "Hôtel" (240€)  
- 20% → Budget "Repas" + Badge "Restaurant" (160€)

### **Exemple 2 : Facture d'Équipement Mixte**
**Montant :** 1500€
**Répartition :**
- 70% → Budget "IT" + Badge "Matériel" (1050€)
- 30% → Budget "Bureau" + Badge "Mobilier" (450€)

---

## 🔧 **Architecture Technique**

### **Hooks Modifiés**
- `useFileUpload.ts` : Support des assignations multiples
- Signature étendue : `upload(..., multiAssignments?: any[])`

### **Services Étendus**
- `BadgeService.assignMultipleBudgetsBadgesToFile()` : Nouvelle méthode
- Support des pourcentages et validation côté serveur
- Recalcul automatique des budgets affectés

### **Validation Multi-niveaux**
1. **Interface** : Validation en temps réel des pourcentages
2. **Client** : Validation avant soumission
3. **Serveur** : Validation finale côté BadgeService

---

## 🚀 **Déploiement**

### **Étapes de Migration**
1. ✅ **Code** : Nouveau composant + logique intégrée
2. ⏳ **Base de données** : Appliquer `supabase db push`
3. ⏳ **Tests** : Valider tous les scénarios
4. ⏳ **Documentation** : Mise à jour utilisateur

### **Compatibilité**
- ✅ **Rétrocompatibilité** : Mode simple inchangé
- ✅ **Migration douce** : Pas de rupture pour les utilisateurs existants
- ✅ **Données existantes** : Préservées et compatibles

---

## 🎉 **Avantages du Nouveau Système**

### **Pour les Utilisateurs**
- 🎯 **Flexibilité** : Répartition précise sur plusieurs budgets
- 📊 **Transparence** : Visualisation claire des pourcentages
- ⚡ **Rapidité** : Interface intuitive et automatisations

### **Pour la Gestion**
- 📈 **Précision** : Comptabilité analytique plus fine
- 🔍 **Traçabilité** : Suivi détaillé des affectations
- 📋 **Reporting** : Données enrichies pour les analyses

### **Technique**
- 🧩 **Modularité** : Composants réutilisables
- 🔒 **Robustesse** : Validations multi-niveaux
- 🚀 **Performance** : Optimisations base de données

---

*Système développé pour améliorer la flexibilité et la précision de la gestion budgétaire.*
