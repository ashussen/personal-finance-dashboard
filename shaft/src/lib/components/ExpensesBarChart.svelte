<script>
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	export let transactions = [];

	let chartCanvas;
	let chartInstance;

	$: if (transactions.length > 0 && chartCanvas) {
		if (chartInstance) {
			updateChart();
		} else {
			initBarChart();
		}
	}

	onMount(() => {
		// Cleanup on destroy
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});

	function processData() {
		const monthlyData = {};
		
		transactions.forEach(tx => {
			const date = new Date(tx.date);
			const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' }); // e.g. "Nov 25"
			// Use a sortable key to order months correctly: YYYY-MM
			const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			
			if (!monthlyData[sortKey]) {
				monthlyData[sortKey] = {
					label: monthYear,
					income: 0,
					expenses: 0
				};
			}
			
			if (tx.amount > 0) {
				monthlyData[sortKey].income += tx.amount;
			} else {
				monthlyData[sortKey].expenses += Math.abs(tx.amount);
			}
		});

		// Sort by date (key) and take the last 6 months
		const sortedKeys = Object.keys(monthlyData).sort();
		const limitedKeys = sortedKeys.slice(-6); // Show last 6 months

		return {
			labels: limitedKeys.map(key => monthlyData[key].label),
			income: limitedKeys.map(key => monthlyData[key].income),
			expenses: limitedKeys.map(key => monthlyData[key].expenses)
		};
	}

	function updateChart() {
		const { labels, income, expenses } = processData();
		chartInstance.data.labels = labels;
		chartInstance.data.datasets[0].data = income;
		chartInstance.data.datasets[1].data = expenses;
		chartInstance.update();
	}

	function initBarChart() {
		const ctx = chartCanvas.getContext('2d');
		const { labels, income, expenses } = processData();

		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Income',
						data: income,
						backgroundColor: '#D3D3D3',
						hoverBackgroundColor: '#75FB90',
						borderRadius: 4,
						barPercentage: 0.6,
					},
					{
						label: 'Expenses',
						data: expenses,
						backgroundColor: '#A8A8A8',
						hoverBackgroundColor: '#FF6B6B',
						borderRadius: 4,
						barPercentage: 0.6,
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						backgroundColor: '#FFFFFF',
						titleColor: '#000000',
						titleFont: {
							family: 'Urbanist',
							size: 14,
							weight: 'bold'
						},
						bodyColor: '#888888',
						bodyFont: {
							family: 'Urbanist',
							size: 12
						},
						padding: 12,
						cornerRadius: 8,
						borderColor: 'rgba(0,0,0,0.05)',
						borderWidth: 1,
						displayColors: true,
						callbacks: {
							title: (context) => context[0].label,
							label: (context) => {
								const label = context.dataset.label || '';
								const value = new Intl.NumberFormat('id-ID', {
									style: 'currency',
									currency: 'IDR',
									maximumFractionDigits: 0
								}).format(context.raw);
								return `${label}: ${value}`;
							},
							labelColor: (context) => {
								// Return green for Income, red for Expenses
								return {
									backgroundColor: context.datasetIndex === 0 ? '#75FB90' : '#FF6B6B',
									borderWidth: 2,
									borderRadius: 2
								};
							}
						}
					}
				},
				scales: {
					y: {
						display: true,
						beginAtZero: true,
						stacked: true,
						grid: {
							display: true,
							color: 'rgba(0, 0, 0, 0.05)',
							drawBorder: false
						},
						ticks: {
							font: {
								family: 'Urbanist',
								size: 10
							},
							color: '#888888',
							callback: function(value) {
								// Format large numbers as millions (M)
								if (value >= 1000000) {
									return (value / 1000000).toFixed(0) + 'M';
								}
								return value;
							}
						},
						border: {
							display: false
						}
					},
					x: {
						stacked: true,
						grid: {
							display: false,
							drawBorder: false
						},
						ticks: {
							font: {
								family: 'Urbanist',
								size: 10
							},
						},
						border: {
							display: false
						}
					}
				},
				interaction: {
					mode: 'index',
					intersect: false,
				}
			}
		});
	}
</script>

<div class="p-5 rounded-2xl bg-white border border-bg-light h-[500px] flex flex-col">
	<div class="flex justify-between mb-4 text-xs text-text-secondary uppercase tracking-wider">
		<span>Monthly Spending</span>
		<i class="fa-solid fa-expand cursor-pointer"></i>
	</div>
	<div class="flex-1 w-full min-h-0 relative">
		<canvas bind:this={chartCanvas} class="w-full h-full"></canvas>
	</div>
</div>
