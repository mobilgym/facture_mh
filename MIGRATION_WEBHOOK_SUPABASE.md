# Migration Webhook vers Supabase

## 🎯 **Objectif**

Migrer le système de configuration des webhooks N8n du `localStorage` vers Supabase pour permettre le partage de configuration entre tous les utilisateurs de la même entreprise.

## 📊 **Changements Effectués**

### **1. Base de Données**

#### **Nouvelle Table `webhook_configurations`**
```sql
CREATE TABLE webhook_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  webhook_url text NOT NULL,
  http_method text NOT NULL DEFAULT 'POST' CHECK (http_method IN ('POST', 'PUT')),
  headers jsonb DEFAULT '{"Content-Type": "application/json"}'::jsonb,
  is_enabled boolean DEFAULT false,
  description text,
  last_tested_at timestamptz,
  last_test_success boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  updated_by uuid REFERENCES auth.users(id)
);
```

#### **Contraintes et Sécurité**
- ✅ **RLS activé** avec politiques basées sur l'entreprise
- ✅ **Une seule configuration active** par entreprise
- ✅ **Suivi des tests** de connexion avec horodatage
- ✅ **Traçabilité** des créations et modifications

### **2. Services TypeScript**

#### **Nouveau Service `WebhookConfigService`**
- `getActiveConfiguration()` : Récupérer la config active
- `getAllConfigurations()` : Lister toutes les configs d'une entreprise
- `saveConfiguration()` : Créer une nouvelle configuration
- `updateConfiguration()` : Mettre à jour une configuration existante
- `deleteConfiguration()` : Supprimer une configuration
- `recordTestResult()` : Enregistrer le résultat des tests
- `upsertConfiguration()` : Créer ou mettre à jour (pour simplifier)

#### **Service `N8nWebhookService` Refactorisé**
- ✅ **Méthodes async** pour charger depuis Supabase
- ✅ **Fallback localStorage** pour migration douce
- ✅ **Context utilisateur** (companyId, userId) requis
- ✅ **Enregistrement des tests** dans la base de données

### **3. Composants React**

#### **`WebhookConfig.tsx` Modernisé**
- ✅ **Chargement depuis Supabase** au lieu de localStorage
- ✅ **Sauvegarde en temps réel** dans la base de données
- ✅ **États de chargement** et indicateurs visuels
- ✅ **Gestion d'erreurs** améliorée
- ✅ **Context utilisateur** avec `useAuth()` et `useCompany()`

#### **`FileImportDialog.tsx` Mis à Jour**
- ✅ **Service webhook dynamique** créé avec le contexte utilisateur
- ✅ **Chargement de configuration** depuis Supabase
- ✅ **Vérification des permissions** avant extraction

## 🔧 **Instructions de Déploiement**

### **Étape 1 : Appliquer la Migration**
```bash
# Placer le fichier de migration
cp supabase/migrations/20250126000000_create_webhook_configurations.sql

# Appliquer les changements
supabase db push
```

### **Étape 2 : Vérifier la Base de Données**
```sql
-- Vérifier que la table est créée
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'webhook_configurations';

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'webhook_configurations';
```

### **Étape 3 : Tester la Configuration**

1. **Ouvrir l'application** et aller dans l'import de fichiers
2. **Cliquer "Config"** pour configurer le webhook
3. **Sauvegarder une URL** de test
4. **Tester la connexion** 
5. **Vérifier dans Supabase** que la configuration est sauvegardée :

```sql
SELECT * FROM webhook_configurations WHERE company_id = 'your-company-id';
```

## 📋 **Avantages de la Migration**

### **✅ Avant (localStorage)**
- ❌ Configuration locale au navigateur
- ❌ Pas de partage entre utilisateurs
- ❌ Perte de config en cas de suppression du cache
- ❌ Pas d'historique des tests

### **✅ Après (Supabase)**
- ✅ **Configuration partagée** entre tous les utilisateurs de l'entreprise
- ✅ **Sauvegarde permanente** et sécurisée
- ✅ **Historique des tests** de connexion
- ✅ **Traçabilité** des modifications
- ✅ **Politiques de sécurité** RLS
- ✅ **Migration douce** avec fallback localStorage

## 🔄 **Migration Automatique**

Le système inclut une **migration douce** :
- Les configurations localStorage existantes sont **conservées comme fallback**
- Première sauvegarde dans Supabase → **migration automatique**
- Nouvelles configurations → **directement dans Supabase**

## 🚨 **Points d'Attention**

### **Prérequis**
- ✅ Utilisateur connecté (`user.id`)
- ✅ Entreprise sélectionnée (`currentCompany.id`)
- ✅ Permissions RLS correctes

### **Gestion d'Erreurs**
- **Réseau hors ligne** : Fallback localStorage temporaire
- **Permissions manquantes** : Message d'erreur explicite
- **Configuration corrompue** : Réinitialisation aux valeurs par défaut

## 🧪 **Tests Recommandés**

1. **Test Multi-Utilisateurs**
   - Configurer un webhook avec l'utilisateur A
   - Vérifier que l'utilisateur B (même entreprise) voit la configuration

2. **Test de Persistance**
   - Configurer un webhook
   - Fermer/rouvrir l'application
   - Vérifier que la configuration est maintenue

3. **Test de Migration**
   - Avoir une config localStorage existante
   - Faire une modification
   - Vérifier que la config est migrée vers Supabase

4. **Test de Sécurité**
   - Essayer d'accéder aux configs d'une autre entreprise
   - Vérifier que les politiques RLS bloquent l'accès

## 📈 **Monitoring**

### **Logs à Surveiller**
```
🔗 [Webhook] Configuration chargée depuis Supabase
✅ [WebhookConfig] Configuration sauvegardée
🔗 [Webhook] Configuration legacy chargée depuis localStorage
❌ [Webhook] Erreur lors du chargement depuis Supabase
```

### **Métriques Supabase**
- Nombre de configurations par entreprise
- Fréquence des tests de connexion
- Taux de succès des webhooks

## 🎉 **Migration Terminée !**

La configuration des webhooks N8n est maintenant **partagée au niveau de l'entreprise** et **sauvegardée de manière sécurisée** dans Supabase.

Les utilisateurs peuvent maintenant :
- ✅ **Partager** la même configuration webhook
- ✅ **Collaborer** sur la configuration N8n
- ✅ **Tracer** les modifications et tests
- ✅ **Récupérer** leur configuration sur n'importe quel appareil
