<script>
	import { CATEGORY_GROUPS } from '$lib/utils/constants';
	
	export let value = '';
	export let onChange = () => {};
	
	let isOpen = false;
	let dropdownRef;
	
	// Keyboard shortcut mapping
	const keyboardShortcuts = {
		'd': 'Dining',
		'g': 'Groceries',
		't': 'Transport',
		'b': 'Bills & Fees',
		'f': 'Family',
		'i': 'Income',
		'o': 'Offering',
		'w': 'Work',
		'e': 'Entertainment/Shopping',
		's': 'Gifts', // 's' for preS ents (g is taken by Groceries)
		'v': 'Travel', // 'v' for traVel (t is taken by Transport)
		'u': 'Uncategorised'
	};
	
	function toggleDropdown() {
		isOpen = !isOpen;
	}
	
	function selectCategory(categoryName) {
		value = categoryName;
		onChange(categoryName);
		isOpen = false;
	}
	
	function handleClickOutside(event) {
		if (dropdownRef && !dropdownRef.contains(event.target)) {
			isOpen = false;
		}
	}
	
	function handleKeydown(event) {
		if (!isOpen) return;
		
		const key = event.key.toLowerCase();
		
		// Handle Escape to close
		if (key === 'escape') {
			isOpen = false;
			event.preventDefault();
			return;
		}
		
		// Check if key matches a shortcut
		if (keyboardShortcuts[key]) {
			selectCategory(keyboardShortcuts[key]);
			event.preventDefault();
		}
	}
	
	function getCategoryIcon(categoryName) {
		for (const group of CATEGORY_GROUPS) {
			const category = group.categories.find(cat => cat.name === categoryName);
			if (category) return category.icon;
		}
		return 'fa-question';
	}
	
	function getCategoryShortcut(categoryName) {
		for (const [key, name] of Object.entries(keyboardShortcuts)) {
			if (name === categoryName) return key.toUpperCase();
		}
		return '';
	}
	
	$: selectedIcon = getCategoryIcon(value);
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleKeydown} />

<div class="relative" bind:this={dropdownRef}>
	<button
		type="button"
		on:click|stopPropagation={toggleDropdown}
		class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 transition-all hover:border-gray-400 flex items-center justify-between"
	>
		<span class="flex items-center gap-2">
			<i class="fa-solid {selectedIcon} text-text-secondary w-4"></i>
			<span class="text-text-primary">{value || 'Select category'}</span>
		</span>
		<i class="fa-solid fa-chevron-down text-text-secondary text-xs transition-transform {isOpen ? 'rotate-180' : ''}"></i>
	</button>
	
	{#if isOpen}
		<div class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
			{#each CATEGORY_GROUPS as group, groupIndex}
				<div class="py-2">
					<div class="px-3 py-1 text-xs font-semibold text-text-secondary uppercase tracking-wider">
						{group.label}
					</div>
					{#each group.categories as category}
						<button
							type="button"
							on:click|stopPropagation={() => selectCategory(category.name)}
							class="w-full px-3 py-2 text-left hover:bg-primary-green/10 transition-colors flex items-center gap-2 {value === category.name ? 'bg-primary-green/20' : ''}"
						>
							<i class="fa-solid {category.icon} text-text-secondary w-4"></i>
							<span class="text-sm text-text-primary flex-1">{category.name}</span>
							<span class="text-xs text-text-secondary bg-gray-100 px-1.5 py-0.5 rounded font-mono">
								{getCategoryShortcut(category.name)}
							</span>
							{#if value === category.name}
								<i class="fa-solid fa-check text-primary-green text-xs"></i>
							{/if}
						</button>
					{/each}
				</div>
				{#if groupIndex < CATEGORY_GROUPS.length - 1}
					<div class="border-t border-gray-200"></div>
				{/if}
			{/each}
			
			<!-- Keyboard shortcut hint -->
			<div class="border-t border-gray-200 px-3 py-2 bg-gray-50">
				<p class="text-xs text-text-secondary flex items-center gap-1.5">
					<i class="fa-solid fa-keyboard text-xs"></i>
					<span>Press the letter key to select • <kbd class="font-mono bg-white px-1 rounded border border-gray-300">ESC</kbd> to close</span>
				</p>
			</div>
		</div>
	{/if}
</div>
