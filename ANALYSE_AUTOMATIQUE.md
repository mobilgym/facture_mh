# 🧠 Analyse Automatique de Documents

Cette fonctionnalité utilise l'intelligence artificielle pour analyser automatiquement vos factures et pré-remplir les champs lors de l'import.

## ✨ Fonctionnalités

### 🔍 Analyse Intelligente
- **OCR Avancé** : Reconnaissance optique de caractères en français
- **Extraction d'informations** : Détection automatique des données clés
- **Pré-remplissage intelligent** : Champs complétés automatiquement
- **Validation humaine** : Possibilité de modifier les informations extraites

### 📊 Données Extraites

#### 🏢 Nom d'Entreprise
- Détection des raisons sociales (SARL, SAS, SA, etc.)
- Reconnaissance des marques connues
- Analyse contextuelle pour identifier le fournisseur/client

#### 📅 Date du Document
- Formats français : "15 janvier 2024", "15/01/2024"
- Formats internationaux : "2024-01-15"
- Priorisation des dates de facture vs autres dates

#### 💰 Montant
- **Priorité 1** : Total TTC, Net à payer
- **Priorité 2** : Total, Montant total
- **Priorité 3** : Autres montants avec €
- Gestion des formats français (virgule décimale)

#### 📝 Nom de Fichier
- **Achat** : `Ach_[entreprise].pdf` (ex: `Ach_mcdo.pdf`)
- **Vente** : `Vte_[entreprise].pdf` (ex: `Vte_client.pdf`)
- Conservation automatique du préfixe selon le type

## 🎯 Processus d'Analyse

### 1. Déclenchement Automatique
```
Sélection fichier → Type (Achat/Vente) → Analyse AUTO → Pré-remplissage
```

### 2. Étapes de Traitement
1. **Initialisation** : Démarrage du moteur OCR
2. **Conversion** : PDF → Image (si nécessaire)
3. **OCR** : Extraction du texte
4. **Analyse** : Recherche des informations
5. **Validation** : Vérification de cohérence
6. **Pré-remplissage** : Application aux champs

### 3. Interface Utilisateur
- **Indicateur visuel** : Icône cerveau et progression
- **Messages informatifs** : Statut en temps réel
- **Résumé des résultats** : Affichage des données détectées
- **Modification libre** : Tous les champs restent éditables

## 🔧 Configuration Avancée

### Types de Documents Supportés
- **PDF** : Traitement direct
- **Images** : JPEG, PNG (conversion automatique en PDF)
- **Taille maximale** : 50 MB

### Optimisations par Type

#### 📥 Factures d'Achat
- Priorité aux montants TTC et "Net à payer"
- Recherche du fournisseur/magasin
- Mots-clés : "facture", "ticket", "reçu"

#### 📤 Factures de Vente
- Priorité aux montants HT/TTC facturés
- Recherche du client/destinataire
- Mots-clés : "devis", "commande", "facture de vente"

## 🚀 Bonnes Pratiques

### Pour une Meilleure Précision
1. **Qualité du document** : Éviter les images floues ou mal éclairées
2. **Orientation correcte** : Document droit, non inversé
3. **Résolution suffisante** : Minimum 300 DPI pour les scans
4. **Contraste élevé** : Texte noir sur fond blanc idéal

### Cas d'Usage Optimaux
- ✅ Factures standards avec texte clair
- ✅ Documents structurés (en-tête, montants alignés)
- ✅ Formats français courants
- ⚠️ Documents manuscrits (précision limitée)
- ⚠️ Factures très complexes ou artistiques

## 🔧 Gestion d'Erreurs

### Système de Retry Automatique
- **3 tentatives maximum** en cas d'échec
- **Délai progressif** entre les tentatives
- **Fallback gracieux** : continue sans analyse si impossible

### Messages d'Erreur Conviviaux
- Explications claires des problèmes
- Suggestions d'actions correctives
- Possibilité de continuer manuellement

### Types d'Erreurs Gérées
1. **Initialisation OCR** : Redémarrage automatique
2. **Conversion PDF** : Tentative alternative
3. **Extraction texte** : Analyse partielle
4. **Réseau** : Nouvelle tentative
5. **Mémoire** : Réduction de qualité

## 📈 Indicateurs de Confiance

### Système de Scoring
- **90-100%** : Très fiable (vert foncé)
- **70-89%** : Fiable (vert)
- **50-69%** : Modéré (orange)
- **30-49%** : Faible (rouge clair)
- **0-29%** : Très faible (rouge)

### Facteurs d'Amélioration
- Position dans le document (en-tête = plus fiable)
- Présence de mots-clés contextuels
- Format reconnu (dates, montants)
- Cohérence avec le type de document

## 🛠️ Développement

### Architecture Technique
```
DocumentAnalyzer
├── OCR Engine (Tesseract.js)
├── Pattern Recognition
├── Error Handling
└── Configuration System
```

### Services Impliqués
- `documentAnalyzer.ts` : Moteur principal
- `documentAnalysisError.ts` : Gestion d'erreurs
- `analysisConfig.ts` : Configuration adaptative

### Performance
- **Temps moyen** : 10-30 secondes selon la complexité
- **Mémoire** : Optimisée pour les gros fichiers
- **Cache** : Worker OCR réutilisé entre analyses

## 🎯 Roadmap

### Améliorations Prévues
- [ ] Support de nouvelles langues
- [ ] Machine Learning pour améliorer la précision
- [ ] Templates pour formats spécifiques
- [ ] API externe pour OCR avancé
- [ ] Analytics sur la précision

### Contributions
Les retours utilisateurs permettent d'améliorer continuellement la précision du système. Signalez les cas où l'analyse pourrait être améliorée !

---

*Cette fonctionnalité est en amélioration continue. Les résultats peuvent varier selon la qualité et le format des documents.*
