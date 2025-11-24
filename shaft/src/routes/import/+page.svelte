<script>
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CategoryDropdown from '$lib/components/CategoryDropdown.svelte';
	import { formatIDR, formatDateID } from '$lib/utils/formatters';

	let transactions = [];
	let selectedFile = null;
	let isDragging = false;
	let isProcessing = false;
	let isCategorizing = false;
	let error = null;
	let successMessage = null;
	let hasCachedData = false;
	
	const CACHE_KEY = 'pending_transactions';
	
	// Reactive counts for transactions
	$: toImportCount = transactions.filter(tx => !tx._markedForDeletion).length;
	$: markedForDeletionCount = transactions.filter(tx => tx._markedForDeletion).length;
	
	onMount(() => {
		// Check if there's cached data
		checkCachedData();
	});
	
	function checkCachedData() {
		const cached = localStorage.getItem(CACHE_KEY);
		hasCachedData = !!cached;
	}
	
	function saveToCache(data) {
		localStorage.setItem(CACHE_KEY, JSON.stringify(data));
		hasCachedData = true;
	}
	
	function loadFromCache() {
		const cached = localStorage.getItem(CACHE_KEY);
		if (cached) {
			transactions = JSON.parse(cached);
			successMessage = `Loaded ${transactions.length} transactions from cache`;
		}
	}
	
	function clearCache() {
		localStorage.removeItem(CACHE_KEY);
		hasCachedData = false;
		transactions = [];
		successMessage = 'Cache cleared';
	}

	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file && file.type === 'application/pdf') {
			selectedFile = file;
			error = null;
			successMessage = null;
		} else if (file) {
			error = 'Please select a PDF file';
		}
	}

	function handleDrop(event) {
		isDragging = false;
		const file = event.dataTransfer.files[0];
		if (file && file.type === 'application/pdf') {
			selectedFile = file;
			error = null;
			successMessage = null;
		} else if (file) {
			error = 'Please select a PDF file';
		}
	}

	function handleDragOver(event) {
		isDragging = true;
	}

	function handleDragLeave(event) {
		isDragging = false;
	}

	async function extractPDF() {
		if (!selectedFile) return;

		isProcessing = true;
		error = null;
		successMessage = null;

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);

			const response = await fetch('/api/extract-pdf', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to extract PDF');
			}

			if (data.success && data.transactions) {
				transactions = data.transactions;
				saveToCache(data.transactions);
				successMessage = `Successfully extracted ${data.transactions.length} transactions. Now categorizing...`;
				
				// Automatically start categorization
				await categorizeTransactions();
			} else {
				throw new Error('Invalid response from server');
			}

		} catch (err) {
			error = err.message || 'Failed to extract document';
			console.error('Extraction error:', err);
		} finally {
			isProcessing = false;
		}
	}
	
	async function categorizeTransactions() {
		if (transactions.length === 0) return;

		isCategorizing = true;
		error = null;

		try {
			const response = await fetch('/api/categorize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ transactions })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to categorize transactions');
			}

			if (data.success && data.transactions) {
				transactions = data.transactions;
				saveToCache(data.transactions);
				successMessage = `Successfully categorized ${data.transactions.length} transactions`;
			} else {
				throw new Error('Invalid response from server');
			}

		} catch (err) {
			error = err.message || 'Failed to categorize transactions';
			console.error('Categorization error:', err);
		} finally {
			isCategorizing = false;
		}
	}

	function toggleDeleteTransaction(index) {
		// Toggle the _markedForDeletion flag
		transactions[index]._markedForDeletion = !transactions[index]._markedForDeletion;
		transactions = [...transactions]; // Trigger reactivity
		saveToCache(transactions); // Update cache
	}

	function updateCategory(index, newCategory) {
		transactions[index].category = newCategory;
		saveToCache(transactions); // Update cache when category changes
	}

	async function confirmImport() {
		// Filter out transactions marked for deletion
		const transactionsToImport = transactions.filter(tx => !tx._markedForDeletion);
		
		if (transactionsToImport.length === 0) {
			error = 'No transactions to import';
			return;
		}
		
		// TODO: Implement actual import to database
		alert(`Importing ${transactionsToImport.length} transactions...`);
		// After successful import, you might want to:
		// - Clear the transactions array and cache
		// - Reset the form
		// - Navigate to another page
		
		// Clear cache after successful import
		clearCache();
		transactions = [];
	}
