import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const startTime = Date.now();
	console.log('\n=== PDF Extraction Request Started ===');
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

		// Build the prompt text (without categorization)
		const promptText = `Analyze this Indonesian bank statement PDF and extract ALL transaction data with MAXIMUM ACCURACY.

CRITICAL REQUIREMENTS:
1. COMPLETE DETAILS: Capture the FULL transaction description including ALL lines of text. Many transactions have multi-line descriptions - you MUST include EVERY line, word, and number from the description.
2. Extract EVERY transaction (both debit and credit)
3. Extract the RUNNING BALANCE (Saldo) after each transaction - this is CRITICAL
4. Handle Indonesian text and currency formats correctly
5. Identify the bank name from document header (BCA, Bank Mega, Mandiri, OCBC, etc.)
6. Extract account number if visible

PAGE BREAK HANDLING (VERY IMPORTANT):
- Transactions may be SPLIT across page breaks
- If a transaction starts at the bottom of one page and continues at the top of the next page, MERGE them into ONE transaction
- Look for continuation patterns: same date, description continues without a new date/amount
- The description text before and after page break should be COMBINED into one "details" field
- Only count it as ONE transaction with ONE amount and ONE running_balance

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

RUNNING BALANCE (SALDO):
- This is the balance shown AFTER each transaction in the statement
- Usually labeled "Saldo", "Balance", or shown in a separate column
- Extract as a POSITIVE number (it's the total money in account)
- This is essential for tracking actual account balance

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
    "running_balance": 5000000.00,
    "source": "Bank Name",
    "account": "account number if available"
  }
]

IMPORTANT NOTES:
- running_balance: The account balance AFTER this transaction (from Saldo column)
- If running_balance is not visible for a transaction, use null

Do NOT:
- Skip any part of transaction descriptions
- Truncate or summarize details
- Miss any transactions
- Omit running_balance if it's visible in the statement

Return ONLY the JSON array, no markdown formatting, no explanations.`;

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
								text: promptText
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
		
		// Fix invalid JSON: remove leading + signs from numbers (e.g., +50000.00 -> 50000.00)
		jsonText = jsonText.replace(/:\s*\+(\d)/g, ': $1');
		
		// Parse the JSON
		const transactions = JSON.parse(jsonText);
		
		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);
		
		console.log('\n--- Extraction Results ---');
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
		console.log('\n=== Extraction Complete ===\n');

		return json({ 
			success: true, 
			transactions
		});

	} catch (error) {
		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);
		
		console.error('\n=== Extraction Failed ===');
		console.error('Error:', error.message);
		console.error('Duration:', duration + 's');
		console.error('========================\n');
		
		return json({ 
			error: 'Failed to extract PDF', 
			details: error.message 
		}, { status: 500 });
	}
}
