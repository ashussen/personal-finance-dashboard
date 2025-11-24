import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import { generateCategorizationPrompt } from '$lib/utils/constants.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const startTime = Date.now();
	console.log('\n=== Categorization Request Started ===');
	console.log('Timestamp:', new Date().toISOString());
	
	try {
		const { transactions } = await request.json();
		
		if (!transactions || !Array.isArray(transactions)) {
			return json({ error: 'Invalid transactions data' }, { status: 400 });
		}

		console.log('Transactions to categorize:', transactions.length);

		// Build the categorization prompt
		const promptText = `You are a financial transaction categorizer. Categorize each transaction in the provided list.

${generateCategorizationPrompt()}

INSTRUCTIONS:
1. For each transaction, analyze the "details" field to determine the most appropriate category
2. Return the SAME transactions array with a "category" field added to each transaction
3. Keep all existing fields (date, details, amount, source, account) unchanged
4. Only add the "category" field

INPUT TRANSACTIONS:
${JSON.stringify(transactions, null, 2)}

Return ONLY a valid JSON array with the category field added to each transaction. No markdown formatting, no explanations.`;

		// Log the prompt
		console.log('\n--- Categorization Prompt ---');
		console.log(promptText.substring(0, 500) + '...');
		console.log('--- End of Prompt Preview ---\n');

		// Use OpenAI Chat API for categorization
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: 'You are a financial transaction categorizer. Return only valid JSON arrays.'
					},
					{
						role: 'user',
						content: promptText
					}
				],
				temperature: 0.3
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
		}

		const result = await response.json();
		
		// Extract token usage and calculate cost
		const usage = result.usage || {};
		const inputTokens = usage.prompt_tokens || 0;
		const outputTokens = usage.completion_tokens || 0;
		const totalTokens = usage.total_tokens || (inputTokens + outputTokens);
		
		// GPT-4o-mini pricing
		const inputCost = (inputTokens / 1_000_000) * 0.150;
		const outputCost = (outputTokens / 1_000_000) * 0.600;
		const totalCost = inputCost + outputCost;
		
		// Extract the categorized transactions
		const textContent = result.choices?.[0]?.message?.content || '';
		console.log('Raw response:', textContent.substring(0, 200));
		
		// Remove markdown code blocks if present
		let jsonText = textContent.trim();
		if (jsonText.startsWith('```json')) {
			jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
		} else if (jsonText.startsWith('```')) {
			jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
		}
		
		// Parse the categorized transactions
		const categorizedTransactions = JSON.parse(jsonText);
		
		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);
		
		console.log('\n--- Categorization Results ---');
		console.log('Transactions categorized:', categorizedTransactions.length);
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
		console.log('\n=== Categorization Complete ===\n');

		return json({ 
			success: true, 
			transactions: categorizedTransactions
		});

	} catch (error) {
		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);
		
		console.error('\n=== Categorization Failed ===');
		console.error('Error:', error.message);
		console.error('Duration:', duration + 's');
		console.error('========================\n');
		
		return json({ 
			error: 'Failed to categorize transactions', 
			details: error.message 
		}, { status: 500 });
	}
}
