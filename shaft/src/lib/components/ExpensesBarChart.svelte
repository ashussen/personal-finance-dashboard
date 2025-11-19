<script>
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	let chartCanvas;
	let chartInstance;

	onMount(() => {
		initBarChart();
		
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});

	function initBarChart() {
		const ctx = chartCanvas.getContext('2d');
		
		const labels = ['Dec', 'Feb', 'Mar', 'Apr', 'May', 'Jan'];
		const data = [45, 80, 30, 60, 85, 65];

		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [{
					data: data,
					backgroundColor: '#F0EFF2',
					hoverBackgroundColor: '#75FB90',
					borderRadius: 4,
					barPercentage: 0.6,
				}]
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
							title: (context) => context[0].formattedValue,
							label: (context) => context.label
						}
					}
				},
				scales: {
					y: {
						display: false,
						beginAtZero: true,
						max: 100
					},
					x: {
						grid: {
							display: false,
							drawBorder: false
						},
						ticks: {
							font: {
								family: 'Urbanist',
								size: 10
							},
							maxTicksLimit: 8
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

<div class="bg-white rounded-3xl p-8 flex flex-col justify-center items-center h-[500px]">
	<canvas bind:this={chartCanvas} class="w-full h-full"></canvas>
</div>
