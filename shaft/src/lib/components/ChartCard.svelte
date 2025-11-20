<script>
	/**
	 * Standardized chart container component
	 * Follows MetricCard styling for consistency
	 */
	export let title = '';
	export let height = '400px';
	export let expandable = true;
</script>

<div class="p-5 rounded-2xl bg-white border border-bg-light" style="height: {height}; display: flex; flex-direction: column;">
	{#if title}
		<div class="flex justify-between mb-4 text-xs text-text-secondary uppercase tracking-wider">
			<span>{title}</span>
			<div class="flex items-center gap-3">
				<slot name="header-actions" />
				{#if expandable}
					<i class="fa-solid fa-expand cursor-pointer"></i>
				{/if}
			</div>
		</div>
	{/if}
	<div class="flex-1 min-h-0">
		<slot />
	</div>
</div>
