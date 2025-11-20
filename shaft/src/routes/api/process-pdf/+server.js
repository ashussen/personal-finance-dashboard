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
								text: 'Extract all transactions from this bank statement and return them as a JSON array. Each transaction should have: date (YYYY-MM-DD), details, amount (negative for expenses), account, and category (Food, Transport, Shopping, Bills, Entertainment, Investment, Salary, Other). Return ONLY valid JSON.'
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
