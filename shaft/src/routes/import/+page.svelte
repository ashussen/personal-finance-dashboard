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
	let isImporting = false;
	let error = null;
	let successMessage = null;
	let hasPendingData = false;
	let currentBatchId = null;
	
	// Reactive counts for transactions
	$: toImportCount = transactions.filter(tx => !tx.marked_for_deletion).length;
	$: markedForDeletionCount = transactions.filter(tx => tx.marked_for_deletion).length;
	
	onMount(() => {
		// Check if there's pending data in database
		checkPendingData();
	});
	
	async function checkPendingData() {
		try {
			const response = await fetch('/api/pending');
			const data = await response.json();
			if (data.success && data.transactions.length > 0) {
				hasPendingData = true;
			}
		} catch (err) {
			console.error('Error checking pending data:', err);
		}
	}
	
	async function loadFromDatabase() {
		try {
			const response = await fetch('/api/pending');
			const data = await response.json();
			if (data.success && data.transactions.length > 0) {
				transactions = data.transactions;
				successMessage = `Loaded ${transactions.length} pending transactions from database`;
			}
		} catch (err) {
			error = 'Failed to load pending transactions';
			console.error('Error loading pending:', err);
		}
	}
	
	async function clearPending() {
		try {
			await fetch('/api/pending?clearAll=true', { method: 'DELETE' });
			hasPendingData = false;
			transactions = [];
			currentBatchId = null;
			successMessage = 'Pending transactions cleared';
		} catch (err) {
			error = 'Failed to clear pending transactions';
			console.error('Error clearing pending:', err);
		}
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
				
				// Save categorized transactions to pending database
				await saveToPending(data.transactions);
				
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
	
	async function saveToPending(txs) {
		try {
			const response = await fetch('/api/pending', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ transactions: txs })
			});
			const data = await response.json();
			if (data.success) {
				currentBatchId = data.batchId;
				hasPendingData = true;
				// Reload to get the database IDs
				await loadFromDatabase();
			}
		} catch (err) {
			console.error('Error saving to pending:', err);
		}
	}

	async function toggleDeleteTransaction(index) {
		const tx = transactions[index];
		
		try {
			await fetch('/api/pending', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: tx.id, action: 'toggleDelete' })
			});
			
			// Update local state
			transactions[index].marked_for_deletion = !transactions[index].marked_for_deletion;
			transactions = [...transactions];
		} catch (err) {
			error = 'Failed to update transaction';
			console.error('Error toggling deletion:', err);
		}
	}

	async function updateCategory(index, newCategory) {
		const tx = transactions[index];
		
		try {
			await fetch('/api/pending', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: tx.id, action: 'updateCategory', category: newCategory })
			});
			
			// Update local state
			transactions[index].category = newCategory;
			transactions = [...transactions];
		} catch (err) {
			error = 'Failed to update category';
			console.error('Error updating category:', err);
		}
	}

	async function confirmImport() {
		if (toImportCount === 0) {
			error = 'No transactions to import';
			return;
		}
		
		isImporting = true;
		error = null;
		
		try {
			const response = await fetch('/api/pending/confirm', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ batchId: currentBatchId })
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error || 'Failed to import transactions');
			}
			
			successMessage = data.message;
			transactions = [];
			hasPendingData = false;
			currentBatchId = null;
			selectedFile = null;
			
		} catch (err) {
			error = err.message || 'Failed to import transactions';
			console.error('Import error:', err);
		} finally {
			isImporting = false;
		}
	}
</script>

<PageLayout pageTitle="Import Transactions - Shaft">
	<PageHeader title="Import Transactions" subtitle="Upload & Review" showActions={false} />

	<!-- Pending Transactions Controls -->
	{#if hasPendingData && transactions.length === 0}
		<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
			<div class="flex items-center gap-3">
				<i class="fa-solid fa-database text-blue-500 text-xl"></i>
				<div>
					<p class="text-sm font-semibold text-blue-800">Pending Transactions Available</p>
					<p class="text-xs text-blue-600">You have previously extracted transactions saved in database</p>
				</div>
			</div>
			<div class="flex gap-2">
				<button 
					class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all"
					on:click={loadFromDatabase}
				>
					<i class="fa-solid fa-download"></i> Load Pending
				</button>
				<button 
					class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-all"
					on:click={clearPending}
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
							<tr class="transition-colors border-b border-gray-100 {transaction.marked_for_deletion ? 'bg-gray-100 opacity-50' : 'hover:bg-primary-green/5'}">
								<td class="py-3 px-4 text-right font-medium text-sm {transaction.marked_for_deletion ? 'line-through text-gray-400' : ''}">{formatDateID(transaction.date)}</td>
								<td class="py-3 px-4">
									<div class="text-sm {transaction.marked_for_deletion ? 'line-through text-gray-400' : 'text-text-secondary'}">{transaction.account}</div>
								</td>
								<td class="py-3 px-4">
									<div class="font-medium text-sm {transaction.marked_for_deletion ? 'line-through text-gray-400' : 'text-text-primary'}">{transaction.details}</div>
								</td>
								<td class="py-3 px-4">
									{#if transaction.marked_for_deletion}
										<span class="text-sm text-gray-400 line-through">{transaction.category}</span>
									{:else}
										<CategoryDropdown 
											value={transaction.category}
											onChange={(newCategory) => updateCategory(i, newCategory)}
										/>
									{/if}
								</td>
								<td class="py-3 px-4 text-right">
									<span class="{transaction.marked_for_deletion ? 'text-gray-400 line-through' : transaction.amount >= 0 ? 'text-green-600 font-semibold' : 'text-text-primary font-medium'} text-sm font-mono">
										{transaction.amount > 0 ? '+' : ''}{formatIDR(transaction.amount)}
									</span>
								</td>
								<td class="py-3 px-4">
									<div class="flex items-center justify-center gap-1.5">
										<button
											class="w-8 h-8 rounded flex items-center justify-center transition-colors {transaction.marked_for_deletion ? 'hover:bg-green-100 text-green-600' : 'hover:bg-red-100 text-red-600'}"
											title={transaction.marked_for_deletion ? 'Restore' : 'Mark for deletion'}
											on:click={() => toggleDeleteTransaction(i)}
										>
											<i class="fa-solid {transaction.marked_for_deletion ? 'fa-rotate-left' : 'fa-trash'} text-sm"></i>
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
