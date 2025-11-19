<script>
	export let transactions = [];
	
	let currentPage = 1;
	const rowsPerPage = 10;
	
	$: totalPages = Math.ceil(transactions.length / rowsPerPage);
	$: start = (currentPage - 1) * rowsPerPage;
	$: end = start + rowsPerPage;
	$: pageData = transactions.slice(start, end);
	
	function formatIDR(amount) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function formatDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'short', 
			day: 'numeric' 
		});
	}
	
	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}
	
	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}
</script>

<div class="mt-10">
	<h2 class="mb-5 text-2xl">Recent Transactions</h2>
	
	<div class="bg-white rounded-2xl p-6 shadow-sm border border-bg-light">
		<table class="w-full border-collapse">
			<thead>
				<tr>
					<th class="text-left py-4 px-5 text-text-secondary font-semibold border-b border-bg-light text-sm">Date</th>
					<th class="text-left py-4 px-5 text-text-secondary font-semibold border-b border-bg-light text-sm">Details</th>
					<th class="text-left py-4 px-5 text-text-secondary font-semibold border-b border-bg-light text-sm">Category</th>
					<th class="text-right py-4 px-5 text-text-secondary font-semibold border-b border-bg-light text-sm">Amount</th>
				</tr>
			</thead>
			<tbody>
				{#each pageData as tx}
					<tr class="hover:bg-primary-green/5 transition-colors">
						<td class="py-5 px-5 border-b border-bg-light text-text-primary text-sm">{formatDate(tx.date)}</td>
						<td class="py-5 px-5 border-b border-bg-light">
							<div class="font-semibold text-sm">{tx.details}</div>
							<div class="text-xs text-text-secondary">{tx.account}</div>
						</td>
						<td class="py-5 px-5 border-b border-bg-light">
							<span class="bg-bg-light py-1 px-3 rounded-full text-xs font-medium">
								{tx.category}
							</span>
						</td>
						<td class="py-5 px-5 border-b border-bg-light text-right {tx.amount >= 0 ? 'text-green-600 font-semibold' : 'text-text-primary font-medium'} text-sm">
							{tx.amount > 0 ? '+' : ''}{formatIDR(tx.amount)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	
	<div class="flex justify-end items-center gap-4 mt-6 text-text-secondary text-sm">
		<button 
			on:click={prevPage}
			disabled={currentPage === 1}
			class="w-8 h-8 rounded-lg border border-border-color bg-white text-text-primary flex items-center justify-center transition-all hover:bg-text-black hover:text-white hover:border-text-black disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-light disabled:hover:bg-bg-light disabled:hover:text-text-primary"
		>
			<i class="fa-solid fa-chevron-left"></i>
		</button>
		<span>Page {currentPage} of {totalPages}</span>
		<button 
			on:click={nextPage}
			disabled={currentPage === totalPages}
			class="w-8 h-8 rounded-lg border border-border-color bg-white text-text-primary flex items-center justify-center transition-all hover:bg-text-black hover:text-white hover:border-text-black disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-light disabled:hover:bg-bg-light disabled:hover:text-text-primary"
		>
			<i class="fa-solid fa-chevron-right"></i>
		</button>
	</div>
</div>
