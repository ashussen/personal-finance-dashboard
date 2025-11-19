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
		const values = chartData.map(d => d.balance);

		if (chartInstance) {
			chartInstance.destroy();
		}

		const gradient = ctx.createLinearGradient(0, 0, 0, 400);
		gradient.addColorStop(0, 'rgba(117, 251, 144, 0.5)');
		gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [
					{
						type: 'line',
						label: 'Trend',
						data: values,
						borderColor: '#000000',
						borderWidth: 2,
						tension: 0.4,
						pointRadius: 0,
						pointHoverRadius: 6,
						fill: false,
						order: 1
					},
					{
						type: 'bar',
						label: 'Net Worth',
						data: values,
						backgroundColor: '#F0EFF2',
						hoverBackgroundColor: '#75FB90',
						borderRadius: 4,
						barPercentage: 0.6,
						order: 2
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
						displayColors: false,
						callbacks: {
							title: (context) => {
								const value = context[0].raw;
								return new Intl.NumberFormat('id-ID', {
									style: 'currency',
									currency: 'IDR',
									minimumFractionDigits: 0,
									maximumFractionDigits: 0
								}).format(value);
							},
							label: (context) => context.label
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
						display: false,
						min: Math.min(...values) * 0.99,
						max: Math.max(...values) * 1.01
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
