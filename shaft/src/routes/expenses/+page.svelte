<script>
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import ExpensesBarChart from '$lib/components/ExpensesBarChart.svelte';
	import ExpensesDonutChart from '$lib/components/ExpensesDonutChart.svelte';
	import ExpensesTable from '$lib/components/ExpensesTable.svelte';
	
	let allTransactions = [];
	
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
		} catch (error) {
			console.error('Error loading transactions:', error);
		}
	});
</script>

<svelte:head>
	<title>Expenses Tracker - Shaft</title>
</svelte:head>

<div class="min-h-screen bg-bg-light p-5">
	<div class="bg-white rounded-3xl min-h-[90vh] p-6 md:p-8 shadow-lg relative overflow-hidden">
		<Header />
		
		<!-- Main Content -->
		<div class="flex flex-col gap-8">
			<!-- Page Header -->
			<div>
				<div class="flex justify-between items-center">
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
			</div>

			<!-- Expenses Content Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Left Column: Bar Chart -->
				<ExpensesBarChart transactions={allTransactions} />

				<!-- Right Column: Donut Chart -->
				<ExpensesDonutChart transactions={allTransactions} />
			</div>
			
			<!-- Expenses Table -->
			<ExpensesTable transactions={allTransactions} />
		</div>
	</div>
</div>
