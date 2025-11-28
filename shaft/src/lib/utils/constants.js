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
	// === ESSENTIALS ===
	'Housing': {
		name: 'Housing',
		icon: 'fa-house',
		group: 'Essentials',
		aiInstruction: 'Rent, mortgage payments, property maintenance, property tax, HOA fees, home repairs. Examples: rent payment, kos/kontrakan, property tax, home maintenance.'
	},
	'Utilities': {
		name: 'Utilities',
		icon: 'fa-bolt',
		group: 'Essentials',
		aiInstruction: 'Electricity, water, gas, internet, mobile phone bills. Examples: PLN, PDAM, PGN, Indihome, Telkomsel, XL, by.U, Biznet.'
	},
	'Transportation': {
		name: 'Transportation',
		icon: 'fa-car',
		group: 'Essentials',
		aiInstruction: 'Fuel, tolls, parking, public transit, ride-hailing, vehicle service/insurance. Examples: Pertamina, Shell, toll roads, Grab, Gojek, TransJakarta, MRT, car service, STNK.'
	},
	'Food': {
		name: 'Food',
		icon: 'fa-utensils',
		group: 'Essentials',
		aiInstruction: 'Groceries, dining out, coffee/snacks, food delivery fees. Examples: Indomaret, Alfamart, restaurants, Starbucks, GoFood, GrabFood, Shopee Food.'
	},
	'Health': {
		name: 'Health',
		icon: 'fa-heart-pulse',
		group: 'Essentials',
		aiInstruction: 'Medical expenses, dental, pharmacy, therapy, fitness memberships. Examples: hospital, clinic, apotek, gym membership, doctor visits, BPJS top-up.'
	},
	'Insurance': {
		name: 'Insurance',
		icon: 'fa-shield-halved',
		group: 'Essentials',
		aiInstruction: 'Health insurance, life insurance, property insurance, vehicle insurance, travel insurance premiums. Examples: Prudential, AXA, Allianz, Manulife, car insurance.'
	},

	// === FINANCIAL ===
	'Debt & Fees': {
		name: 'Debt & Fees',
		icon: 'fa-file-invoice-dollar',
		group: 'Financial',
		aiInstruction: 'Loan payments, credit card interest, bank fees, admin fees. Examples: KTA payment, mortgage installment, bank admin fee, late fees, interest charges.'
	},
	'Savings & Investing': {
		name: 'Savings & Investing',
		icon: 'fa-piggy-bank',
		group: 'Financial',
		aiInstruction: 'Emergency fund contributions, retirement savings, brokerage/crypto investments, education fund. Examples: reksadana, deposito, Bibit, Bareksa, crypto purchase, DPLK.'
	},
	'Income': {
		name: 'Income',
		icon: 'fa-money-bill-trend-up',
		group: 'Financial',
		aiInstruction: 'Salary deposits, freelance income, refunds, interest earned, dividends. Examples: salary, gaji, bonus, investment returns, cashback, reimbursements.'
	},
	'Transfer': {
		name: 'Transfer',
		icon: 'fa-arrow-right-arrow-left',
		group: 'Financial',
		aiInstruction: 'Money moving between your OWN accounts. Examples: credit card payments from bank account, transfers between your own bank accounts, paying off CC balance. NOT for transfers to other people.'
	},
	'Taxes': {
		name: 'Taxes',
		icon: 'fa-landmark',
		group: 'Financial',
		aiInstruction: 'Income tax payments, VAT/sales tax, tax filing fees. Examples: PPh, PPN, tax consultant fees, e-filing fees.'
	},

	// === LIFESTYLE ===
	'Personal & Shopping': {
		name: 'Personal & Shopping',
		icon: 'fa-bag-shopping',
		group: 'Lifestyle',
		aiInstruction: 'Clothing, personal care, grooming, household supplies, general shopping. Examples: clothing stores, salon, barber, skincare, Tokopedia, Shopee, household items.'
	},
	'Entertainment & Subscriptions': {
		name: 'Entertainment & Subscriptions',
		icon: 'fa-film',
		group: 'Lifestyle',
		aiInstruction: 'Streaming services, apps, games, events, books, hobbies. Examples: Netflix, Spotify, YouTube Premium, cinema, concerts, books, gaming.'
	},
	'Family & Giving': {
		name: 'Family & Giving',
		icon: 'fa-hand-holding-heart',
		group: 'Lifestyle',
		aiInstruction: 'Childcare, education expenses, gifts, donations, religious offerings, family support. Examples: school fees, tutoring, birthday gifts, church/mosque donations, zakat, money to parents.'
	},
	'Travel': {
		name: 'Travel',
		icon: 'fa-plane',
		group: 'Lifestyle',
		aiInstruction: 'Flights, hotels, visas, travel insurance, vacation expenses. Examples: Traveloka, Tiket.com, airlines, Airbnb, hotels, visa fees.'
	},

	// === OTHER ===
	'Business': {
		name: 'Business',
		icon: 'fa-briefcase',
		group: 'Other',
		aiInstruction: 'Business expenses on personal card, reimbursables, software, professional services. Examples: work equipment, business meals, SaaS subscriptions, professional tools.'
	},
	'Miscellaneous': {
		name: 'Miscellaneous',
		icon: 'fa-ellipsis',
		group: 'Other',
		aiInstruction: 'One-off expenses, adjustments, anything that doesn\'t clearly fit other categories.'
	},
	'Uncategorized': {
		name: 'Uncategorized',
		icon: 'fa-question',
		group: 'Other',
		aiInstruction: 'Transactions that have not been categorized yet. Use this as a placeholder until properly categorized.'
	}
};

// Simple array of category names for backward compatibility
export const CATEGORIES = Object.keys(CATEGORY_DEFINITIONS);

// Grouped categories for UI display
export const CATEGORY_GROUPS = [
	{
		label: 'Essentials',
		categories: CATEGORIES
			.filter(cat => CATEGORY_DEFINITIONS[cat].group === 'Essentials')
			.map(cat => ({ name: cat, icon: CATEGORY_DEFINITIONS[cat].icon }))
	},
	{
		label: 'Financial',
		categories: CATEGORIES
			.filter(cat => CATEGORY_DEFINITIONS[cat].group === 'Financial')
			.map(cat => ({ name: cat, icon: CATEGORY_DEFINITIONS[cat].icon }))
	},
	{
		label: 'Lifestyle',
		categories: CATEGORIES
			.filter(cat => CATEGORY_DEFINITIONS[cat].group === 'Lifestyle')
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

TRANSACTION TYPE:
Also determine the transaction_type for each transaction:
- "income": Money received (salary, refunds, interest, transfers FROM others)
- "expense": Money spent on goods/services (purchases, bills, fees)
- "transfer": Money moving between your OWN accounts (CC payments, internal bank transfers)

IMPORTANT for transfers:
- Credit card payments from bank accounts = "transfer" with category "Transfer"
- "PEMBAYARAN KARTU KREDIT", "PAYMENT", "CC PAYMENT" = transfer
- Transfers TO family/friends = "expense" (not transfer)
- Transfers FROM others to you = "income"

Use context clues from merchant names, transaction descriptions, and amounts to determine the most appropriate category and transaction_type.`;
}
