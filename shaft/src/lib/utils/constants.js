/**
 * Application-wide constants
 */

export const SAVINGS_TARGET = 3000000000; // 3 Billion IDR
export const INITIAL_NET_WORTH = 1000000000; // 1 Billion IDR

export const TIME_PERIODS = {
	MONTH: 'Month',
	QUARTER: 'Quarter',
	YEAR: 'Year'
};

export const TIME_PERIOD_DAYS = {
	[TIME_PERIODS.MONTH]: 30,
	[TIME_PERIODS.QUARTER]: 90,
	[TIME_PERIODS.YEAR]: 365
};

/**
 * Category definitions with AI instructions for categorization
 * This structure is used by both the frontend UI and the API for consistent categorization
 */
export const CATEGORY_DEFINITIONS = {
	'Dining': {
		name: 'Dining',
		icon: 'fa-utensils',
		group: 'Essential',
		aiInstruction: 'Restaurants, cafes, food delivery, eating out (not groceries). Examples: McDonald\'s, Starbucks, GoFood, GrabFood, local restaurants.'
	},
	'Groceries': {
		name: 'Groceries',
		icon: 'fa-basket-shopping',
		group: 'Essential',
		aiInstruction: 'Supermarkets, food stores, grocery shopping. Examples: Indomaret, Alfamart, Ranch Market, Carrefour, Hypermart, fresh markets.'
	},
	'Transport': {
		name: 'Transport',
		icon: 'fa-car',
		group: 'Essential',
		aiInstruction: 'Transportation, fuel, parking, tolls, ride-sharing. Examples: Grab, Gojek, gas stations (Pertamina, Shell), parking fees, toll roads, public transport.'
	},
	'Bills & Fees': {
		name: 'Bills & Fees',
		icon: 'fa-file-invoice-dollar',
		group: 'Essential',
		aiInstruction: 'Utilities, phone bills, internet, bank fees, subscriptions, insurance. Examples: PLN (electricity), PDAM (water), Telkom, XL, Indihome, Netflix, Spotify, bank admin fees.'
	},
	'Family': {
		name: 'Family',
		icon: 'fa-people-roof',
		group: 'Personal',
		aiInstruction: 'Family support, transfers to family members, family-related expenses. Examples: money sent to parents, siblings, children, family allowances.'
	},
	'Gifts': {
		name: 'Gifts',
		icon: 'fa-gift',
		group: 'Personal',
		aiInstruction: 'Presents, donations to individuals, gift purchases. Examples: birthday gifts, wedding gifts, presents for friends.'
	},
	'Travel': {
		name: 'Travel',
		icon: 'fa-plane',
		group: 'Personal',
		aiInstruction: 'Hotels, flights, travel bookings, vacation expenses. Examples: Traveloka, Tiket.com, hotels, airlines, vacation activities.'
	},
	'Offering': {
		name: 'Offering',
		icon: 'fa-hand-holding-heart',
		group: 'Personal',
		aiInstruction: 'Religious offerings, church/mosque donations, tithes, charitable giving. Examples: church offerings, mosque donations, zakat, religious contributions.'
	},
	'Entertainment/Shopping': {
		name: 'Entertainment/Shopping',
		icon: 'fa-bag-shopping',
		group: 'Personal',
		aiInstruction: 'Shopping, entertainment, movies, hobbies, retail stores (not dining or groceries). Examples: clothing stores, electronics, cinema, concerts, hobbies, online shopping (Tokopedia, Shopee, Lazada).'
	},
	'Work': {
		name: 'Work',
		icon: 'fa-briefcase',
		group: 'Financial',
		aiInstruction: 'Work-related expenses, business purchases, professional services. Examples: office supplies, business meals, professional subscriptions, work equipment.'
	},
	'Income': {
		name: 'Income',
		icon: 'fa-money-bill-trend-up',
		group: 'Financial',
		aiInstruction: 'Salary deposits, transfers received, refunds, interest earned. Examples: salary, freelance income, investment returns, refunds, reimbursements.'
	},
	'Uncategorised': {
		name: 'Uncategorised',
		icon: 'fa-question',
		group: 'Other',
		aiInstruction: 'Transactions that don\'t clearly fit other categories or are ambiguous.'
	}
};

// Simple array of category names for backward compatibility
export const CATEGORIES = Object.keys(CATEGORY_DEFINITIONS);

// Grouped categories for UI display
export const CATEGORY_GROUPS = [
	{
		label: 'Essential',
		categories: CATEGORIES
			.filter(cat => CATEGORY_DEFINITIONS[cat].group === 'Essential')
			.map(cat => ({ name: cat, icon: CATEGORY_DEFINITIONS[cat].icon }))
	},
	{
		label: 'Personal',
		categories: CATEGORIES
			.filter(cat => CATEGORY_DEFINITIONS[cat].group === 'Personal')
			.map(cat => ({ name: cat, icon: CATEGORY_DEFINITIONS[cat].icon }))
	},
	{
		label: 'Financial',
		categories: CATEGORIES
			.filter(cat => CATEGORY_DEFINITIONS[cat].group === 'Financial')
			.map(cat => ({ name: cat, icon: CATEGORY_DEFINITIONS[cat].icon }))
	},
	{
		label: 'Other',
		categories: CATEGORIES
			.filter(cat => CATEGORY_DEFINITIONS[cat].group === 'Other')
			.map(cat => ({ name: cat, icon: CATEGORY_DEFINITIONS[cat].icon }))
	}
];

/**
 * Generate AI categorization prompt from category definitions
 * This ensures the API always uses the same category definitions as the frontend
 */
export function generateCategorizationPrompt() {
	const categoryList = CATEGORIES
		.map(cat => `- "${cat}": ${CATEGORY_DEFINITIONS[cat].aiInstruction}`)
		.join('\n');
	
	return `CATEGORIZATION:
Assign ONE category to each transaction based on the description. Available categories:
${categoryList}

Use context clues from merchant names, transaction descriptions, and amounts to determine the most appropriate category.`;
}
