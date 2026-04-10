import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured. Set it with: supabase secrets set OPENAI_API_KEY=sk-...')
    }

    const { images, year, month } = await req.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error('Aucune image de page PDF reçue')
    }

    console.log(`Received ${images.length} page images for analysis (${month}/${year})`)

    const systemPrompt = `Tu es un expert en analyse de relevés bancaires français.
Tu reçois des images de pages d'un relevé bancaire. Tu dois extraire TOUTES les transactions visibles.

Règles strictes :
- Extrais chaque opération avec sa date, son libellé/description complet, et son montant.
- Le montant doit être un nombre positif (valeur absolue).
- Le type doit être "debit" (argent sortant : paiement, virement émis, prélèvement, retrait, achat carte) ou "credit" (argent entrant : virement reçu, remise chèque, versement).
- Les dates doivent être au format YYYY-MM-DD. Si l'année n'est pas visible, utilise ${year}.
- Ignore les lignes de solde (solde initial, solde final, ancien/nouveau solde, total des opérations).
- Ignore les en-têtes, pieds de page, numéros de compte, adresses, mentions légales.
- Sois exhaustif : ne rate aucune transaction, même les petits montants.
- Si une transaction s'étale sur plusieurs lignes, reconstitue la description complète.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks, sous cette forme exacte :
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "libellé complet de l'opération",
      "amount": 123.45,
      "type": "debit"
    }
  ],
  "metadata": {
    "bank_name": "nom de la banque si identifiable ou null",
    "account_holder": "titulaire du compte si visible ou null",
    "period": "période couverte par le relevé ou null",
    "opening_balance": null,
    "closing_balance": null
  }
}`

    // Construire les messages avec les images pour GPT-4o Vision
    const imageContents = images.map((base64Image: string) => ({
      type: 'image_url',
      image_url: {
        url: base64Image,
        detail: 'high'
      }
    }))

    const userContent = [
      {
        type: 'text',
        text: `Analyse ce relevé bancaire (${images.length} page${images.length > 1 ? 's' : ''}) et extrais toutes les transactions pour la période ${month}/${year}. Retourne le JSON.`
      },
      ...imageContents
    ]

    console.log('Calling OpenAI GPT-4o Vision API...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1,
        max_tokens: 16000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('OpenAI API error:', response.status, errorBody)

      if (response.status === 401) {
        throw new Error('Clé API OpenAI invalide. Vérifiez votre configuration.')
      }
      if (response.status === 429) {
        throw new Error('Limite de requêtes OpenAI atteinte. Réessayez dans quelques instants.')
      }
      if (response.status === 400 && errorBody.includes('image')) {
        throw new Error('Erreur d\'envoi des images. Le PDF est peut-être trop volumineux.')
      }

      throw new Error(`Erreur API OpenAI (${response.status})`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Réponse vide de l\'API OpenAI')
    }

    console.log(`OpenAI response received. Tokens used: ${data.usage?.total_tokens || 'unknown'}`)

    // Parser la réponse JSON
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      // Tenter de nettoyer le JSON (retirer markdown backticks si présents)
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        console.error('Unparseable response:', content.substring(0, 500))
        throw new Error('L\'IA a retourné une réponse non parsable')
      }
    }

    // Valider et nettoyer les transactions
    const transactions = (parsed.transactions || [])
      .filter((tx: any) => tx.date && tx.amount != null && tx.type)
      .map((tx: any, index: number) => ({
        date: tx.date,
        description: (tx.description || `Transaction ${index + 1}`).substring(0, 200),
        amount: Math.abs(Number(tx.amount)),
        type: tx.type === 'credit' ? 'credit' : 'debit'
      }))

    console.log(`Successfully parsed ${transactions.length} transactions via GPT-4o Vision`)

    return new Response(
      JSON.stringify({
        success: true,
        transactions,
        metadata: parsed.metadata || {},
        token_usage: data.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
