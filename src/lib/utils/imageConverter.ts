import jsPDF from 'jspdf';

/**
 * Utilitaire pour la conversion d'images en PDF
 */

/**
 * Vérifie si un fichier est une image JPEG ou PNG
 * @param file - Le fichier à vérifier
 * @returns true si c'est une image JPEG ou PNG, false sinon
 */
export function isImageFile(file: File): boolean {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  return imageTypes.includes(file.type.toLowerCase());
}

/**
 * Vérifie si un fichier est un PDF
 * @param file - Le fichier à vérifier
 * @returns true si c'est un PDF, false sinon
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Convertit une image en PDF avec une qualité optimisée
 * @param imageFile - Le fichier image à convertir
 * @param quality - Qualité de compression (0.1 à 1.0, défaut: 0.8)
 * @returns Promise<File> - Le fichier PDF généré
 */
export async function convertImageToPdf(
  imageFile: File, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const img = new Image();
          
          img.onload = () => {
            try {
              // Créer un canvas pour redimensionner l'image si nécessaire
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                reject(new Error('Impossible de créer le contexte canvas'));
                return;
              }

              // Calculer les dimensions optimales pour la qualité
              const maxWidth = 2100; // Largeur maximum pour une bonne qualité
              const maxHeight = 2970; // Hauteur maximum pour format A4
              
              let { width, height } = img;
              
              // Redimensionner si l'image est trop grande
              if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
              }
              
              // Configurer le canvas
              canvas.width = width;
              canvas.height = height;
              
              // Dessiner l'image sur le canvas avec une qualité optimisée
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convertir le canvas en blob avec la qualité spécifiée
              canvas.toBlob((blob) => {
                if (!blob) {
                  reject(new Error('Impossible de convertir l\'image'));
                  return;
                }
                
                // Créer le PDF
                const imgData = canvas.toDataURL('image/jpeg', quality);
                
                // Déterminer l'orientation du PDF basée sur l'image
                const isLandscape = width > height;
                const pdf = new jsPDF({
                  orientation: isLandscape ? 'landscape' : 'portrait',
                  unit: 'mm',
                  format: 'a4'
                });
                
                // Calculer les dimensions du PDF
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                // Calculer les dimensions de l'image dans le PDF en maintenant le ratio
                const imgRatio = width / height;
                const pdfRatio = pdfWidth / pdfHeight;
                
                let imgPdfWidth, imgPdfHeight;
                
                if (imgRatio > pdfRatio) {
                  // L'image est plus large que le PDF
                  imgPdfWidth = pdfWidth - 20; // Marges de 10mm de chaque côté
                  imgPdfHeight = imgPdfWidth / imgRatio;
                } else {
                  // L'image est plus haute que le PDF
                  imgPdfHeight = pdfHeight - 20; // Marges de 10mm en haut et en bas
                  imgPdfWidth = imgPdfHeight * imgRatio;
                }
                
                // Centrer l'image dans le PDF
                const x = (pdfWidth - imgPdfWidth) / 2;
                const y = (pdfHeight - imgPdfHeight) / 2;
                
                // Ajouter l'image au PDF
                pdf.addImage(imgData, 'JPEG', x, y, imgPdfWidth, imgPdfHeight);
                
                // Générer le PDF en tant que blob
                const pdfBlob = pdf.output('blob');
                
                // Créer un nouveau nom de fichier avec extension .pdf
                const originalName = imageFile.name;
                const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.'));
                const pdfFileName = `${nameWithoutExtension}.pdf`;
                
                // Créer le fichier PDF
                const pdfFile = new File([pdfBlob], pdfFileName, {
                  type: 'application/pdf',
                  lastModified: Date.now()
                });
                
                resolve(pdfFile);
                
              }, 'image/jpeg', quality);
              
            } catch (error) {
              console.error('Erreur lors de la création du PDF:', error);
              reject(new Error('Erreur lors de la création du PDF'));
            }
          };
          
          img.onerror = () => {
            reject(new Error('Impossible de charger l\'image'));
          };
          
          img.src = event.target?.result as string;
          
        } catch (error) {
          console.error('Erreur lors du traitement de l\'image:', error);
          reject(new Error('Erreur lors du traitement de l\'image'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Impossible de lire le fichier image'));
      };
      
      reader.readAsDataURL(imageFile);
      
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      reject(new Error('Erreur lors de la conversion d\'image en PDF'));
    }
  });
}

/**
 * Traite un fichier : convertit en PDF si c'est une image, sinon retourne le fichier original
 * @param file - Le fichier à traiter
 * @param quality - Qualité de compression pour les images (défaut: 0.8)
 * @returns Promise<File> - Le fichier traité
 */
export async function processFileForUpload(
  file: File, 
  quality: number = 0.8
): Promise<File> {
  try {
    // Si c'est une image JPEG ou PNG, convertir en PDF
    if (isImageFile(file)) {
      console.log(`Conversion de l'image ${file.name} en PDF...`);
      const pdfFile = await convertImageToPdf(file, quality);
      console.log(`Image convertie avec succès: ${pdfFile.name}`);
      return pdfFile;
    }
    
    // Si c'est déjà un PDF ou un autre type de fichier, retourner tel quel
    console.log(`Fichier ${file.name} traité sans conversion`);
    return file;
    
  } catch (error) {
    console.error('Erreur lors du traitement du fichier:', error);
    throw new Error(`Impossible de traiter le fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Obtient le type de fichier pour affichage
 * @param file - Le fichier
 * @returns string - Description du type de fichier
 */
export function getFileTypeDescription(file: File): string {
  if (isPdfFile(file)) {
    return 'PDF';
  } else if (isImageFile(file)) {
    return 'Image (sera convertie en PDF)';
  } else {
    return 'Document';
  }
}
