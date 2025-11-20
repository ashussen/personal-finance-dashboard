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
	'Food & Grocery',
	'Investment',
	'Shopping',
	'Travelling',
	'Miscellaneous',
	'Bill & Subscription',
	'Entertainment',
	'Healthcare',
	'Transportation',
	'Education',
	'Food',
	'Transport',
	'Bills',
	'Salary'
];
