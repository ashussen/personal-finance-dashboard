import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const startTime = Date.now();
	console.log('\n=== PDF Processing Request Started ===');
	console.log('Timestamp:', new Date().toISOString());
	
	try {
		const formData = await request.formData();
		const file = formData.get('file');
		console.log('File received:', file?.name, `(${(file?.size / 1024).toFixed(2)} KB)`);

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
								text: `Analyze this Indonesian bank statement PDF and extract ALL transaction data with MAXIMUM ACCURACY, and categorize each transaction.

CRITICAL REQUIREMENTS:
1. COMPLETE DETAILS: Capture the FULL transaction description including ALL lines of text. Many transactions have multi-line descriptions - you MUST include EVERY line, word, and number from the description.
2. Extract EVERY transaction (both debit and credit)
3. Handle Indonesian text and currency formats correctly
4. Identify the bank name from document header (BCA, Bank Mega, Mandiri, OCBC, etc.)
5. Extract account number if visible
6. CATEGORIZE each transaction based on the description

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

CATEGORIZATION:
Assign ONE category to each transaction based on the description. Available categories:
- "Dining": Restaurants, cafes, food delivery, eating out (not groceries)
- "Groceries": Supermarkets, food stores, grocery shopping (Indomaret, Alfamart, Ranch Market, etc.)
- "Transport": Transportation, fuel, parking, tolls, ride-sharing (Grab, Gojek, gas stations, etc.)
- "Bills & Fees": Utilities, phone bills, internet, bank fees, subscriptions, insurance
- "Family": Family support, transfers to family members, family-related expenses
- "Gifts": Presents, donations to individuals, gift purchases
- "Travel": Hotels, flights, travel bookings, vacation expenses
- "Offering": Religious offerings, church/mosque donations, tithes
- "Entertainment/Shopping": Shopping, entertainment, movies, hobbies, retail stores (not dining)
- "Work": Work-related expenses, business purchases, professional services
- "Income": Salary deposits, transfers received, refunds, interest earned
- "Uncategorised": Transactions that don't clearly fit other categories

Use context clues from merchant names, transaction descriptions, and amounts to determine the most appropriate category.

Return ONLY a valid JSON array with this EXACT structure:
[
  {
    "date": "YYYY-MM-DD",
    "details": "Complete multi-line description with all text",
    "amount": -123456.00,
    "category": "Groceries",
    "source": "Bank Name",
    "account": "account number if available"
  }
]

Do NOT:
- Skip any part of transaction descriptions
- Truncate or summarize details
- Miss any transactions
- Use categories not in the list above

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
		
		// Extract token usage and calculate cost
		const usage = result.usage || {};
		const inputTokens = usage.input_tokens || 0;
		const outputTokens = usage.output_tokens || 0;
		const totalTokens = usage.total_tokens || (inputTokens + outputTokens);
		
		// GPT-4o-mini pricing (as of 2024): $0.150 per 1M input tokens, $0.600 per 1M output tokens
		const inputCost = (inputTokens / 1_000_000) * 0.150;
		const outputCost = (outputTokens / 1_000_000) * 0.600;
		const totalCost = inputCost + outputCost;
		
		// Extract the text from the response
		const textContent = result.output?.[0]?.content?.[0]?.text || '';
		console.log('Raw text from API:', textContent.substring(0, 200));
		
		// Remove markdown code blocks if present
		let jsonText = textContent.trim();
		if (jsonText.startsWith('```json')) {
			jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
		} else if (jsonText.startsWith('```')) {
			jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
		}
		
		// Parse the JSON
		const transactions = JSON.parse(jsonText);
		
		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);
		
		console.log('\n--- Processing Results ---');
		console.log('Transactions extracted:', transactions.length);
		console.log('\n--- Token Usage ---');
		console.log('Input tokens:', inputTokens.toLocaleString());
		console.log('Output tokens:', outputTokens.toLocaleString());
		console.log('Total tokens:', totalTokens.toLocaleString());
		console.log('\n--- Cost Breakdown ---');
		console.log('Input cost: $' + inputCost.toFixed(6));
		console.log('Output cost: $' + outputCost.toFixed(6));
		console.log('Total cost: $' + totalCost.toFixed(6));
		console.log('\n--- Timing ---');
		console.log('Duration:', duration + 's');
		console.log('\n=== Request Complete ===\n');

		return json({ 
			success: true, 
			transactions
		});

	} catch (error) {
		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);
		
		console.error('\n=== Request Failed ===');
		console.error('Error:', error.message);
		console.error('Duration:', duration + 's');
		console.error('========================\n');
		
		return json({ 
			error: 'Failed to process PDF', 
			details: error.message 
		}, { status: 500 });
	}
}
