import { json } from '@sveltejs/kit';
import {
	getAllTransactions,
	getTransactionsSortedAsc,
	insertTransaction,
	insertTransactions,
	updateTransactionCategory,
	deleteTransaction,
	getExpensesByCategory,
	getMonthlyTotals,
	getDailyBalances
} from '$lib/server/db.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');
		const sortAsc = url.searchParams.get('sortAsc') === 'true';
		const groupBy = url.searchParams.get('groupBy');

		// Handle grouped queries
		if (groupBy === 'category' && startDate && endDate) {
			const data = getExpensesByCategory(startDate, endDate);
			return json({ success: true, data });
		}

		if (groupBy === 'month') {
			const year = url.searchParams.get('year') || new Date().getFullYear();
			const data = getMonthlyTotals(year);
			return json({ success: true, data });
		}

		if (groupBy === 'daily') {
			const data = getDailyBalances();
			return json({ success: true, data });
		}

		// Regular transaction list
		const transactions = sortAsc 
			? getTransactionsSortedAsc()
			: getAllTransactions(startDate, endDate);

		return json({ success: true, transactions });
	} catch (error) {
		console.error('Error fetching transactions:', error);
		return json({ error: 'Failed to fetch transactions', details: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const body = await request.json();

		// Handle bulk insert
		if (Array.isArray(body.transactions)) {
			const count = insertTransactions(body.transactions);
			return json({ success: true, inserted: count });
		}

		// Handle single insert
		const result = insertTransaction(body);
		return json({ success: true, id: result.lastInsertRowid });
	} catch (error) {
		console.error('Error inserting transaction:', error);
		return json({ error: 'Failed to insert transaction', details: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ request }) {
	try {
		const { id, category } = await request.json();

		if (!id || !category) {
			return json({ error: 'Missing id or category' }, { status: 400 });
		}

		updateTransactionCategory(id, category);
		return json({ success: true });
	} catch (error) {
		console.error('Error updating transaction:', error);
		return json({ error: 'Failed to update transaction', details: error.message }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url }) {
	try {
		const id = url.searchParams.get('id');

		if (!id) {
			return json({ error: 'Missing id' }, { status: 400 });
		}

		deleteTransaction(parseInt(id));
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting transaction:', error);
		return json({ error: 'Failed to delete transaction', details: error.message }, { status: 500 });
	}
}
