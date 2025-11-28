import { json } from '@sveltejs/kit';
import {
	getPendingTransactions,
	insertPendingTransactions,
	updatePendingCategory,
	updatePendingCategoryAndType,
	togglePendingDeletion,
	confirmImport,
	clearPendingTransactions,
	deletePendingTransaction
} from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const batchId = url.searchParams.get('batchId');
		const transactions = getPendingTransactions(batchId);
		return json({ success: true, transactions });
	} catch (error) {
		console.error('Error fetching pending transactions:', error);
		return json({ error: 'Failed to fetch pending transactions', details: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { transactions, batchId } = await request.json();

		if (!transactions || !Array.isArray(transactions)) {
			return json({ error: 'Invalid transactions data' }, { status: 400 });
		}

		const batch = batchId || `batch_${Date.now()}`;
		const count = insertPendingTransactions(transactions, batch);
		
		return json({ success: true, inserted: count, batchId: batch });
	} catch (error) {
		console.error('Error inserting pending transactions:', error);
		return json({ error: 'Failed to insert pending transactions', details: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ request }) {
	try {
		const { id, action, category, transaction_type } = await request.json();

		if (!id) {
			return json({ error: 'Missing id' }, { status: 400 });
		}

		if (action === 'toggleDelete') {
			togglePendingDeletion(id);
			return json({ success: true });
		}

		if (action === 'updateCategory' && category) {
			updatePendingCategory(id, category);
			return json({ success: true });
		}
		
		if (action === 'updateCategoryAndType' && category) {
			updatePendingCategoryAndType(id, category, transaction_type);
			return json({ success: true });
		}

		return json({ error: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Error updating pending transaction:', error);
		return json({ error: 'Failed to update pending transaction', details: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url, request }) {
	try {
		const id = url.searchParams.get('id');
		const batchId = url.searchParams.get('batchId');
		const clearAll = url.searchParams.get('clearAll') === 'true';

		// Delete single pending transaction
		if (id) {
			deletePendingTransaction(parseInt(id));
			return json({ success: true });
		}

		// Clear all or by batch
		if (clearAll) {
			clearPendingTransactions(batchId);
			return json({ success: true });
		}

		return json({ error: 'Missing id or clearAll parameter' }, { status: 400 });
	} catch (error) {
		console.error('Error deleting pending transaction:', error);
		return json({ error: 'Failed to delete pending transaction', details: error.message }, { status: 500 });
	}
}