</script>

<PageLayout pageTitle="Import Transactions - Shaft">
	<PageHeader title="Import Transactions" subtitle="Upload & Review" showActions={false} />

	<!-- Cache Controls -->
	{#if hasCachedData && transactions.length === 0}
		<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
			<div class="flex items-center gap-3">
				<i class="fa-solid fa-database text-blue-500 text-xl"></i>
				<div>
					<p class="text-sm font-semibold text-blue-800">Cached Transactions Available</p>
					<p class="text-xs text-blue-600">You have previously extracted transactions saved</p>
				</div>
			</div>
			<div class="flex gap-2">
				<button 
					class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all"
					on:click={loadFromCache}
				>
					<i class="fa-solid fa-download"></i> Load from Cache
				</button>
				<button 
					class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-all"
					on:click={clearCache}
				>
					<i class="fa-solid fa-trash"></i> Clear
				</button>
			</div>
		</div>
	{/if}

	<!-- Upload Section -->
	<div class="p-5 rounded-2xl bg-white border border-bg-light mb-6">
		<div class="flex justify-between mb-4">
			<span class="text-xs text-text-secondary uppercase tracking-wider">Upload Document</span>
			<i class="fa-solid fa-file-arrow-up text-text-secondary"></i>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
				<i class="fa-solid fa-circle-exclamation text-red-500 mt-0.5"></i>
				<div class="flex-1">
					<p class="text-sm font-semibold text-red-800">Error</p>
					<p class="text-sm text-red-600">{error}</p>
				</div>
				<button 
					class="text-red-400 hover:text-red-600"
					on:click={() => error = null}
				>
					<i class="fa-solid fa-times"></i>
				</button>
			</div>
		{/if}

		<!-- Success Message -->
		{#if successMessage}
			<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
				<i class="fa-solid fa-circle-check text-green-500 mt-0.5"></i>
				<div class="flex-1">
					<p class="text-sm font-semibold text-green-800">Success</p>
					<p class="text-sm text-green-600">{successMessage}</p>
				</div>
				<button 
					class="text-green-400 hover:text-green-600"
					on:click={() => successMessage = null}
				>
					<i class="fa-solid fa-times"></i>
				</button>
			</div>
		{/if}

		<div 
			role="button"
			tabindex="0"
			class="border-2 border-dashed rounded-xl p-12 text-center transition-all {isDragging ? 'border-text-black bg-bg-light' : 'border-bg-light'}"
			on:drop|preventDefault={handleDrop}
			on:dragover|preventDefault={handleDragOver}
			on:dragleave={handleDragLeave}
		>
			{#if selectedFile}
				<div class="flex items-center justify-center gap-3 mb-4">
					<i class="fa-solid fa-file-pdf text-4xl text-red-500"></i>
					<div class="text-left">
						<div class="font-semibold text-text-black">{selectedFile.name}</div>
						<div class="text-sm text-text-secondary">{(selectedFile.size / 1024).toFixed(2)} KB</div>
					</div>
				</div>
				<button 
					class="px-4 py-2 bg-text-black text-white rounded-lg text-sm hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					on:click={() => {
						selectedFile = null;
						error = null;
						successMessage = null;
					}}
					disabled={isProcessing}
				>
					Remove File
				</button>
			{:else}
				<i class="fa-solid fa-cloud-arrow-up text-5xl text-text-secondary mb-4"></i>
				<p class="text-text-black font-semibold mb-2">Drag and drop your PDF here</p>
				<p class="text-sm text-text-secondary mb-4">or</p>
				<label class="px-4 py-2 bg-text-black text-white rounded-lg text-sm cursor-pointer hover:bg-opacity-90 transition-all inline-block">
					Browse Files
					<input 
						type="file" 
						accept="application/pdf" 
						class="hidden"
						on:change={handleFileSelect}
					/>
				</label>
				<p class="text-xs text-text-secondary mt-4">Supported format: PDF (Max 10MB)</p>
			{/if}
		</div>

		{#if selectedFile}
			<div class="mt-4 flex justify-end gap-3">
				<button 
					class="px-6 py-2.5 bg-text-black text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					on:click={extractPDF}
					disabled={isProcessing || isCategorizing}
				>
					{#if isProcessing}
						<i class="fa-solid fa-spinner fa-spin"></i>
						Extracting...
					{:else if isCategorizing}
						<i class="fa-solid fa-spinner fa-spin"></i>
						Categorizing...
					{:else}
						Extract & Categorize
					{/if}
				</button>
			</div>
		{/if}
	</div>

		<!-- Review Table -->
		<div class="mt-10">
			<div class="flex justify-between items-center mb-5">
				<h2 class="text-2xl">Review Transactions</h2>
				{#if transactions.length > 0}
					<button 
						class="px-4 py-2 bg-text-black text-white rounded-lg text-sm hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						on:click={categorizeTransactions}
						disabled={isCategorizing}
					>
						{#if isCategorizing}
							<i class="fa-solid fa-spinner fa-spin"></i>
							Re-categorizing...
						{:else}
							<i class="fa-solid fa-rotate"></i>
							Re-categorize All
						{/if}
					</button>
				{/if}
			</div>
			
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
							{#each transactions as transaction, i}
							<tr class="transition-colors border-b border-gray-100 {transaction._markedForDeletion ? 'bg-gray-100 opacity-50' : 'hover:bg-primary-green/5'}">
								<td class="py-3 px-4 text-right font-medium text-sm {transaction._markedForDeletion ? 'line-through text-gray-400' : ''}">{formatDateID(transaction.date)}</td>
								<td class="py-3 px-4">
									<div class="text-sm {transaction._markedForDeletion ? 'line-through text-gray-400' : 'text-text-secondary'}">{transaction.account}</div>
								</td>
								<td class="py-3 px-4">
									<div class="font-medium text-sm {transaction._markedForDeletion ? 'line-through text-gray-400' : 'text-text-primary'}">{transaction.details}</div>
								</td>
								<td class="py-3 px-4">
									{#if transaction._markedForDeletion}
										<span class="text-sm text-gray-400 line-through">{transaction.category}</span>
									{:else}
										<CategoryDropdown 
											value={transaction.category}
											onChange={(newCategory) => updateCategory(i, newCategory)}
										/>
									{/if}
								</td>
								<td class="py-3 px-4 text-right">
									<span class="{transaction._markedForDeletion ? 'text-gray-400 line-through' : transaction.amount >= 0 ? 'text-green-600 font-semibold' : 'text-text-primary font-medium'} text-sm font-mono">
										{transaction.amount > 0 ? '+' : ''}{formatIDR(transaction.amount)}
									</span>
								</td>
								<td class="py-3 px-4">
									<div class="flex items-center justify-center gap-1.5">
										<button
											class="w-8 h-8 rounded flex items-center justify-center transition-colors {transaction._markedForDeletion ? 'hover:bg-green-100 text-green-600' : 'hover:bg-red-100 text-red-600'}"
											title={transaction._markedForDeletion ? 'Restore' : 'Mark for deletion'}
											on:click={() => toggleDeleteTransaction(i)}
										>
											<i class="fa-solid {transaction._markedForDeletion ? 'fa-rotate-left' : 'fa-trash'} text-sm"></i>
										</button>
									</div>
								</td>
							</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			
			{#if transactions.length > 0}
				<div class="flex justify-between items-center mt-4 text-text-secondary text-sm">
					<div class="text-sm">
						Showing <span class="font-semibold text-text-black">{transactions.length}</span> transactions
						{#if markedForDeletionCount > 0}
							<span class="text-red-600">({markedForDeletionCount} marked for deletion, {toImportCount} to import)</span>
						{/if}
					</div>
					<button 
						class="px-6 py-2.5 bg-text-black text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						on:click={confirmImport}
						disabled={toImportCount === 0}
					>
						Confirm & Import ({toImportCount})
					</button>
				</div>
			{:else}
				<div class="text-center py-8 text-text-secondary">
					<i class="fa-solid fa-inbox text-4xl mb-3"></i>
					<p class="text-sm">No transactions to review yet. Upload a PDF to get started.</p>
				</div>
			{/if}
		</div>
	</PageLayout>
