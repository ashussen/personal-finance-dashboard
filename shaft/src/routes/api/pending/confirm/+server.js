import { json } from '@sveltejs/kit';
import { confirmImport } from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { batchId } = await request.json();
		const count = confirmImport(batchId);
		
		return json({ 
			success: true, 
			imported: count,
			message: `Successfully imported ${count} transactions`
		});
	} catch (error) {
		console.error('Error confirming import:', error);
		return json({ error: 'Failed to confirm import', details: error.message }, { status: 500 });
	}
}
