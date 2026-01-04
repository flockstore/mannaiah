import 'dotenv/config'
import axios from 'axios'
import { createHmac } from 'crypto'

async function getSeller() {
    const userId = process.env.FALABELLA_USER_ID
    const apiKey = process.env.FALABELLA_API_KEY
    const country = process.env.FALABELLA_COUNTRY || 'FACO'
    const sellerId = process.env.FALABELLA_SELLER_ID || 'UNKNOWN_SELLER' // likely missing

    if (!userId || !apiKey) {
        console.error('Missing FALABELLA_USER_ID or FALABELLA_API_KEY in .env')
        return
    }

    const baseUrl = 'https://sellercenter-api.falabella.com'
    const action = 'GetSellerByUser'
    const timestamp = new Date().toISOString()

    const params: Record<string, string> = {
        Action: action,
        Timestamp: timestamp,
        UserID: userId,
        Version: '1.0',
        Format: 'JSON',
    }

    // Sign
    const keys = Object.keys(params).sort()
    const queryParams = keys.map((key) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    })
    const queryString = queryParams.join('&')
    const signature = createHmac('sha256', apiKey).update(queryString).digest('hex')

    const url = `${baseUrl}/?${queryString}&Signature=${signature}`

    // Try with minimal User-Agent if strict one fails? 
    // Or try constructing one that looks legitimate even without Seller ID?
    // Let's try 'SC_API_Node/1.0' or similar if the strict one is the problem.
    // But wait, the strict one IS the requirement. 
    // Let's try to mimic the strict one but with a dummy ID, maybe that's better than 'UNKNOWN_SELLER'?
    // Or maybe 'PROPIA' as seller ID? 

    // Let's try using the email as ID? Unlikely.

    // User-Agent: SELLER_ID/TECNOLOGÍA_USADA/VERSIÓN_TECNOLOGÍA/TIPO_INTEGRACIÓN/CÓDIGO_UNIDAD_DE_NEGOCIO
    const userAgent = `${sellerId}/Node/${process.version.replace('v', '')}/PROPIA/${country}`

    console.log('Sending request to', url)
    console.log('User-Agent:', userAgent)

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': userAgent
            }
        })
        console.log('Success! Response:', JSON.stringify(response.data, null, 2))
    } catch (error: any) {
        console.error('Error:', error.message)
        if (error.response) {
            console.error('Status:', error.response.status)
            console.error('Data:', error.response.data)
            console.error('Headers:', error.response.headers)
        }
    }
}

getSeller()
