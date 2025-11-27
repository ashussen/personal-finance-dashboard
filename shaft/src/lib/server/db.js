import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../../data');
const DB_PATH = join(DATA_DIR, 'finance.db');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
	mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
	-- Main transactions table (permanent storage for categorized transactions)
	CREATE TABLE IF NOT EXISTS transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		date TEXT NOT NULL,
		details TEXT NOT NULL,
		amount REAL NOT NULL,
		account TEXT,
		source TEXT,
		category TEXT NOT NULL,
		created_at TEXT DEFAULT (datetime('now')),
		updated_at TEXT DEFAULT (datetime('now'))
	);

	-- Pending transactions table (temporary staging for uncategorized/review)
	CREATE TABLE IF NOT EXISTS pending_transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		date TEXT NOT NULL,
		details TEXT NOT NULL,
		amount REAL NOT NULL,
		account TEXT,
		source TEXT,
		category TEXT,
		marked_for_deletion INTEGER DEFAULT 0,
		import_batch_id TEXT,
		created_at TEXT DEFAULT (datetime('now'))
	);

	-- Indexes for fast queries
	CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
	CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
	CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
	CREATE INDEX IF NOT EXISTS idx_pending_batch ON pending_transactions(import_batch_id);
`);

// ============================================
// TRANSACTIONS (Main/Permanent)
// ============================================

/**
 * Get all transactions, optionally filtered by date range
 */
export function getAllTransactions(startDate = null, endDate = null) {
	if (startDate && endDate) {
		return db.prepare(`
			SELECT * FROM transactions 
			WHERE date BETWEEN ? AND ? 
			ORDER BY date DESC
		`).all(startDate, endDate);
	}
	return db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
}

/**
 * Get transactions sorted by date ascending (for calculations)
 */
export function getTransactionsSortedAsc() {
	return db.prepare('SELECT * FROM transactions ORDER BY date ASC').all();
}

/**
 * Insert a single transaction
 */
export function insertTransaction(tx) {
	return db.prepare(`
		INSERT INTO transactions (date, details, amount, account, source, category)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(tx.date, tx.details, tx.amount, tx.account, tx.source, tx.category);
}

/**
 * Insert multiple transactions in a single transaction
 */
export function insertTransactions(transactions) {
	const insert = db.prepare(`
		INSERT INTO transactions (date, details, amount, account, source, category)
		VALUES (?, ?, ?, ?, ?, ?)
	`);

	const insertMany = db.transaction((txs) => {
		for (const tx of txs) {
			insert.run(tx.date, tx.details, tx.amount, tx.account, tx.source, tx.category);
		}
		return txs.length;
	});

	return insertMany(transactions);
}

/**
 * Update a transaction's category
 */
export function updateTransactionCategory(id, category) {
	return db.prepare(`
		UPDATE transactions 
		SET category = ?, updated_at = datetime('now')
		WHERE id = ?
	`).run(category, id);
}

/**
 * Delete a transaction
 */
export function deleteTransaction(id) {
	return db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
}

/**
 * Get expenses grouped by category for a date range
 */
export function getExpensesByCategory(startDate, endDate) {
	return db.prepare(`
		SELECT category, SUM(amount) as total, COUNT(*) as count
		FROM transactions
		WHERE date BETWEEN ? AND ? AND amount < 0
		GROUP BY category
		ORDER BY total ASC
	`).all(startDate, endDate);
}

/**
 * Get monthly totals (income and expenses)
 */
export function getMonthlyTotals(year) {
	return db.prepare(`
		SELECT 
			strftime('%Y-%m', date) as month,
			SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
			SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
		FROM transactions
		WHERE strftime('%Y', date) = ?
		GROUP BY month
		ORDER BY month
	`).all(String(year));
}

/**
 * Get daily balances for chart
 */
export function getDailyBalances() {
	return db.prepare(`
		SELECT 
			date,
			SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
			SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
			SUM(amount) as net
		FROM transactions
		GROUP BY date
		ORDER BY date ASC
	`).all();
}

// ============================================
// PENDING TRANSACTIONS (Temporary/Staging)
// ============================================

/**
 * Get all pending transactions
 */
export function getPendingTransactions(batchId = null) {
	if (batchId) {
		return db.prepare(`
			SELECT * FROM pending_transactions 
			WHERE import_batch_id = ?
			ORDER BY date DESC
		`).all(batchId);
	}
	return db.prepare('SELECT * FROM pending_transactions ORDER BY created_at DESC, date DESC').all();
}

/**
 * Insert pending transactions (from PDF extraction)
 */
export function insertPendingTransactions(transactions, batchId) {
	const insert = db.prepare(`
		INSERT INTO pending_transactions (date, details, amount, account, source, category, import_batch_id)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`);

	const insertMany = db.transaction((txs) => {
		for (const tx of txs) {
			insert.run(tx.date, tx.details, tx.amount, tx.account || null, tx.source || null, tx.category || null, batchId);
		}
		return txs.length;
	});

	return insertMany(transactions);
}

/**
 * Update pending transaction category
 */
export function updatePendingCategory(id, category) {
	return db.prepare(`
		UPDATE pending_transactions SET category = ? WHERE id = ?
	`).run(category, id);
}

/**
 * Mark/unmark pending transaction for deletion
 */
export function togglePendingDeletion(id) {
	return db.prepare(`
		UPDATE pending_transactions 
		SET marked_for_deletion = CASE WHEN marked_for_deletion = 0 THEN 1 ELSE 0 END
		WHERE id = ?
	`).run(id);
}

/**
 * Confirm import: move pending transactions to main table
 */
export function confirmImport(batchId = null) {
	const importTx = db.transaction(() => {
		// Get pending transactions not marked for deletion
		let pending;
		if (batchId) {
			pending = db.prepare(`
				SELECT * FROM pending_transactions 
				WHERE import_batch_id = ? AND marked_for_deletion = 0
			`).all(batchId);
		} else {
			pending = db.prepare(`
				SELECT * FROM pending_transactions WHERE marked_for_deletion = 0
			`).all();
		}

		// Insert into main transactions table
		const insert = db.prepare(`
			INSERT INTO transactions (date, details, amount, account, source, category)
			VALUES (?, ?, ?, ?, ?, ?)
		`);

		for (const tx of pending) {
			insert.run(tx.date, tx.details, tx.amount, tx.account, tx.source, tx.category || 'Uncategorised');
		}

		// Clear pending transactions
		if (batchId) {
			db.prepare('DELETE FROM pending_transactions WHERE import_batch_id = ?').run(batchId);
		} else {
			db.prepare('DELETE FROM pending_transactions').run();
		}

		return pending.length;
	});

	return importTx();
}

/**
 * Clear all pending transactions
 */
export function clearPendingTransactions(batchId = null) {
	if (batchId) {
		return db.prepare('DELETE FROM pending_transactions WHERE import_batch_id = ?').run(batchId);
	}
	return db.prepare('DELETE FROM pending_transactions').run();
}

/**
 * Delete a single pending transaction
 */
export function deletePendingTransaction(id) {
	return db.prepare('DELETE FROM pending_transactions WHERE id = ?').run(id);
}

// ============================================
// UTILITY
// ============================================

/**
 * Get database stats
 */
export function getStats() {
	const transactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
	const pending = db.prepare('SELECT COUNT(*) as count FROM pending_transactions').get();
	return {
		transactionCount: transactions.count,
		pendingCount: pending.count
	};
}

export default db;
