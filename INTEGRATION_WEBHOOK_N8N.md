# 🔗 Intégration Webhook N8n pour l'Extraction de Documents

## 📋 Vue d'ensemble

Le système d'importation de factures utilise maintenant un **système de webhook N8n personnalisable** pour l'extraction automatique des données. Cette approche offre une flexibilité maximale en permettant à l'utilisateur de configurer son propre workflow d'extraction via N8n.

## 🔄 Changements Effectués

### 1. **Suppression des systèmes IA/OCR**
- ❌ **Supprimé** : `src/lib/services/ai/mistralAnalyzer.ts`
- ❌ **Supprimé** : `src/lib/services/ai/geminiAnalyzer.ts`
- ❌ **Supprimé** : `src/lib/services/ai/deepseekAnalyzer.ts`
- ❌ **Désinstallé** : Packages `@mistralai/mistralai`, `@google/generative-ai`
- ✅ **Conservé** : OCR Tesseract local pour fallback

### 2. **Nouveau Système Webhook N8n**
- ✅ **Ajouté** : `src/lib/services/webhook/n8nWebhookService.ts`
- ✅ **Ajouté** : `src/components/webhook/WebhookConfig.tsx`
- ✅ **Mis à jour** : `src/components/files/FileImportDialog.tsx`

## 🎯 **Architecture du Système Webhook**

### Service `N8nWebhookService`
```typescript
export class N8nWebhookService {
  async extractDataFromFile(file: File, documentType: 'achat' | 'vente'): Promise<WebhookExtractedData>
  updateConfig(config: WebhookConfiguration): void
  static loadConfig(): WebhookConfiguration
  async testConnection(): Promise<{success: boolean; message: string; responseTime: number}>
}
```

### Composant `WebhookConfig`
Interface complète de configuration permettant :
- **Activation/désactivation** du webhook
- **Configuration de l'URL** N8n
- **Méthode HTTP** (POST/PUT)
- **Headers personnalisés** (authentification, etc.)
- **Test de connexion** en temps réel
- **Sauvegarde persistante** dans localStorage

## 🚀 **Interface Utilisateur**

### 1. **Boutons dans FileImportDialog**
- **🔧 Bouton "Config"** : Ouvre la configuration webhook
- **🔗 Bouton "Webhook"** : Lance l'extraction (ou ouvre config si non configuré)
- **🧠 Bouton OCR** : OCR Tesseract local dans le champ nom de fichier

### 2. **États visuels intelligents**
- **Orange** : Webhook non configuré ("Activer")
- **Bleu-Vert** : Webhook configuré et prêt ("Webhook")
- **Animation** : Pendant l'extraction ("Extraction...")

### 3. **Progression en temps réel**
```
🔗 Extraction via webhook N8n...
├─ Préparation de l'envoi... (20%)
├─ Conversion du fichier... (50%)
├─ Envoi vers N8n... (90%)
└─ Traitement de la réponse... (100%)
```

## 🔧 **Configuration Webhook**

### Interface de Configuration
```typescript
interface WebhookConfiguration {
  url: string;                    // URL du workflow N8n
  method: 'POST' | 'PUT';        // Méthode HTTP
  headers: Record<string, string>; // Headers personnalisés
  enabled: boolean;               // Activation du webhook
}
```

### Exemple de Configuration
```json
{
  "url": "https://votre-n8n.com/webhook/extraction-facture",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-token",
    "X-API-Key": "your-api-key"
  },
  "enabled": true
}
```

### Test de Connexion
- **Vérification automatique** de l'URL
- **Mesure du temps de réponse**
- **Validation de l'accessibilité**

## 📡 **Format d'Échange avec N8n**

### Données Envoyées à N8n
```json
{
  "fileName": "facture_exemple.pdf",
  "fileSize": 2048576,
  "fileType": "application/pdf",
  "fileUrl": "https://0x0.st/HJ7f.pdf",
  "documentType": "achat",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "downloadExpiry": "2024-01-15T11:30:00.000Z"
}
```

**🎯 Nouveau Format avec URL de Téléchargement :**
- **`fileUrl`** : URL publique pour télécharger le fichier (au lieu de base64)
- **`downloadExpiry`** : Date d'expiration de l'URL de téléchargement
- **Avantages** : Plus léger, pas de limite de taille, meilleure performance

### Réponse Attendue de N8n
```json
{
  "success": true,
  "data": {
    "companyName": "Amandine LE GOAREGUER",
    "amount": 150.00,
    "date": "2024-01-15"
  },
  "message": "Extraction réussie"
}
```

### Génération Automatique du Nom de Fichier
- **Préfixe** : `Ach_` pour achat, `Vte_` pour vente
- **Nom entreprise** : Normalisé (minuscules, underscores)
- **Date** : Format YYYYMMDD
- **Exemple** : `Ach_amandine_le_goareguer_20240115.pdf`

## 🎯 **Workflow N8n Recommandé**

