import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileUrl, fileName } = await req.json()

    // Récupérer le fichier depuis le storage
    const response = await fetch(fileUrl)
    const imageBytes = await response.arrayBuffer()

    // Créer un nouveau document PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()

    // Convertir l'image en PDF
    const image = await pdfDoc.embedJpg(imageBytes)
    const { width, height } = image.scale(1)
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    })

    // Sauvegarder le PDF
    const pdfBytes = await pdfDoc.save()

    return new Response(
      JSON.stringify({ success: true, pdf: pdfBytes }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})