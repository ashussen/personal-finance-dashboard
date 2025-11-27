<script>
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ExpensesBarChart from '$lib/components/ExpensesBarChart.svelte';
	import ExpensesDonutChart from '$lib/components/ExpensesDonutChart.svelte';
	import ExpensesTable from '$lib/components/ExpensesTable.svelte';
	
	let allTransactions = [];
	
	onMount(async () => {
		try {
			const response = await fetch('/api/transactions');
			const data = await response.json();
			
			if (data.success && data.transactions) {
				allTransactions = data.transactions;
			}
		} catch (error) {
			console.error('Error loading transactions:', error);
		}
	});
</script>

<PageLayout pageTitle="Expenses Tracker - Shaft">
	<PageHeader title="Expenses" subtitle="Monthly Overview" />

	<!-- Expenses Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Left Column: Bar Chart -->
		<ExpensesBarChart transactions={allTransactions} />

		<!-- Right Column: Donut Chart -->
		<ExpensesDonutChart transactions={allTransactions} />
	</div>
	
	<!-- Expenses Table -->
	<ExpensesTable transactions={allTransactions} />
</PageLayout>
