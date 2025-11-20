import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!file || !(file instanceof File)) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Upload the PDF file to OpenAI
		const uploadedFile = await openai.files.create({
			file: file,
			purpose: 'assistants'
		});

		// Use the Responses API with the uploaded file
		const response = await fetch('https://api.openai.com/v1/responses', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				input: [
					{
						role: 'user',
						content: [
							{
								type: 'input_text',
								text: `Analyze this Indonesian bank statement PDF and extract ALL transaction data with MAXIMUM ACCURACY.

CRITICAL REQUIREMENTS:
1. COMPLETE DETAILS: Capture the FULL transaction description including ALL lines of text. Many transactions have multi-line descriptions - you MUST include EVERY line, word, and number from the description.
2. Extract EVERY transaction (both debit and credit)
3. Handle Indonesian text and currency formats correctly
4. Identify the bank name from document header (BCA, Bank Mega, Mandiri, OCBC, etc.)
5. Extract account number if visible

DATE FORMAT:
- Use YYYY-MM-DD format
- If only day/month shown (e.g., 06/06), use 2025 as year → 2025-06-06

AMOUNT CONVERSION:
- Remove all dots and commas from Indonesian currency
- "Rp 1.000.000" → 1000000
- "3,555,161" → 3555161
- "123.760.000,00" → 123760000
- Use NEGATIVE (-) for debits/expenses (DB, withdrawals, payments)
- Use POSITIVE (+) for credits (CR, deposits, income)

BANK IDENTIFICATION:
- BCA: Look for "REKENING TAHAPAN", "REKENING KARTU KREDIT", or "BCA" header
- Bank Mega: Credit card statements or "Bank Mega" header
- Mandiri: "Tabungan NOW", "Mandiri" header
- OCBC: "REKENING KORAN GIRO", "OCBC" header

Return ONLY a valid JSON array with this EXACT structure:
[
  {
    "date": "YYYY-MM-DD",
    "details": "Complete multi-line description with all text",
    "amount": -123456.00,
    "source": "Bank Name",
    "account": "account number if available"
  }
]

Do NOT:
- Skip any part of transaction descriptions
- Add categories or extra fields
- Truncate or summarize details
- Miss any transactions

Return ONLY the JSON array, no markdown formatting, no explanations.`
							},
							{
								type: 'input_file',
								file_id: uploadedFile.id
							}
						]
					}
				]
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
		}

		const result = await response.json();
		
		// Extract the text from the response
		const textContent = result.output?.[0]?.content?.[0]?.text || '';
		console.log('Raw text from API:', textContent);
		
		// Remove markdown code blocks if present
		let jsonText = textContent.trim();
		if (jsonText.startsWith('```json')) {
			jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
		} else if (jsonText.startsWith('```')) {
			jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
		}
		
		// Parse the JSON
		const transactions = JSON.parse(jsonText);
		console.log('Parsed transactions:', transactions.length, 'items');

		return json({ 
			success: true, 
			transactions
		});

	} catch (error) {
		console.error('Error processing PDF:', error);
		return json({ 
			error: 'Failed to process PDF', 
			details: error.message 
		}, { status: 500 });
	}
}
