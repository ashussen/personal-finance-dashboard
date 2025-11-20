import { writable, derived } from 'svelte/store';
import { parseTransactionsCSV } from '$lib/utils/formatters';
import { INITIAL_NET_WORTH } from '$lib/utils/constants';

/**
 * Store for all transactions data
 */
export const transactions = writable([]);

/**
 * Loading state for transactions
 */
export const transactionsLoading = writable(false);

/**
 * Error state for transactions
 */
export const transactionsError = writable(null);

/**
 * Load transactions from CSV file
 */
export async function loadTransactions() {
	transactionsLoading.set(true);
	transactionsError.set(null);
	
	try {
		const response = await fetch('/transactions.csv');
		const csvText = await response.text();
		const data = parseTransactionsCSV(csvText);
		transactions.set(data);
	} catch (error) {
		console.error('Error loading transactions:', error);
		transactionsError.set(error.message);
	} finally {
		transactionsLoading.set(false);
	}
}

/**
 * Derived store: sorted transactions (by date ascending)
 */
export const sortedTransactions = derived(
	transactions,
	$transactions => [...$transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
);

/**
 * Derived store: daily balances with income/expenses
 * Optimized O(n) complexity using Map for lookups
 */
export const dailyBalances = derived(
	sortedTransactions,
	$sortedTransactions => {
		let currentNetWorth = INITIAL_NET_WORTH;
		const dailyData = new Map();
		const balancesByDate = new Map();

		// First pass: aggregate income and expenses by date
		$sortedTransactions.forEach(tx => {
			if (!dailyData.has(tx.date)) {
				dailyData.set(tx.date, { income: 0, expenses: 0 });
			}
			
			const data = dailyData.get(tx.date);
			if (tx.amount > 0) {
				data.income += tx.amount;
			} else {
				data.expenses += Math.abs(tx.amount);
			}
		});

		// Second pass: calculate net worth - O(n) using Map
		$sortedTransactions.forEach(tx => {
			currentNetWorth += tx.amount;
			
			// Use Map for O(1) lookup instead of array.find()
			if (!balancesByDate.has(tx.date)) {
				const data = dailyData.get(tx.date);
				balancesByDate.set(tx.date, { 
					date: tx.date, 
					balance: currentNetWorth,
					income: data.income,
					expenses: data.expenses
				});
			} else {
				balancesByDate.get(tx.date).balance = currentNetWorth;
			}
		});

		// Convert Map to array for return
		return Array.from(balancesByDate.values());
	}
);

/**
 * Derived store: current net worth
 */
export const netWorth = derived(
	dailyBalances,
	$dailyBalances => {
		if ($dailyBalances.length === 0) return INITIAL_NET_WORTH;
		return $dailyBalances[$dailyBalances.length - 1].balance;
	}
);
