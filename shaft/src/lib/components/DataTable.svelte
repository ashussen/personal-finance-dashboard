<script>
	/**
	 * Standardized data table component
	 * Provides consistent table styling and structure
	 */
	export let headers = [];
	export let data = [];
	export let title = '';
	
	/**
	 * Headers format:
	 * [
	 *   { key: 'date', label: 'Date', align: 'left' },
	 *   { key: 'amount', label: 'Amount', align: 'right' }
	 * ]
	 */
</script>

<div class="mt-10">
	{#if title}
		<h2 class="mb-5 text-2xl">{title}</h2>
	{/if}
	
	<div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-bg-light">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse">
				<thead>
					<tr class="bg-bg-light">
						{#each headers as header}
							<th class="text-{header.align || 'left'} py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">
								{header.label}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					<slot {data} />
				</tbody>
			</table>
		</div>
	</div>
	
	<slot name="footer" />
</div>