### Étapes Suggérées dans N8n
1. **Webhook Node** : Réception des données avec URL du fichier
2. **HTTP Request Node** : Téléchargement du fichier depuis l'URL
3. **Code Node** : Traitement du fichier téléchargé
4. **OCR/AI Node** : Extraction avec service externe
5. **Code Node** : Parse et structure des données
6. **Response Node** : Renvoi du JSON formaté avec headers CORS

### Exemple de Node HTTP Request dans N8n
```javascript
// Configuration du node HTTP Request
{
  "method": "GET",
  "url": "{{ $json.fileUrl }}",
  "responseFormat": "file",
  "downloadFileName": "{{ $json.fileName }}"
}
```

### Services Externes Compatibles
- **Google Vision API** : OCR avancé
- **AWS Textract** : Extraction de documents
- **Azure Document Intelligence** : Analyse de formulaires
- **Tesseract Online** : OCR libre
- **OpenAI Vision** : Analyse par IA

## 🛠️ **Utilisation**

### 1. **Configuration Initiale**
1. Cliquez sur le bouton **🔧 "Config"**
2. Entrez l'URL de votre workflow N8n
3. Configurez les headers si nécessaire
4. Testez la connexion
5. Activez le webhook

### 2. **Extraction de Données**
1. Importez votre fichier PDF
2. Choisissez "Achat" ou "Vente"
3. Cliquez sur **🔗 "Webhook"**
4. Observez la progression en temps réel
5. Les champs sont pré-remplis automatiquement

### 3. **Fallback OCR Local**
Si le webhook n'est pas disponible :
- Cliquez sur l'icône **🧠** dans le champ nom de fichier
- OCR Tesseract local s'exécute en fallback
- Extraction basique mais fonctionnelle

## 🔍 **Débogage**

## 📤 **Services de Stockage Temporaire**

L'application utilise automatiquement plusieurs services gratuits pour héberger temporairement vos fichiers :

### Services Utilisés (avec fallback automatique)
1. **0x0.st** : Service simple et rapide (24h d'expiration)
2. **tmpfiles.org** : Alternative fiable (1h d'expiration)  
3. **file.io** : Service avec contrôle des téléchargements
4. **Data URL** : Fallback en cas d'échec des services externes

### Avantages
- ✅ **Aucune configuration** requise
- ✅ **Fallback automatique** entre services
- ✅ **URLs publiques** accessibles par N8n
- ✅ **Expiration automatique** pour la sécurité
- ✅ **Pas de limite de taille** (contrairement au base64)

### Logs Détaillés
```javascript
// Dans la console du navigateur
📤 [TempStorage] Upload vers 0x0.st...
✅ [TempStorage] Upload 0x0.st réussi: https://0x0.st/HJ7f.pdf
🔗 [N8n Webhook] URL temporaire créée: https://0x0.st/HJ7f.pdf
🔗 [N8n Webhook] Fichier uploadé avec succès
🔗 [N8n Webhook] Envoi de la requête...
✅ Webhook - Nom de fichier pré-rempli: Ach_amandine_le_goareguer_20240115.pdf
```

### Gestion d'Erreurs
- **Erreur de connexion** : Vérification de l'URL et du réseau
- **Erreur 404/500** : Problème côté workflow N8n
- **Timeout** : Workflow trop lent, optimisation nécessaire
- **Format invalide** : Réponse JSON non conforme

### Test de Connectivité
- **Temps de réponse** : Affiché en millisecondes
- **Status HTTP** : Validation de l'accessibilité
- **Messages d'erreur** : Diagnostic précis des problèmes

## 🎉 **Avantages du Système Webhook**

### 1. **Flexibilité Maximale**
- **Votre propre workflow** : Contrôle total sur l'extraction
- **Services au choix** : Google, AWS, Azure, OpenAI, etc.
- **Configuration personnalisée** : Headers, authentification, etc.

### 2. **Performance Optimisée**
- **Pas de limitation API** : Votre quota, vos règles
- **Traitement serveur** : Puissance de calcul côté N8n
- **Cache possible** : Optimisation des workflows

### 3. **Sécurité Renforcée**
- **Données sur vos serveurs** : Contrôle de la confidentialité
- **Authentification personnalisée** : Tokens, API keys
- **Logs complets** : Traçabilité dans N8n

### 4. **Évolutivité**
- **Ajout de nouveaux types** : Extension facile du workflow
- **Amélioration continue** : Modification sans redéploiement
- **Intégration métier** : Connexion à vos systèmes existants

---

## 🧪 **Test Recommandé**

1. **Configurez votre workflow N8n** avec l'endpoint d'extraction
2. **Configurez le webhook** dans l'application
3. **Importez une facture** PDF
4. **Cliquez "Webhook"** et observez l'extraction
5. **Vérifiez le résultat** : nom de fichier + données pré-remplies

Le système webhook N8n offre maintenant une solution **flexible, performante et personnalisable** pour l'extraction automatique de données ! 🚀🔗
