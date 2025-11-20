<script>
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatIDR, formatDateID } from '$lib/utils/formatters';
	import { CATEGORIES } from '$lib/utils/constants';

	let transactions = [];
	let selectedFile = null;
	let isDragging = false;
	let isProcessing = false;
	let error = null;
	let successMessage = null;

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

	async function processDocument() {
		if (!selectedFile) return;

		isProcessing = true;
		error = null;
		successMessage = null;

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);

			const response = await fetch('/api/process-pdf', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to process PDF');
			}

			if (data.success && data.transactions) {
				transactions = data.transactions;
				successMessage = `Successfully extracted ${data.transactions.length} transactions`;
			} else {
				throw new Error('Invalid response from server');
			}

		} catch (err) {
			error = err.message || 'Failed to process document';
			console.error('Processing error:', err);
		} finally {
			isProcessing = false;
		}
	}

	function deleteTransaction(index) {
		transactions = transactions.filter((_, i) => i !== index);
	}

	function updateCategory(index, newCategory) {
		transactions[index].category = newCategory;
	}

	async function confirmImport() {
		if (transactions.length === 0) return;
		
		// TODO: Implement actual import to database
		alert(`Importing ${transactions.length} transactions...`);
		// After successful import, you might want to:
		// - Clear the transactions array
		// - Reset the form
		// - Navigate to another page
	}
</script>

<PageLayout pageTitle="Import Transactions - Shaft">
	<PageHeader title="Import Transactions" subtitle="Upload & Review" showActions={false} />

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
			<div class="mt-4 flex justify-end">
				<button 
					class="px-6 py-2.5 bg-text-black text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					on:click={processDocument}
					disabled={isProcessing}
				>
					{#if isProcessing}
						<i class="fa-solid fa-spinner fa-spin"></i>
						Processing...
					{:else}
						<i class="fa-solid fa-wand-magic-sparkles"></i>
						Process Document
					{/if}
				</button>
			</div>
		{/if}
	</div>

		<!-- Review Table -->
		<div class="mt-10">
			<h2 class="mb-5 text-2xl">Review Transactions</h2>
			
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
								<tr class="hover:bg-primary-green/5 transition-colors border-b border-gray-100">
									<td class="py-3 px-4 text-right font-medium text-sm">{formatDateID(transaction.date)}</td>
									<td class="py-3 px-4">
										<div class="text-sm text-text-secondary">{transaction.account}</div>
									</td>
									<td class="py-3 px-4">
										<div class="font-medium text-sm text-text-primary">{transaction.details}</div>
									</td>
									<td class="py-3 px-4">
										<select 
											value={transaction.category}
											on:change={(e) => updateCategory(i, e.target.value)}
											class="w-full bg-white border border-text-secondary rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-text-black focus:ring-1 focus:ring-text-black"
										>
											{#each CATEGORIES as cat}
												<option value={cat}>{cat}</option>
											{/each}
										</select>
									</td>
									<td class="py-3 px-4 text-right">
										<span class="{transaction.amount >= 0 ? 'text-green-600 font-semibold' : 'text-text-primary font-medium'} text-sm">
											{transaction.amount > 0 ? '+' : ''}{formatIDR(transaction.amount)}
										</span>
									</td>
									<td class="py-3 px-4">
										<div class="flex items-center justify-center gap-1.5">
											<button
												class="w-8 h-8 rounded flex items-center justify-center hover:bg-bg-light text-text-secondary transition-colors"
												title="Delete"
												on:click={() => deleteTransaction(i)}
											>
												<i class="fa-solid fa-trash text-sm"></i>
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
					</div>
					<button 
						class="px-6 py-2.5 bg-text-black text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all"
						on:click={confirmImport}
					>
						Confirm & Import
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
