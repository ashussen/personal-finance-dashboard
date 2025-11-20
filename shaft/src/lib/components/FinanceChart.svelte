<script>
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	export let data = [];
	
	let chartCanvas;
	let chartInstance;

	onMount(() => {
		if (chartCanvas && data.length > 0) {
			updateChart(data);
		}
		
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});

	$: if (chartCanvas && data.length > 0) {
		updateChart(data);
	}

	function updateChart(chartData) {
		const ctx = chartCanvas.getContext('2d');
		
		const labels = chartData.map(d => {
			const date = new Date(d.date);
			return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
		});
		const netWorthValues = chartData.map(d => d.balance);
		
		// Calculate cumulative income and expenses
		let cumulativeIncome = 0;
		let cumulativeExpenses = 0;
		const incomeValues = chartData.map(d => {
			cumulativeIncome += (d.income || 0);
			return cumulativeIncome;
		});
		const expenseValues = chartData.map(d => {
			cumulativeExpenses += (d.expenses || 0);
			return cumulativeExpenses;
		});

		if (chartInstance) {
			chartInstance.destroy();
		}

		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [
					{
						type: 'line',
						label: 'Income',
						data: incomeValues,
						borderColor: '#808080',
						backgroundColor: '#808080',
						borderWidth: 2,
						tension: 0.4,
						pointRadius: 0,
						pointHoverRadius: 6,
						pointBackgroundColor: '#4A4A4A',
						pointHoverBackgroundColor: '#75FB90',
						pointBorderColor: '#4A4A4A',
						pointHoverBorderColor: '#75FB90',
						hoverBorderColor: '#75FB90',
						fill: false,
						yAxisID: 'y1',
						order: 1
					},
					{
						type: 'line',
						label: 'Expenses',
						data: expenseValues,
						borderColor: '#000000',
						backgroundColor: '#000000',
						borderWidth: 2,
						tension: 0.4,
						pointRadius: 0,
						pointHoverRadius: 6,
						pointBackgroundColor: '#000000',
						pointHoverBackgroundColor: '#FF6B6B',
						pointBorderColor: '#000000',
						pointHoverBorderColor: '#FF6B6B',
						hoverBorderColor: '#FF6B6B',
						fill: false,
						yAxisID: 'y1',
						order: 2
					},
					{
						type: 'bar',
						label: 'Net Worth',
						data: netWorthValues,
						backgroundColor: '#F0EFF2',
						hoverBackgroundColor: '#D3D3D3',
						borderRadius: 4,
						barPercentage: 0.6,
						yAxisID: 'y',
						order: 3
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: true,
						position: 'top',
						align: 'end',
						labels: {
							font: {
								family: 'Urbanist',
								size: 11
							},
							boxWidth: 12,
							boxHeight: 12,
							usePointStyle: true,
							pointStyle: 'circle'
						}
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
									minimumFractionDigits: 0,
									maximumFractionDigits: 0
								}).format(context.raw);
								return `${label}: ${value}`;
							},
							labelColor: (context) => {
								const label = context.dataset.label;
								let color = '#000000'; // Default black for Net Worth
								
								if (label === 'Income') {
									color = '#75FB90'; // Green for Income
								} else if (label === 'Expenses') {
									color = '#FF6B6B'; // Red for Expenses
								}
								
								return {
									backgroundColor: color,
									borderWidth: 2,
									borderRadius: 2
								};
							}
						}
					}
				},
				scales: {
					x: {
						grid: {
							display: false,
							drawBorder: false
						},
						ticks: {
							display: true,
							font: {
								family: 'Urbanist',
								size: 10
							},
							maxTicksLimit: 8
						},
						border: {
							display: false
						}
					},
					y: {
						type: 'linear',
						display: false,
						position: 'left',
						min: Math.min(...netWorthValues) * 0.99,
						max: Math.max(...netWorthValues) * 1.01
					},
					y1: {
						type: 'linear',
						display: false,
						position: 'right',
						grid: {
							drawOnChartArea: false
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

<div class="h-[400px] block">
	<canvas bind:this={chartCanvas}></canvas>
</div>
