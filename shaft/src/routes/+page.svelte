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

		transactions.forEach(tx => {
			currentNetWorth += tx.amount;
			dailyBalances.push({ date: tx.date, balance: currentNetWorth });
		});

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
		chartData = dailyBalances.slice(-32);
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
						<span class="cursor-pointer hover:text-text-black">Week</span>
						<span class="cursor-pointer text-text-black font-semibold underline underline-offset-4">Month</span>
						<span class="cursor-pointer hover:text-text-black">Quarter</span>
						<span class="cursor-pointer hover:text-text-black">Year</span>
					</div>
				</div>
			</div>

			<!-- Chart Visualization -->
			<FinanceChart data={chartData} />

			<!-- Metrics Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<!-- Savings Goals -->
				<MetricCard 
					title="Savings Goals" 
					value={formatIDR(savingsGoal)} 
					subtitle="Target: Rp 200M"
				>
					<div class="mt-5 h-[50px] flex items-end gap-1">
						<div class="bg-black w-1 h-[40%]"></div>
						<div class="bg-black w-1 h-[60%]"></div>
						<div class="bg-black w-1 h-[30%]"></div>
						<div class="bg-black w-1 h-[80%]"></div>
					</div>
				</MetricCard>

				<!-- Monthly Expenses -->
				<MetricCard 
					title="Monthly Expenses" 
					value={formatIDR(monthlyExpenses)} 
					subtitle="Expenses"
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

				<!-- Investments -->
				<MetricCard 
					title="Investments" 
					value={formatIDR(totalInvestments)} 
					subtitle="Portfolio Value"
				>
					<div class="mt-5 h-1 bg-gray-200 w-full rounded-sm">
						<div class="w-[70%] bg-black h-full rounded-sm"></div>
					</div>
				</MetricCard>

				<!-- Insight -->
				<MetricCard 
					title="Insight" 
					value="" 
					subtitle=""
					expandable={false}
				>
					<div class="text-center text-sm mt-2.5">
						Spending on food decreased by 15%
					</div>
					<div class="mt-5 h-[60px] border-t-[10px] border-black rounded-t-[60px] relative">
					</div>
					<div class="flex justify-between text-sm font-bold">
						<span>Rp 5.6M</span>
						<span>Rp 9.3M</span>
					</div>
				</MetricCard>
			</div>

			<!-- Transactions Table -->
			<TransactionsTable transactions={allTransactions} />
		</div>
	</div>
</div>
