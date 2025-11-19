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
	<div class="flex justify-between mb-4 text-xs text-text-secondary uppercase tracking-wider">
		<span>Budgets</span>
		<i class="fa-solid fa-expand cursor-pointer"></i>
	</div>
	<div class="relative w-full flex-1 flex flex-col items-center justify-center min-h-0">
		<canvas bind:this={chartCanvas}></canvas>
	</div>
</div>
