<script>
	import ActionPills from './ActionPills.svelte';
	
	/**
	 * Standardized page header component
	 */
	export let title = '';
	export let subtitle = '';
	export let showActions = true;
	export let actions = undefined;
</script>

<div class="flex justify-between items-center mb-8">
	<div>
		<h1 class="font-normal mb-2.5 text-3xl">{title}</h1>
		{#if subtitle}
			<div class="text-text-secondary text-sm">
				<span class="mr-2.5">● {subtitle}</span>
			</div>
		{/if}
		<slot name="subtitle" />
	</div>
	
	{#if showActions}
		<ActionPills {actions} />
	{/if}
	<slot name="actions" />
</div>
