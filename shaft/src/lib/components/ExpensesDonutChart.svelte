<script>
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	let chartCanvas;
	let chartInstance;

	const chartData = [
		{ label: 'Food & Grocery', value: 6156000, color: '#000000' },
		{ label: 'Investment', value: 5000000, color: '#2B2B2B' },
		{ label: 'Shopping', value: 4356000, color: '#555555' },
		{ label: 'Travelling', value: 3670000, color: '#808080' },
		{ label: 'Miscellaneous', value: 2749000, color: '#AAAAAA' },
		{ label: 'Bill & Subscription', value: 2162000, color: '#D3D2D4' }
	];

	onMount(() => {
		initDonutChart();
		
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});

	function initDonutChart() {
		const ctx = chartCanvas.getContext('2d');
		
		chartInstance = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: chartData.map(d => d.label),
				datasets: [{
					data: chartData.map(d => d.value),
					backgroundColor: chartData.map(d => d.color),
					borderWidth: 0,
					hoverOffset: 4
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '70%',
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
				}
			}
		});
	}
</script>

<div class="bg-white rounded-3xl p-8 flex flex-col justify-center items-center h-[500px]">
	<div class="relative w-full h-[400px] flex flex-col items-center justify-center">
		<canvas bind:this={chartCanvas}></canvas>
		<button class="mt-5 bg-white border border-text-secondary py-1.5 px-3 rounded-lg text-xs text-text-secondary cursor-pointer hover:bg-bg-light transition-colors">
			More Details..
		</button>
	</div>
</div>
