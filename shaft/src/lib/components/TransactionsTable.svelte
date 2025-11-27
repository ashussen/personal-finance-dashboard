<script>
	import { formatIDR, formatDateID } from '$lib/utils/formatters';
	import Pagination from './Pagination.svelte';
	
	export let transactions = [];
	
	let currentPage = 1;
	const rowsPerPage = 10;
	
	$: totalPages = Math.ceil(transactions.length / rowsPerPage);
	$: start = (currentPage - 1) * rowsPerPage;
	$: end = start + rowsPerPage;
	$: pageData = transactions.slice(start, end);
	
	
	function handlePageChange(page) {
		currentPage = page;
	}
</script>

<div class="mt-10">
	<h2 class="mb-5 text-2xl">Recent Transactions</h2>
	
	<div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-bg-light">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse">
				<thead>
					<tr class="bg-bg-light">
						<th class="text-left py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">Date</th>
						<th class="text-left py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">Details</th>
						<th class="text-left py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">Category</th>
						<th class="text-right py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">Amount</th>
					</tr>
				</thead>
				<tbody>
					{#each pageData as tx}
						<tr class="hover:bg-primary-green/5 transition-colors border-b border-gray-100">
							<td class="py-3 px-4 text-text-primary text-sm">{formatDateID(tx.date)}</td>
							<td class="py-3 px-4">
								<div class="font-medium text-sm text-text-primary">{tx.details}</div>
								<div class="text-xs text-text-secondary">{tx.account}</div>
							</td>
							<td class="py-3 px-4">
								<span class="text-text-primary text-sm font-medium">{tx.category}</span>
							</td>
							<td class="py-3 px-4 text-right">
								<span class="{tx.amount >= 0 ? 'text-green-600 font-semibold' : 'text-text-primary font-medium'} text-sm">
									{tx.amount > 0 ? '+' : ''}{formatIDR(tx.amount)}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
	
	<Pagination {currentPage} {totalPages} onPageChange={handlePageChange} />
</div>
