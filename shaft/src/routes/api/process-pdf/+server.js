import { json } from '@sveltejs/kit';
import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!file || !(file instanceof File)) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Convert PDF to base64
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64Pdf = buffer.toString('base64');

		// Send PDF directly to ChatGPT using vision API
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content: `You are a financial transaction parser. Extract transaction data from bank statements and return ONLY a valid JSON array. Each transaction should have:
- date (YYYY-MM-DD format)
- details (transaction description)
- amount (number, negative for expenses, positive for income)
- account (bank/payment method name)
- category (one of: Food, Transport, Shopping, Bills, Entertainment, Investment, Salary, Other)

Return ONLY the JSON array, no markdown formatting, no explanations.`
				},
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: 'Parse all transactions from this bank statement PDF:'
						},
						{
							type: 'image_url',
							image_url: {
								url: `data:application/pdf;base64,${base64Pdf}`
							}
						}
					]
				}
			],
			temperature: 0.1,
			max_tokens: 2000
		});

		const responseText = completion.choices[0].message.content.trim();
		
		// Remove markdown code blocks if present
		let jsonText = responseText;
		if (jsonText.startsWith('```json')) {
			jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
		} else if (jsonText.startsWith('```')) {
			jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
		}

		// Parse the JSON response
		const transactions = JSON.parse(jsonText);

		if (!Array.isArray(transactions)) {
			return json({ error: 'Invalid response format from AI' }, { status: 500 });
		}

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
