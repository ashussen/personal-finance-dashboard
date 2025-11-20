<script>
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import FinanceChart from '$lib/components/FinanceChart.svelte';
	import TransactionsTable from '$lib/components/TransactionsTable.svelte';

	let allTransactions = [];
	let netWorth = 0;
	let savingsGoal = 0;
	let monthlyExpenses = 0;
	let totalInvestments = 0;
	let chartData = [];
	let timePeriod = 'Month'; // Default to Month
	let allDailyBalances = [];
	
	// Period-specific metrics
	let periodNetWorthChange = 0;
	let periodExpenses = 0;
	let periodIncome = 0;
	let periodSavings = 0;
	
	const SAVINGS_TARGET = 3000000000; // 3 Billion IDR
	
	const INITIAL_NET_WORTH = 1000000000; // 1 Billion IDR Base
	
	function formatIDR(amount) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	onMount(async () => {
		try {
			const response = await fetch('/transactions.csv');
			const csvText = await response.text();
			const lines = csvText.trim().split('\n');
			
			allTransactions = lines.slice(1).map(line => {
				const [date, details, amount, account, category] = line.split(',');
				return {
					date,
					details,
					amount: parseFloat(amount),
					account,
					category
				};
			});

			const sortedForCalc = [...allTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
			calculateMetrics(sortedForCalc);
		} catch (error) {
			console.error('Error loading transactions:', error);
		}
	});

	function calculateMetrics(transactions) {
		let currentNetWorth = INITIAL_NET_WORTH;
		const dailyBalances = [];
		const dailyData = {}; // Track income and expenses by date

		// First pass: aggregate income and expenses by date
		transactions.forEach(tx => {
			if (!dailyData[tx.date]) {
				dailyData[tx.date] = { income: 0, expenses: 0 };
			}
			
			if (tx.amount > 0) {
				dailyData[tx.date].income += tx.amount;
			} else {
				dailyData[tx.date].expenses += Math.abs(tx.amount);
			}
		});

		// Second pass: calculate net worth and combine data
		transactions.forEach(tx => {
			currentNetWorth += tx.amount;
			const existingEntry = dailyBalances.find(d => d.date === tx.date);
			
			if (!existingEntry) {
				dailyBalances.push({ 
					date: tx.date, 
					balance: currentNetWorth,
					income: dailyData[tx.date].income,
					expenses: dailyData[tx.date].expenses
				});
			} else {
				existingEntry.balance = currentNetWorth;
			}
		});

		allDailyBalances = dailyBalances;
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
			case 'Month':
				numDays = 30;
				break;
			case 'Quarter':
				numDays = 90;
				break;
			case 'Year':
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

<svelte:head>
	<title>Personal Finance Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-bg-light p-5">
	<div class="bg-white rounded-3xl min-h-[90vh] p-6 md:p-8 shadow-lg relative overflow-hidden">
		<Header />
		
		<!-- Main Content -->
		<div class="flex flex-col gap-8">
			<!-- Balance Section -->
			<div>
				<div class="flex justify-between items-center mb-8">
					<div>
						<h1 class="font-normal mb-2.5 text-3xl">Personal Finance</h1>
						<div class="text-text-secondary text-sm">
							<span class="mr-2.5">● Monthly Overview</span>
						</div>
					</div>
					
					<!-- Action Pill -->
					<div class="bg-bg-light p-1.5 rounded-xl flex gap-1">
						<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-text-black hover:text-white">
							<i class="fa-solid fa-bolt"></i>
						</div>
						<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-text-black hover:text-white">
							<i class="fa-solid fa-star"></i>
						</div>
						<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-text-black hover:text-white">
							<i class="fa-solid fa-gear"></i>
						</div>
						<div class="rounded-lg cursor-pointer px-3 bg-black text-white text-sm flex items-center">
							Share
						</div>
					</div>
				</div>

				<div class="text-center py-5">
					<div class="text-[5rem] font-semibold tracking-tight my-2.5">
						{formatIDR(netWorth)}
					</div>
					<div class="text-text-secondary">Total Net Worth</div>
					<div class="flex justify-center gap-5 mt-2.5 text-text-secondary text-sm">
						<button 
							on:click={() => timePeriod = 'Month'}
							class="cursor-pointer hover:text-text-black transition-colors {timePeriod === 'Month' ? 'text-text-black font-semibold underline underline-offset-4' : ''}"
						>
							Month
						</button>
						<button 
							on:click={() => timePeriod = 'Quarter'}
							class="cursor-pointer hover:text-text-black transition-colors {timePeriod === 'Quarter' ? 'text-text-black font-semibold underline underline-offset-4' : ''}"
						>
							Quarter
						</button>
						<button 
							on:click={() => timePeriod = 'Year'}
							class="cursor-pointer hover:text-text-black transition-colors {timePeriod === 'Year' ? 'text-text-black font-semibold underline underline-offset-4' : ''}"
						>
							Year
						</button>
					</div>
				</div>
			</div>

			<!-- Chart Visualization -->
			<FinanceChart data={chartData} />

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

			<!-- Transactions Table -->
			<TransactionsTable transactions={allTransactions} />
		</div>
	</div>
</div>
