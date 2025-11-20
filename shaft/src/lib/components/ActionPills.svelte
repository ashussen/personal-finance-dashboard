<script>
	/**
	 * Reusable action pills component
	 * Can be used for quick actions on any page
	 */
	export let showShare = true;
	export let actions = [
		{ icon: 'fa-bolt', label: 'Quick Action' },
		{ icon: 'fa-star', label: 'Favorite' },
		{ icon: 'fa-gear', label: 'Settings' }
	];
</script>

<div class="bg-bg-light p-1.5 rounded-xl flex gap-1">
	{#each actions as action}
		<div 
			class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-text-black hover:text-white"
			title={action.label}
		>
			<i class="fa-solid {action.icon}"></i>
		</div>
	{/each}
	{#if showShare}
		<div class="rounded-lg cursor-pointer px-3 bg-black text-white text-sm flex items-center">
			Share
		</div>
	{/if}
</div>
