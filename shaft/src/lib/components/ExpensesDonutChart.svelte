<script>
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	export let transactions = [];

	let chartCanvas;
	let chartInstance;
	let chartData = [];
	let totalExpenses = 0;
	let availableMonths = [];
	let selectedMonth = 'All';
	let categoryColorMap = {};

	// Color palette for categories (grayscale from black to light gray)
	const colorPalette = ['#000000', '#2B2B2B', '#555555', '#808080', '#AAAAAA', '#D3D2D4', '#E5E5E5', '#F0F0F0'];

	$: if (transactions.length > 0) {
		initializeCategoryColors();
		extractMonths();
		calculateCategoryData();
	}

	$: if (selectedMonth) {
		calculateCategoryData();
	}

	function initializeCategoryColors() {
		// Extract all unique categories and assign consistent colors
		const categories = new Set();
		transactions.forEach(tx => {
			if (tx.amount < 0) { // Only expense categories
				categories.add(tx.category);
			}
		});
		
		// Sort categories alphabetically for consistent ordering
		const sortedCategories = Array.from(categories).sort();
		
		// Create color mapping
		categoryColorMap = {};
		sortedCategories.forEach((category, index) => {
			categoryColorMap[category] = colorPalette[index % colorPalette.length];
		});
	}

	function extractMonths() {
		const months = new Set();
		transactions.forEach(tx => {
			const date = new Date(tx.date);
			// Format: "Month Year" (e.g. "November 2025")
			const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
			months.add(monthYear);
		});
		
		// Sort months by date descending
		const sortedMonths = Array.from(months).sort((a, b) => {
			return new Date(b) - new Date(a);
		});
		
		availableMonths = ['All', ...sortedMonths];
	}

	function calculateCategoryData() {
		// Filter transactions based on selected month
		let filteredTransactions = transactions;
		if (selectedMonth !== 'All') {
			filteredTransactions = transactions.filter(tx => {
				const date = new Date(tx.date);
				const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
				return monthYear === selectedMonth;
			});
		}

		// Group transactions by category and sum negative amounts (expenses)
		const categoryTotals = {};
		let total = 0;
		
		filteredTransactions.forEach(tx => {
			if (tx.amount < 0) { // Only count expenses (negative amounts)
				const category = tx.category;
				if (!categoryTotals[category]) {
					categoryTotals[category] = 0;
				}
				const amount = Math.abs(tx.amount);
				categoryTotals[category] += amount;
				total += amount;
			}
		});

		totalExpenses = total;

		// Convert to array and sort by value (descending)
		chartData = Object.entries(categoryTotals)
			.map(([label, value]) => ({
				label,
				value,
				color: categoryColorMap[label] || '#000000' // Use consistent color from map
			}))
			.sort((a, b) => b.value - a.value);

		// Reinitialize chart with new data
		if (chartInstance) {
			chartInstance.destroy();
		}
		if (chartCanvas) {
			initDonutChart();
		}
	}

	onMount(() => {
		if (transactions.length > 0) {
			calculateCategoryData();
		}
		
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});

	function initDonutChart() {
		if (!chartData || chartData.length === 0) return;
		
		const ctx = chartCanvas.getContext('2d');
		
		// Find the index of the largest value
		const maxValue = Math.max(...chartData.map(d => d.value));
		const largestIndex = chartData.findIndex(d => d.value === maxValue);
		
		chartInstance = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: chartData.map(d => d.label),
				datasets: [{
					data: chartData.map(d => d.value),
					backgroundColor: chartData.map(d => d.color),
					borderWidth: 0,
					hoverOffset: 30,
					offset: 0
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '70%',
				layout: {
					padding: {
						top: 40,
						bottom: 40,
						left: 40,
						right: 40
					}
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						backgroundColor: '#FFFFFF',
						titleColor: '#000000',
						bodyColor: '#888888',
						bodyFont: {
							family: 'Urbanist'
						},
						titleFont: {
							family: 'Urbanist',
							weight: 'bold'
						},
						padding: 12,
						cornerRadius: 8,
						borderColor: 'rgba(0,0,0,0.05)',
						borderWidth: 1,
						callbacks: {
							title: (context) => {
								return new Intl.NumberFormat('id-ID', {
									style: 'currency',
									currency: 'IDR',
									minimumFractionDigits: 0,
									maximumFractionDigits: 0
								}).format(context[0].raw);
							},
							label: (context) => context.label
						}
					}
				},
				onHover: (event, activeElements) => {
					event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
					
					// Clear active state when mouse leaves all segments
					if (activeElements.length === 0) {
						chartInstance.tooltip.setActiveElements([]);
						chartInstance.setActiveElements([]);
						
						// Reset offset to 0 for all segments
						chartInstance.update();
					}
				}
			}
		});
		
		// Show tooltip for the largest segment by default
		setTimeout(() => {
			if (chartInstance) {
				// Set offset for the largest segment
				
				chartInstance.tooltip.setActiveElements([{
					datasetIndex: 0,
					index: largestIndex
				}]);
				chartInstance.setActiveElements([{
					datasetIndex: 0,
					index: largestIndex
				}]);
				chartInstance.update();
			}
		}, 100);
	}
</script>

<div class="p-5 rounded-2xl bg-white border border-bg-light h-[500px] flex flex-col">
	<div class="flex justify-between items-center mb-4">
		<span class="text-xs text-text-secondary uppercase tracking-wider">Budgets</span>
		<div class="flex items-center gap-2">
			<select 
				bind:value={selectedMonth}
				class="bg-bg-light border-none rounded-lg px-2 py-1 text-xs font-medium outline-none cursor-pointer hover:bg-gray-200 transition-colors"
			>
				{#each availableMonths as month}
					<option value={month}>{month}</option>
				{/each}
			</select>
			<i class="fa-solid fa-expand cursor-pointer text-text-secondary hover:text-black transition-colors"></i>
		</div>
	</div>
	<div class="relative w-full flex-1 flex flex-col items-center justify-center min-h-0">
		<canvas bind:this={chartCanvas}></canvas>
		
		<!-- Center Text Overlay -->
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
			<div class="text-text-secondary text-sm font-medium mb-1">Total Expenses</div>
			<div class="text-2xl font-bold">
				{new Intl.NumberFormat('id-ID', {
					style: 'currency',
					currency: 'IDR',
					minimumFractionDigits: 0,
					maximumFractionDigits: 0
				}).format(totalExpenses)}
			</div>
		</div>
	</div>
</div>
