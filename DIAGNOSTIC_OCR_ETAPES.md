# 🔍 Diagnostic OCR - Étapes Détaillées et Débogage

## 🎯 Processus Complet de l'OCR

Voici **exactement** ce qui se passe quand vous importez un fichier :

### **Étape 1️⃣ : Déclenchement (FileImportDialog.tsx)**
```typescript
// 🚀 Auto-démarrage 500ms après ouverture du dialog
useEffect(() => {
  if (isOpen && file && !isAnalyzing && !hasAnalyzed) {
    setTimeout(() => {
      analyzeDocument(); // ← POINT DE DÉPART
    }, 500);
  }
}, [isOpen, file]);
```

**✅ Vérifications :**
- Dialog ouvert ? 
- Fichier présent ?
- Analyse pas déjà en cours ?
- Analyse pas déjà faite ?

### **Étape 2️⃣ : Initialisation OCR (enhancedDocumentAnalyzer.ts)**
```typescript
// 🤖 Création du worker Tesseract.js
console.log('🔍 Début de l\'analyse intelligente du document...');

// Configuration avancée
this.worker = await Tesseract.createWorker(['fra', 'eng'], 1, {
  logger: m => {
    if (m.status === 'recognizing text') {
      console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
    }
  }
});

await this.worker.setParameters({
  tessedit_page_seg_mode: Tesseract.PSM.AUTO,
  tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
  tessedit_char_whitelist: '0-9A-Za-zÀ-ÿ€.,/()-:; ',
  preserve_interword_spaces: '1',
});
```

**🔍 Logs à chercher dans la console :**
```
🤖 Initialisation du moteur OCR avancé...
✅ Moteur OCR avancé initialisé avec succès
```

### **Étape 3️⃣ : Traitement du Fichier**

#### **Si PDF (votre cas) :**
```typescript
// 📄 Conversion PDF → Image haute qualité
if (file.type === 'application/pdf') {
  options?.onProgress?.(30, 'Conversion PDF haute qualité...');
  
  // Utilise PDF.js
  const pdfjsLib = await import('pdfjs-dist');
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  const page = await pdf.getPage(1); // Première page
  
  // Échelle 2x pour améliorer qualité OCR
  const scale = 2.0;
  const viewport = page.getViewport({ scale });
  
  // Rendu sur canvas
  await page.render({ canvasContext: context, viewport }).promise;
  
  // Post-traitement (contraste, seuillage)
  this.preprocessImageForOCR(imageData);
}
```

**🔍 Logs à chercher :**
```
📄 Conversion PDF en image haute résolution...
✅ PDF converti en image haute qualité
```

#### **Si Image JPG/PNG :**
```typescript
// 🖼️ Préprocessing image direct
const canvas = document.createElement('canvas');
// Redimensionnement + amélioration contraste
this.preprocessImageForOCR(imageData);
```

### **Étape 4️⃣ : Reconnaissance OCR**
```typescript
// 🔍 Analyse OCR avec Tesseract
const { data: { text, confidence } } = await this.worker.recognize(imageSource);

// Vérification texte non vide
if (!text || text.trim().length === 0) {
  throw new TextExtractionError('Aucun texte détecté dans le document');
}

// 📝 DEBUG : Affichage du texte complet
console.log('📝 Texte extrait par OCR (complet):');
console.log('='.repeat(50));
console.log(text); // ← TEXTE BRUT EXTRAIT
console.log('='.repeat(50));
```

**🔍 Logs critiques :**
```
OCR Progress: 100%
📄 Texte extrait par OCR (confiance: XX%):
==================================================
[VOTRE TEXTE ICI - SI VIDE = PROBLÈME]
==================================================
```

### **Étape 5️⃣ : Extraction des Données**

#### **Nom d'Entreprise :**
```typescript
// 🏢 Test des patterns successifs
const companyPatterns = [
  /^([A-Z][A-Za-z\s\-\.]{3,40})\s*$/gm,           // Début document
  /([A-Z][a-z]+\s+[A-Z]{2,}\s+[A-Z][A-Z\s]{2,})/g, // "Amandine LE GOAREGUER"
  /([A-Z][A-Za-z\s&\-\.]{2,50})\s+(SARL|SAS|SA)\b/gi, // Forme juridique
];

// Test chaque pattern
for (const pattern of companyPatterns) {
  const matches = [...text.matchAll(pattern)];
  // Calcul de confiance pour chaque match
}
```

#### **Date :**
```typescript
// 📅 Test patterns dates
const datePatterns = [
  /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,     // DD/MM/YYYY
  /DATE\s*:\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi, // "DATE : 21/08/2025"
];
```

#### **Montant :**
```typescript
// 💰 Test patterns montants
const amountPatterns = [
  /(\d+,\d{2})\s*€/g,                               // "120,00 €"
  /(?:total|montant)\s*:?\s*(\d+[,.]?\d*)\s*€?/gi, // Total: 120€
];
```

