<script>
	import { formatIDR, formatDate } from '$lib/utils/formatters';
	import CategoryDropdown from './CategoryDropdown.svelte';
	import Pagination from './Pagination.svelte';
	
	export let transactions = [];
	
	let currentPage = 1;
	const rowsPerPage = 15;
	
	
	// Track editing state for each row
	let editingRows = {};
	let editedData = {};
	
	$: totalPages = Math.ceil(transactions.length / rowsPerPage);
	$: start = (currentPage - 1) * rowsPerPage;
	$: end = start + rowsPerPage;
	$: pageData = transactions.slice(start, end);
	
	
	function handlePageChange(page) {
		currentPage = page;
	}
	
	function startEditing(index, tx) {
		const actualIndex = start + index;
		editingRows[actualIndex] = true;
		editedData[actualIndex] = {
			category: tx.category,
			amount: tx.amount
		};
		editingRows = {...editingRows};
	}
	
	function cancelEdit(index) {
		const actualIndex = start + index;
		delete editingRows[actualIndex];
		delete editedData[actualIndex];
		editingRows = {...editingRows};
	}
	
	function saveEdit(index) {
		const actualIndex = start + index;
		if (editedData[actualIndex]) {
			transactions[actualIndex].category = editedData[actualIndex].category;
			transactions[actualIndex].amount = editedData[actualIndex].amount;
			transactions = [...transactions];
		}
		delete editingRows[actualIndex];
		delete editedData[actualIndex];
		editingRows = {...editingRows};
	}
	
	function updateCategory(index, value) {
		const actualIndex = start + index;
		if (!editedData[actualIndex]) {
			editedData[actualIndex] = { category: value, amount: transactions[actualIndex].amount };
		} else {
			editedData[actualIndex].category = value;
		}
	}
	
	function updateAmount(index, value) {
		const actualIndex = start + index;
		const numValue = parseFloat(value) || 0;
		if (!editedData[actualIndex]) {
			editedData[actualIndex] = { category: transactions[actualIndex].category, amount: numValue };
		} else {
			editedData[actualIndex].amount = numValue;
		}
	}
	
	function isEditing(index) {
		const actualIndex = start + index;
		return editingRows[actualIndex] === true;
	}
	
	function getEditValue(index, field) {
		const actualIndex = start + index;
		return editedData[actualIndex]?.[field];
	}
</script>

<div class="mt-10">
	<h2 class="mb-5 text-2xl">Expense Transactions</h2>
	
	<div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-bg-light">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse">
				<thead>
					<tr class="bg-bg-light">
						<th class="text-left py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">Date</th>
						<th class="text-left py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">Account</th>
						<th class="text-left py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">Details</th>
						<th class="text-left py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">Category</th>
						<th class="text-right py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">Amount</th>
						<th class="text-center py-3 px-4 text-text-secondary font-medium text-sm uppercase tracking-wide border-b border-gray-200">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each pageData as tx, index}
						<tr class="hover:bg-primary-green/5 transition-colors border-b border-gray-100">
							<td class="py-3 px-4 text-text-primary text-sm">{formatDate(tx.date)}</td>
							<td class="py-3 px-4">
								<div class="text-sm text-text-secondary">{tx.account}</div>
							</td>
							<td class="py-3 px-4">
								<div class="font-medium text-sm text-text-primary">{tx.details}</div>
							</td>
							<td class="py-3 px-4">
								{#if isEditing(index)}
									<CategoryDropdown 
										value={getEditValue(index, 'category') || tx.category}
										onChange={(newCategory) => updateCategory(index, newCategory)}
									/>
								{:else}
									<span class="text-text-primary text-sm font-medium">{tx.category}</span>
								{/if}
							</td>
							<td class="py-3 px-4 text-right">
								{#if isEditing(index)}
									<input 
										type="number"
										value={getEditValue(index, 'amount') ?? tx.amount}
										on:input={(e) => updateAmount(index, e.target.value)}
										class="w-full bg-white border border-text-secondary rounded px-2.5 py-1.5 text-sm text-right font-mono focus:outline-none focus:border-text-black focus:ring-1 focus:ring-text-black"
										step="0.01"
									/>
								{:else}
									<span class="{tx.amount >= 0 ? 'text-green-600 font-semibold' : 'text-text-primary font-medium'} text-sm font-mono">
										{tx.amount > 0 ? '+' : ''}{formatIDR(tx.amount)}
									</span>
								{/if}
							</td>
							<td class="py-3 px-4">
								<div class="flex items-center justify-center gap-1.5">
									{#if isEditing(index)}
										<button
											on:click={() => saveEdit(index)}
											class="w-8 h-8 rounded flex items-center justify-center hover:bg-primary-green/20 text-text-black transition-colors"
											title="Save"
										>
											<i class="fa-solid fa-check text-sm"></i>
										</button>
										<button
											on:click={() => cancelEdit(index)}
											class="w-8 h-8 rounded flex items-center justify-center hover:bg-text-secondary/20 text-text-secondary transition-colors"
											title="Cancel"
										>
											<i class="fa-solid fa-xmark text-sm"></i>
										</button>
									{:else}
										<button
											on:click={() => startEditing(index, tx)}
											class="w-8 h-8 rounded flex items-center justify-center hover:bg-bg-light text-text-secondary transition-colors"
											title="Edit"
										>
											<i class="fa-solid fa-pen text-sm"></i>
										</button>
										<button
											class="w-8 h-8 rounded flex items-center justify-center hover:bg-bg-light text-text-secondary transition-colors"
											title="Delete"
										>
											<i class="fa-solid fa-trash text-sm"></i>
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
	
	<Pagination {currentPage} {totalPages} onPageChange={handlePageChange} />
</div>
