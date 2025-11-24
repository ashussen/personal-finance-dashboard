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

export const CATEGORIES = [
	'Dining',
	'Groceries',
	'Transport',
	'Bills & Fees',
	'Family',
	'Gifts',
	'Travel',
	'Offering',
	'Entertainment/Shopping',
	'Work',
	'Income',
	'Uncategorised'
];

export const CATEGORY_GROUPS = [
	{
		label: 'Essential',
		categories: [
			{ name: 'Dining', icon: 'fa-utensils' },
			{ name: 'Groceries', icon: 'fa-basket-shopping' },
			{ name: 'Transport', icon: 'fa-car' },
			{ name: 'Bills & Fees', icon: 'fa-file-invoice-dollar' }
		]
	},
	{
		label: 'Personal',
		categories: [
			{ name: 'Family', icon: 'fa-people-roof' },
			{ name: 'Gifts', icon: 'fa-gift' },
			{ name: 'Travel', icon: 'fa-plane' },
			{ name: 'Offering', icon: 'fa-hand-holding-heart' },
			{ name: 'Entertainment/Shopping', icon: 'fa-bag-shopping' }
		]
	},
	{
		label: 'Financial',
		categories: [
			{ name: 'Work', icon: 'fa-briefcase' },
			{ name: 'Income', icon: 'fa-money-bill-trend-up' }
		]
	},
	{
		label: 'Other',
		categories: [
			{ name: 'Uncategorised', icon: 'fa-question' }
		]
	}
];
