# 🔧 Guide Configuration N8n avec CORS

## 🚨 Problème Détecté : Erreur CORS

L'erreur CORS empêche votre application d'envoyer des fichiers vers N8n. Voici comment la résoudre :

```
Access to fetch at 'https://mghv13.app.n8n.cloud/webhook-test/...' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header 
is present on the requested resource.
```

## ✅ Solution : Configuration CORS dans N8n

### 1. **Ouvrez votre Workflow N8n**

Allez dans votre workflow N8n : `https://mghv13.app.n8n.cloud/workflow/...`

### 2. **Modifiez le Node "Respond to Webhook"**

Dans votre node de réponse, ajoutez les **Response Headers** suivants :

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400"
}
```

### 3. **Configuration Détaillée du Node Webhook**

#### **Node "Webhook" (Trigger)**
- **HTTP Method** : `POST`
- **Path** : `/webhook-test/6459658d-30b1-47ef-8c5e-2d1b51`
- **Response Mode** : `Respond to Webhook`

#### **Node "Respond to Webhook"**
```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  },
  "body": {
    "success": true,
    "data": {
      "companyName": "Entreprise Test",
      "amount": 150.00,
      "date": "2024-01-15"
    },
    "message": "Extraction réussie"
  }
}
```

### 4. **Workflow N8n Recommandé**

```
[Webhook Trigger] 
    ↓
[Function: Process File] (optionnel)
    ↓ 
[Function: Extract Data] (votre logique d'extraction)
    ↓
[Respond to Webhook] (avec headers CORS)
```

### 5. **Node Function pour le Traitement (Exemple)**

```javascript
// Node Function - Process Uploaded File
const fileData = items[0].json.fileData;
const fileName = items[0].json.fileName;
const documentType = items[0].json.documentType;

// Ici vous pouvez :
// 1. Décoder le base64
// 2. Appeler un service OCR (Google Vision, AWS Textract, etc.)
// 3. Parser les données
// 4. Retourner le résultat structuré

// Exemple de retour simulé :
return [
  {
    json: {
      success: true,
      data: {
        companyName: "Amandine LE GOAREGUER",
        amount: 150.00,
        date: "2024-01-15"
      },
      message: "Extraction réussie"
    }
  }
];
```

## 🧪 **Test de la Configuration**

### 1. **Sauvegardez votre workflow N8n**
### 2. **Dans l'application, cliquez "Tester" dans la configuration webhook**
### 3. **Vérifiez que le test passe** ✅

## 🔗 **URL de Webhook Correcte**

Assurez-vous que votre URL est au bon format :
```
https://mghv13.app.n8n.cloud/webhook-test/6459658d-30b1-47ef-8c5e-2d1b51
```

## 🎯 **Format de Données Envoyées par l'Application**

Votre workflow N8n recevra :
```json
{
  "fileName": "facture_exemple.pdf",
  "fileSize": 2048576,
  "fileType": "application/pdf", 
  "fileData": "base64_encoded_file_data...",
  "documentType": "achat",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🎉 **Format de Réponse Attendu**

Votre workflow doit retourner :
```json
{
  "success": true,
  "data": {
    "companyName": "Nom de l'entreprise extraite",
    "amount": 150.00,
    "date": "2024-01-15"
  },
  "message": "Extraction réussie"
}
```

Une fois ces modifications effectuées dans N8n, votre extraction de fichiers devrait fonctionner parfaitement ! 🚀
