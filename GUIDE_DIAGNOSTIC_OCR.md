# 🔧 Guide Diagnostic OCR - Mode d'Emploi

## 🎯 Objectif

Ce guide vous explique **comment diagnostiquer précisément** pourquoi l'OCR ne détecte rien sur votre facture "Amandine LE GOAREGUER".

## 🚀 Étapes de Diagnostic

### **Étape 1 : Préparation**

1. **Ouvrez votre application** dans le navigateur
2. **Appuyez sur F12** pour ouvrir les outils développeur
3. **Cliquez sur l'onglet "Console"**

### **Étape 2 : Test d'Import Normal**

1. **Importez votre facture** normalement via l'interface
2. **Observez la console** pendant le processus
3. **Cherchez ces logs spécifiques :**

```
🔍 Démarrage de l'analyse automatique du document...
🤖 Initialisation du moteur OCR avancé...
OCR Progress: 10%... 20%... 100%
📝 Texte extrait par OCR (complet):
==================================================
[VOTRE TEXTE DOIT APPARAÎTRE ICI]
==================================================
✅ Analyse intelligente terminée: {...}
```

### **Étape 3 : Diagnostic Automatique**

Si l'étape 2 ne fonctionne pas, utilisez l'outil de diagnostic :

```javascript
// Dans la console F12, tapez ces commandes :

// 1. Vérifier que l'outil est disponible
console.log('Outil diagnostic:', typeof window.runQuickDiagnostic);

// 2. Aide pour récupérer votre fichier
window.diagnoseCurrentFile();

// 3. Récupérer le fichier (après import via interface)
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput?.files?.[0];

// 4. Lancer le diagnostic complet
if (file) {
  window.runQuickDiagnostic(file, 'purchase');
} else {
  console.log('❌ Aucun fichier trouvé - importez d\'abord via l\'interface');
}
```

## 📊 Interprétation des Résultats

### **Scénario 1 : Erreur d'Initialisation**
```
❌ Erreur initialisation OCR: [message]
```
**Cause :** Problème de connexion ou navigateur
**Solution :** Rechargez la page, vérifiez la connexion Internet

### **Scénario 2 : Fichier Non Valide**
```
❌ Erreur fichier: Fichier PDF corrompu ou invalide
```
**Cause :** PDF endommagé ou format non supporté
**Solution :** Réenregistrez le PDF ou utilisez un autre format

### **Scénario 3 : Extraction Échoue**
```
✅ Fichier valide
✅ Initialisation OCR réussie
❌ Erreur extraction: Aucun texte détecté
```
**Cause :** Qualité image insuffisante, texte non lisible
**Solution :** Améliorez la qualité du scan

### **Scénario 4 : Patterns Non Matchés**
```
✅ Extraction réussie
⚠️ Aucune entreprise détectée
⚠️ Aucune date détectée  
⚠️ Aucun montant détecté
```
**Cause :** Texte extrait mais patterns inadéquats
**Solution :** Ajustement des patterns nécessaire

### **Scénario 5 : Succès Partiel**
```
✅ Entreprise détectée: "Amandine LE GOAREGUER" (85%)
✅ Date détectée: 21/08/2025 (90%)
⚠️ Aucun montant détecté
```
**Cause :** Quelques données trouvées, d'autres non
**Solution :** Vérification patterns spécifiques

## 🔍 Logs Critiques à Chercher

### **Log 1 : Démarrage Analyse**
```
🔍 Démarrage de l'analyse automatique du document...
```
**Si absent :** L'analyse ne se lance pas
**Causes possibles :**
- Dialog fermé trop rapidement
- Erreur JavaScript bloquante
- Fichier non détecté

### **Log 2 : Texte Extrait**
```
📝 Texte extrait par OCR (complet):
==================================================
Amandine LE GOAREGUER
8 rue de la candoule
13460 Saintes Maries de la Mer
...
FACTURE SPORT SANTE
DATE : 21/08/2025
...
120,00 €
==================================================
```
**Si vide :** OCR ne lit pas le document
**Si absent :** Échec extraction complète

