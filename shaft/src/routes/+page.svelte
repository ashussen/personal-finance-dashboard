<script>
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ChartCard from '$lib/components/ChartCard.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import FinanceChart from '$lib/components/FinanceChart.svelte';
	import TransactionsTable from '$lib/components/TransactionsTable.svelte';
	import TimePeriodSelector from '$lib/components/TimePeriodSelector.svelte';
	import { formatIDR } from '$lib/utils/formatters';
	import { SAVINGS_TARGET, INITIAL_NET_WORTH, TIME_PERIODS } from '$lib/utils/constants';

	let allTransactions = [];
	let netWorth = 0;
	let savingsGoal = 0;
	let monthlyExpenses = 0;
	let totalInvestments = 0;
	let chartData = [];
	let timePeriod = TIME_PERIODS.MONTH;
	let allDailyBalances = [];
	
	// Period-specific metrics
	let periodNetWorthChange = 0;
	let periodExpenses = 0;
	let periodIncome = 0;
	let periodSavings = 0;
	

	onMount(async () => {
		try {
			const response = await fetch('/api/transactions');
			const data = await response.json();
			
			if (data.success && data.transactions) {
				allTransactions = data.transactions;
				calculateMetrics(allTransactions);
			}
		} catch (error) {
			console.error('Error loading transactions:', error);
		}
	});

	function calculateMetrics(transactions) {
		let currentNetWorth = INITIAL_NET_WORTH;
		const dailyData = new Map(); // Use Map for O(1) lookups
		const balancesByDate = new Map();

		// First pass: aggregate income and expenses by date
		transactions.forEach(tx => {
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
		transactions.forEach(tx => {
			currentNetWorth += tx.amount;
			
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

		allDailyBalances = Array.from(balancesByDate.values());
		netWorth = currentNetWorth;

		const latestDate = new Date(transactions[transactions.length - 1].date);
		const currentMonth = latestDate.getMonth();
		const currentYear = latestDate.getFullYear();

		let expenses = 0;
		let investments = 0;
		let monthlyIncome = 0;

		transactions.forEach(tx => {
			const txDate = new Date(tx.date);
			
			if (tx.category === 'Investment') {
				investments += Math.abs(tx.amount);
			}

			if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
				if (tx.amount < 0 && tx.category !== 'Investment') {
					expenses += Math.abs(tx.amount);
				} else if (tx.amount > 0) {
					monthlyIncome += tx.amount;
				}
			}
		});

		monthlyExpenses = expenses;
		totalInvestments = investments;
		savingsGoal = monthlyIncome - expenses;
		updateChartData();
	}

	function updateChartData() {
		if (allDailyBalances.length === 0) return;
		
		let numDays;
		switch(timePeriod) {
			case TIME_PERIODS.MONTH:
				numDays = 30;
				break;
			case TIME_PERIODS.QUARTER:
				numDays = 90;
				break;
			case TIME_PERIODS.YEAR:
				numDays = 365;
				break;
			default:
				numDays = 30;
		}
		
		// Get data for the selected period
		const dataPoints = allDailyBalances.slice(-numDays);
		
		// Calculate period metrics
		if (dataPoints.length > 0) {
			const startBalance = dataPoints[0].balance;
			const endBalance = dataPoints[dataPoints.length - 1].balance;
			periodNetWorthChange = endBalance - startBalance;
			
			// Sum up income and expenses for the period
			periodIncome = dataPoints.reduce((sum, d) => sum + (d.income || 0), 0);
			periodExpenses = dataPoints.reduce((sum, d) => sum + (d.expenses || 0), 0);
			periodSavings = periodIncome - periodExpenses;
		}
		
		// Aggregate by week or month for better visualization if needed
		if (numDays > 90) {
			// For year view, aggregate by week
			const weeklyData = [];
			for (let i = 0; i < dataPoints.length; i += 7) {
				const weekData = dataPoints.slice(i, i + 7);
				if (weekData.length > 0) {
					const lastDay = weekData[weekData.length - 1];
					const weekIncome = weekData.reduce((sum, d) => sum + (d.income || 0), 0);
					const weekExpenses = weekData.reduce((sum, d) => sum + (d.expenses || 0), 0);
					weeklyData.push({
						date: lastDay.date,
						balance: lastDay.balance,
						income: weekIncome,
						expenses: weekExpenses
					});
				}
			}
			chartData = weeklyData;
		} else {
			chartData = dataPoints;
		}
	}

	// Update chart when time period changes
	$: if (timePeriod && allDailyBalances.length > 0) {
		updateChartData();
	}
</script>

<PageLayout pageTitle="Personal Finance Dashboard">
	<PageHeader title="Personal Finance" subtitle="Monthly Overview" />
	
	<!-- Balance Section -->
	<div>

		<div class="text-center py-5">
			<div class="text-[5rem] font-semibold tracking-tight my-2.5">
				{formatIDR(netWorth)}
			</div>
			<div class="text-text-secondary">Total Net Worth</div>
			<TimePeriodSelector 
				selected={timePeriod} 
				onChange={(period) => timePeriod = period}
			/>
		</div>
	</div>

	<!-- Chart Visualization -->
	<ChartCard title="Net Worth Trend" height="450px">
		<FinanceChart data={chartData} />
	</ChartCard>

	<!-- Metrics Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<!-- Net Worth Change -->
		<MetricCard 
			title="Net Worth" 
			value={formatIDR(periodNetWorthChange)} 
			subtitle={`${timePeriod} Change`}
		>
			<div class="mt-5 h-[50px] flex items-end gap-1">
				<div class="bg-black w-1 h-[40%]"></div>
				<div class="bg-black w-1 h-[60%]"></div>
				<div class="bg-black w-1 h-[30%]"></div>
				<div class="bg-black w-1 h-[80%]"></div>
			</div>
		</MetricCard>

		<!-- Expenses -->
		<MetricCard 
			title="Expenses" 
			value={formatIDR(periodExpenses)} 
			subtitle={`${timePeriod} Total`}
		>
			<div class="mt-5 flex gap-2.5 flex-wrap text-xs">
				<div class="flex items-center gap-1">
					<div class="w-2 h-2 rounded-full bg-black"></div>
					Food
				</div>
				<div class="flex items-center gap-1">
					<div class="w-2 h-2 rounded-full bg-gray-300"></div>
					Transport
				</div>
				<div class="flex items-center gap-1">
					<div class="w-2 h-2 rounded-full bg-gray-200"></div>
					Bills
				</div>
			</div>
		</MetricCard>

		<!-- Income -->
		<MetricCard 
			title="Income" 
			value={formatIDR(periodIncome)} 
			subtitle={`${timePeriod} Total`}
		>
			<div class="mt-5 h-1 bg-gray-200 w-full rounded-sm">
				<div class="w-[70%] bg-black h-full rounded-sm"></div>
			</div>
		</MetricCard>

		<!-- Savings Goal -->
		<MetricCard 
			title="Savings Goal" 
			value={formatIDR(netWorth)} 
			subtitle={`Target: ${formatIDR(SAVINGS_TARGET)}`}
			expandable={false}
		>
			<div class="mt-5 h-1 bg-gray-200 w-full rounded-sm">
				<div style="width: {Math.min((netWorth / SAVINGS_TARGET) * 100, 100)}%" class="bg-black h-full rounded-sm transition-all"></div>
			</div>
			<div class="flex justify-between text-xs mt-2 text-text-secondary">
				<span>{Math.min(Math.round((netWorth / SAVINGS_TARGET) * 100), 100)}% of goal</span>
			</div>
		</MetricCard>
	</div>

	<!-- Transactions Table (most recent first) -->
	<TransactionsTable transactions={allTransactions} />
</PageLayout>
