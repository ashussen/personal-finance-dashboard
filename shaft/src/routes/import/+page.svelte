<script>
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatIDR, formatDateID } from '$lib/utils/formatters';
	import { CATEGORIES } from '$lib/utils/constants';

	// Sample data based on transactions.csv structure
	let transactions = [
		{ date: '2025-11-20', details: 'Gofood', amount: -45000, account: 'GoPay', category: 'Food' },
		{ date: '2025-11-19', details: 'Shell', amount: -250000, account: 'BCA', category: 'Transport' },
		{ date: '2025-11-18', details: 'Monthly Salary', amount: 15000000, account: 'Mandiri', category: 'Salary' },
		{ date: '2025-11-17', details: 'Tokopedia', amount: -125000, account: 'BCA', category: 'Shopping' },
		{ date: '2025-11-16', details: 'PLN Token', amount: -500000, account: 'Mandiri', category: 'Bills' },
		{ date: '2025-11-15', details: 'Netflix', amount: -186000, account: 'BCA', category: 'Entertainment' },
		{ date: '2025-11-14', details: 'Starbucks', amount: -85000, account: 'Jenius', category: 'Food' },
		{ date: '2025-11-13', details: 'Grab', amount: -35000, account: 'OVO', category: 'Transport' },
		{ date: '2025-11-12', details: 'Bibit', amount: -2000000, account: 'BCA', category: 'Investment' },
		{ date: '2025-11-11', details: 'Indomaret', amount: -67000, account: 'GoPay', category: 'Food' }
	];

	let selectedFile = null;
	let isDragging = false;

	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file && file.type === 'application/pdf') {
			selectedFile = file;
		}
	}

	function handleDrop(event) {
		isDragging = false;
		const file = event.dataTransfer.files[0];
		if (file && file.type === 'application/pdf') {
			selectedFile = file;
		}
	}

	function handleDragOver(event) {
		isDragging = true;
	}

	function handleDragLeave(event) {
		isDragging = false;
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
						class="px-4 py-2 bg-text-black text-white rounded-lg text-sm hover:bg-opacity-90 transition-all"
						on:click={() => selectedFile = null}
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
					<button class="px-6 py-2.5 bg-text-black text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all">
						Process Document
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
			
			<div class="flex justify-between items-center mt-4 text-text-secondary text-sm">
				<div class="text-sm">
					Showing <span class="font-semibold text-text-black">{transactions.length}</span> transactions
				</div>
				<button class="px-6 py-2.5 bg-text-black text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all">
					Confirm & Import
				</button>
			</div>
		</div>
	</PageLayout>