### **Étape 6️⃣ : Génération Résultats**
```typescript
// 📁 Génération nom de fichier
const fileName = this.generateFileName(companyResult?.name, documentType);

// 📊 Construction objet résultat
const results: ExtractedDocumentData = {
  companyName: companyResult?.name,    // ← null si non trouvé
  date: dateResult?.date,              // ← null si non trouvé  
  amount: amountResult?.amount,        // ← null si non trouvé
  fileName,                           // ← "Ach_document.pdf" si rien
  confidence: {
    companyName: companyResult?.confidence || 0,
    date: dateResult?.confidence || 0,
    amount: amountResult?.confidence || 0
  }
};

console.log('✅ Analyse intelligente terminée:', results);
```

### **Étape 7️⃣ : Pré-remplissage Interface**
```typescript
// ✏️ Mise à jour des champs du formulaire
if (results.fileName) {
  setFileName(results.fileName);      // ← Devrait changer "Ach_.pdf"
  console.log('✅ Nom de fichier pré-rempli:', results.fileName);
}

if (results.date) {
  setDate(results.date);
  console.log('✅ Date pré-remplie:', results.date);
}

if (results.amount) {
  setAmount(results.amount.toString());
  console.log('✅ Montant pré-rempli:', results.amount);
}
```

## 🚨 Points de Blocage Possibles

### **1. OCR ne démarre pas**
**Symptômes :** Aucun log dans la console
**Causes :**
- Connexion Internet (téléchargement modèles Tesseract)
- Erreur JavaScript bloquante
- Worker OCR non supporté par le navigateur

### **2. Conversion PDF échoue**
**Symptômes :** Error "Erreur lors de la conversion PDF"
**Causes :**
- PDF corrompu ou protégé
- PDF.js non chargé correctement
- Mémoire insuffisante

### **3. OCR retourne texte vide**
**Symptômes :** Log "Aucun texte détecté dans le document"
**Causes :**
- Image trop floue ou de mauvaise qualité
- Contraste insuffisant
- Texte manuscrit (non supporté)
- Document scanné à l'envers

### **4. Patterns ne matchent pas**
**Symptômes :** Texte extrait visible mais aucune donnée détectée
**Causes :**
- Format de texte non prévu dans les patterns
- Caractères spéciaux ou accents mal reconnus
- Mise en page inhabituelle

### **5. Interface ne se met pas à jour**
**Symptômes :** Données extraites mais champs non pré-remplis
**Causes :**
- Erreur React dans setFileName/setDate/setAmount
- extractedData null malgré extraction réussie
- État React non synchronisé

## 🛠️ Outils de Diagnostic

### **1. Console Développeur (F12)**
```javascript
// Activer tous les logs OCR
localStorage.setItem('debug-ocr', 'true');

// Vérifier l'état du worker
console.log('Worker OCR:', window.enhancedDocumentAnalyzer?.worker);

// Forcer une analyse
if (window.enhancedDocumentAnalyzer) {
  window.enhancedDocumentAnalyzer.analyzeDocument(file, 'purchase');
}
```

### **2. Test des Patterns**
```javascript
// Tester patterns sur texte simulé
window.testOCRPatterns();

// Simulation extraction complète
window.simulateFullExtraction();
```

### **3. Inspection Étape par Étape**
```javascript
// Vérifier chaque étape
console.log('1. Dialog ouvert:', isOpen);
console.log('2. Fichier présent:', !!file);
console.log('3. Analyse en cours:', isAnalyzing);
console.log('4. Déjà analysé:', hasAnalyzed);
console.log('5. Données extraites:', extractedData);
```

## 🔬 Diagnostic Spécifique Votre Problème

D'après l'image, **le nom reste "Ach_.pdf"** ce qui signifie :

### **Hypothèse 1 : OCR ne démarre pas**
**Test :** Ouvrez F12 → Console, cherchez :
```
🔍 Démarrage de l'analyse automatique du document...
🤖 Initialisation du moteur OCR avancé...
```
**Si absent :** Problème au démarrage de l'analyse

### **Hypothèse 2 : Texte non extrait**
**Test :** Cherchez dans la console :
```
📝 Texte extrait par OCR (complet):
==================================================
[DOIT CONTENIR LE TEXTE DE VOTRE FACTURE]
==================================================
```
**Si vide/absent :** Problème d'extraction OCR

### **Hypothèse 3 : Patterns non matchés**
**Test :** Si texte présent mais pas de données, cherchez :
```
✅ Analyse intelligente terminée: {
  companyName: null,
  date: null, 
  amount: null,
  fileName: "Ach_document.pdf"
}
```
**Si tout null :** Problème de patterns

### **Hypothèse 4 : Interface non mise à jour**
**Test :** Si données présentes mais interface non mise à jour :
```
✅ Nom de fichier pré-rempli: Ach_amandine_le_goareguer.pdf
✅ Date pré-remplie: [Date]
✅ Montant pré-rempli: 120
```
**Si absent :** Problème React

## 🎯 Action Immédiate

**Ouvrez F12 → Console** et cherchez ces logs pendant l'import de votre facture. Dites-moi exactement ce que vous voyez ! 

Cela m'aidera à identifier **précisément** où le processus se bloque. 🔍