### **Log 3 : Résultats Extraction**
```
✅ Analyse intelligente terminée: {
  companyName: "Amandine LE GOAREGUER",
  date: 2025-08-21T00:00:00.000Z,
  amount: 120,
  fileName: "Ach_amandine_le_goareguer.pdf",
  confidence: { companyName: 85, date: 90, amount: 95 }
}
```
**Si tout null :** Patterns ne matchent pas
**Si présent :** Extraction réussie

### **Log 4 : Pré-remplissage Interface**
```
✅ Nom de fichier pré-rempli: Ach_amandine_le_goareguer.pdf
✅ Date pré-remplie: 2025-08-21
✅ Montant pré-rempli: 120
```
**Si absent :** Interface ne se met pas à jour

## 🛠️ Commandes de Debug Avancées

### **Test Patterns sur Texte Simulé**
```javascript
// Tester les patterns sur le texte de votre facture
window.testOCRPatterns();

// Simulation extraction complète
window.simulateFullExtraction();
```

### **Test Manuel avec Votre Fichier**
```javascript
// Analyse manuelle étape par étape
const analyzer = window.enhancedDocumentAnalyzer;

// Test direct sur votre fichier
analyzer.analyzeDocument(file, 'purchase', {
  onProgress: (progress, message) => {
    console.log(`${progress}% - ${message}`);
  }
}).then(results => {
  console.log('Résultats:', results);
}).catch(error => {
  console.error('Erreur:', error);
});
```

### **Inspection État React**
```javascript
// Vérifier l'état du composant FileImportDialog
const dialogs = document.querySelectorAll('[data-component="file-import-dialog"]');
console.log('Dialogs trouvés:', dialogs.length);

// État des variables React (si disponible)
console.log('État isAnalyzing:', window.isAnalyzing);
console.log('État hasAnalyzed:', window.hasAnalyzed);
console.log('État extractedData:', window.extractedData);
```

## 📋 Checklist de Diagnostic

### **✅ Vérifications de Base**
- [ ] Page chargée complètement ?
- [ ] Console F12 ouverte ?
- [ ] Connexion Internet active ?
- [ ] Fichier PDF valide ?

### **✅ Vérifications Avancées**
- [ ] Log "Démarrage analyse" présent ?
- [ ] Log "Texte extrait" avec contenu ?
- [ ] Log "Analyse terminée" avec données ?
- [ ] Log "Pré-remplissage" réussi ?

### **✅ Tests de Diagnostic**
- [ ] `window.diagnoseCurrentFile()` exécuté ?
- [ ] `window.runQuickDiagnostic(file, 'purchase')` testé ?
- [ ] Résultats du diagnostic analysés ?

## 🎯 Actions Selon Résultats

### **Si Aucun Log**
1. Recharger la page
2. Réimporter le fichier
3. Vérifier connexion Internet

### **Si Texte Vide**
1. Vérifier qualité du PDF
2. Tester avec un autre fichier
3. Vérifier format supporté

### **Si Patterns Non Matchés**
1. Copier le texte extrait
2. Me l'envoyer pour ajustement patterns
3. Test avec `window.testOCRPatterns()`

### **Si Interface Non Mise à Jour**
1. Vérifier erreurs JavaScript
2. Tester sur autre navigateur
3. Vider cache et recharger

## 📞 Que Me Communiquer

Pour que je puisse vous aider efficacement, envoyez-moi :

1. **Logs de la console** (copier/coller complet)
2. **Résultat de `window.runQuickDiagnostic(file)`**
3. **Le texte extrait** (entre les `===`)
4. **Type de navigateur** et version
5. **Message d'erreur** si présent

Avec ces informations, je pourrai **identifier précisément** le problème et le corriger ! 🎯
