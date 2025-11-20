<script>
	import { TIME_PERIODS } from '$lib/utils/constants';
	
	/**
	 * Reusable time period selector component
	 */
	export let selected = TIME_PERIODS.MONTH;
	export let periods = [TIME_PERIODS.MONTH, TIME_PERIODS.QUARTER, TIME_PERIODS.YEAR];
	export let onChange = (period) => {};
	
	function handleSelect(period) {
		selected = period;
		onChange(period);
	}
</script>

<div class="flex justify-center gap-5 mt-2.5 text-text-secondary text-sm">
	{#each periods as period}
		<button 
			on:click={() => handleSelect(period)}
			class="cursor-pointer hover:text-text-black transition-colors {selected === period ? 'text-text-black font-semibold underline underline-offset-4' : ''}"
		>
			{period}
		</button>
	{/each}
</div>
