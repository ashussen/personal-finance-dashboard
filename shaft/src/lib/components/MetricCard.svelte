<script>
	export let title = '';
	export let value = '';
	export let subtitle = '';
	export let expandable = true;
</script>

<div class="p-5 rounded-2xl bg-white border border-bg-light">
	<div class="flex justify-between mb-4 text-xs text-text-secondary uppercase tracking-wider">
		<span>{title}</span>
		{#if expandable}
			<i class="fa-solid fa-expand cursor-pointer"></i>
		{:else}
			<i class="fa-solid fa-chevron-right cursor-pointer"></i>
		{/if}
	</div>
	<div class="text-3xl font-semibold mb-2">{value}</div>
	{#if subtitle}
		<div class="text-sm text-text-secondary">{subtitle}</div>
	{/if}
	<slot />
</div>
