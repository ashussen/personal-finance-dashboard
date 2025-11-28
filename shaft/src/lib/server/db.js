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
	-- Bank accounts table (master list of accounts)
	CREATE TABLE IF NOT EXISTS accounts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		account_number TEXT,
		bank_name TEXT NOT NULL,
		current_balance REAL DEFAULT 0,
		currency TEXT DEFAULT 'IDR',
		last_synced TEXT,
		created_at TEXT DEFAULT (datetime('now')),
		updated_at TEXT DEFAULT (datetime('now')),
		UNIQUE(bank_name, account_number)
	);

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

	-- Indexes for fast queries (basic indexes only - account_id index added after migration)
	CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
	CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
	CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
	CREATE INDEX IF NOT EXISTS idx_pending_batch ON pending_transactions(import_batch_id);
`);

// ============================================
// MIGRATIONS: Add new columns to existing tables
// ============================================

// Check and add new columns to transactions table
const txColumns = db.prepare("PRAGMA table_info(transactions)").all();
const txColumnNames = txColumns.map(c => c.name);

if (!txColumnNames.includes('account_id')) {
	db.exec('ALTER TABLE transactions ADD COLUMN account_id INTEGER REFERENCES accounts(id)');
}
if (!txColumnNames.includes('running_balance')) {
	db.exec('ALTER TABLE transactions ADD COLUMN running_balance REAL');
}
if (!txColumnNames.includes('transaction_type')) {
	db.exec("ALTER TABLE transactions ADD COLUMN transaction_type TEXT DEFAULT 'expense'");
}

// Check and add new columns to pending_transactions table
const pendingColumns = db.prepare("PRAGMA table_info(pending_transactions)").all();
const pendingColumnNames = pendingColumns.map(c => c.name);

if (!pendingColumnNames.includes('account_id')) {
	db.exec('ALTER TABLE pending_transactions ADD COLUMN account_id INTEGER REFERENCES accounts(id)');
}
if (!pendingColumnNames.includes('running_balance')) {
	db.exec('ALTER TABLE pending_transactions ADD COLUMN running_balance REAL');
}
if (!pendingColumnNames.includes('transaction_type')) {
	db.exec("ALTER TABLE pending_transactions ADD COLUMN transaction_type TEXT DEFAULT 'expense'");
}

// Create account_id index after migration ensures column exists
db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)');

// ============================================
// ACCOUNTS
// ============================================

/**
 * Get all accounts
 */
export function getAllAccounts() {
	return db.prepare('SELECT * FROM accounts ORDER BY bank_name, name').all();
}

/**
 * Get account by ID
 */
export function getAccountById(id) {
	return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
}

/**
 * Get account by bank name and account number
 */
export function getAccountByBankAndNumber(bankName, accountNumber) {
	return db.prepare(`
		SELECT * FROM accounts 
		WHERE bank_name = ? AND (account_number = ? OR (account_number IS NULL AND ? IS NULL))
	`).get(bankName, accountNumber, accountNumber);
}

/**
 * Get or create account (returns existing or creates new)
 */
export function getOrCreateAccount(bankName, accountNumber) {
	let account = getAccountByBankAndNumber(bankName, accountNumber);
	if (!account) {
		const displayName = accountNumber ? `${bankName} - ${accountNumber}` : bankName;
		const result = db.prepare(`
			INSERT INTO accounts (name, account_number, bank_name)
			VALUES (?, ?, ?)
		`).run(displayName, accountNumber || null, bankName);
		account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
	}
	return account;
}

/**
 * Update account balance
 */
export function updateAccountBalance(accountId, balance) {
	return db.prepare(`
		UPDATE accounts 
		SET current_balance = ?, last_synced = datetime('now'), updated_at = datetime('now')
		WHERE id = ?
	`).run(balance, accountId);
}

/**
 * Get total balance across all accounts
 */
export function getTotalBalance() {
	const result = db.prepare('SELECT SUM(current_balance) as total FROM accounts').get();
	return result.total || 0;
}

/**
 * Get balances grouped by account
 */
export function getBalancesByAccount() {
	return db.prepare(`
		SELECT id, name, bank_name, account_number, current_balance, currency, last_synced
		FROM accounts
		ORDER BY bank_name, name
	`).all();
}

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
 * Excludes transfers to show only real expenses
 */
export function getExpensesByCategory(startDate, endDate) {
	return db.prepare(`
		SELECT category, SUM(amount) as total, COUNT(*) as count
		FROM transactions
		WHERE date BETWEEN ? AND ? 
			AND amount < 0 
			AND (transaction_type IS NULL OR transaction_type != 'transfer')
		GROUP BY category
		ORDER BY total ASC
	`).all(startDate, endDate);
}

/**
 * Get monthly totals (income and expenses)
 * Excludes transfers to show only real income/expenses
 */
export function getMonthlyTotals(year) {
	return db.prepare(`
		SELECT 
			strftime('%Y-%m', date) as month,
			SUM(CASE WHEN amount > 0 AND (transaction_type IS NULL OR transaction_type != 'transfer') THEN amount ELSE 0 END) as income,
			SUM(CASE WHEN amount < 0 AND (transaction_type IS NULL OR transaction_type != 'transfer') THEN ABS(amount) ELSE 0 END) as expenses
		FROM transactions
		WHERE strftime('%Y', date) = ?
		GROUP BY month
		ORDER BY month
	`).all(String(year));
}

/**
 * Get daily balances for chart
 * Excludes transfers from income/expenses but includes all for net calculation
 */
export function getDailyBalances() {
	return db.prepare(`
		SELECT 
			date,
			SUM(CASE WHEN amount > 0 AND (transaction_type IS NULL OR transaction_type != 'transfer') THEN amount ELSE 0 END) as income,
			SUM(CASE WHEN amount < 0 AND (transaction_type IS NULL OR transaction_type != 'transfer') THEN ABS(amount) ELSE 0 END) as expenses,
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
		INSERT INTO pending_transactions (date, details, amount, account, source, category, running_balance, transaction_type, import_batch_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	const insertMany = db.transaction((txs) => {
		for (const tx of txs) {
			insert.run(
				tx.date, 
				tx.details, 
				tx.amount, 
				tx.account || null, 
				tx.source || null, 
				tx.category || null,
				tx.running_balance ?? null,
				tx.transaction_type || 'expense',
				batchId
			);
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
 * Update pending transaction category and transaction_type
 */
export function updatePendingCategoryAndType(id, category, transactionType) {
	return db.prepare(`
		UPDATE pending_transactions 
		SET category = ?, transaction_type = ?
		WHERE id = ?
	`).run(category, transactionType || 'expense', id);
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
 * Confirm import: move pending transactions to main table and update account balances
 */
export function confirmImport(batchId = null) {
	const importTx = db.transaction(() => {
		// Get pending transactions not marked for deletion, sorted by date
		let pending;
		if (batchId) {
			pending = db.prepare(`
				SELECT * FROM pending_transactions 
				WHERE import_batch_id = ? AND marked_for_deletion = 0
				ORDER BY date ASC
			`).all(batchId);
		} else {
			pending = db.prepare(`
				SELECT * FROM pending_transactions WHERE marked_for_deletion = 0
				ORDER BY date ASC
			`).all();
		}

		// Insert into main transactions table with new fields
		const insert = db.prepare(`
			INSERT INTO transactions (date, details, amount, account, source, category, account_id, running_balance, transaction_type)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		// Track latest balance per account for updating
		const accountBalances = new Map();

		for (const tx of pending) {
			// Get or create account based on source (bank name) and account number
			let accountId = tx.account_id;
			if (!accountId && tx.source) {
				const account = getOrCreateAccount(tx.source, tx.account);
				accountId = account.id;
			}

			insert.run(
				tx.date, 
				tx.details, 
				tx.amount, 
				tx.account, 
				tx.source, 
				tx.category || 'Uncategorised',
				accountId || null,
				tx.running_balance ?? null,
				tx.transaction_type || 'expense'
			);

			// Track latest balance for this account (by date)
			if (accountId && tx.running_balance != null) {
				const existing = accountBalances.get(accountId);
				if (!existing || tx.date >= existing.date) {
					accountBalances.set(accountId, { date: tx.date, balance: tx.running_balance });
				}
			}
		}

		// Update account balances with the latest running_balance from imported transactions
		for (const [accountId, data] of accountBalances) {
			updateAccountBalance(accountId, data.balance);
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
