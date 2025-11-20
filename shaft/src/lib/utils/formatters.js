/**
 * Utility functions for formatting data
 */

/**
 * Format number as Indonesian Rupiah currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatIDR(amount) {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * Format date string to localized format
 * @param {string} dateStr - ISO date string
 * @param {string} locale - Locale code (default: 'en-US')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr, locale = 'en-US', options = { year: 'numeric', month: 'short', day: 'numeric' }) {
	const date = new Date(dateStr);
	return date.toLocaleDateString(locale, options);
}

/**
 * Format date string to Indonesian format
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDateID(dateStr) {
	return formatDate(dateStr, 'id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Parse CSV text to array of objects
 * @param {string} csvText - Raw CSV text
 * @param {string[]} headers - Array of header names (if null, uses first row)
 * @returns {object[]} Array of transaction objects
 */
export function parseCSV(csvText, headers = null) {
	const lines = csvText.trim().split('\n');
	
	// If headers not provided, use first line
	if (!headers) {
		headers = lines[0].split(',');
		lines.shift();
	}
	
	return lines.map(line => {
		const values = line.split(',');
		const obj = {};
		headers.forEach((header, index) => {
			obj[header] = values[index];
		});
		return obj;
	});
}

/**
 * Parse transactions CSV with specific format
 * @param {string} csvText - Raw CSV text
 * @returns {object[]} Array of transaction objects
 */
export function parseTransactionsCSV(csvText) {
	const lines = csvText.trim().split('\n');
	
	return lines.slice(1).map(line => {
		const [date, details, amount, account, category] = line.split(',');
		return {
			date,
			details,
			amount: parseFloat(amount),
			account,
			category
		};
	});
}
