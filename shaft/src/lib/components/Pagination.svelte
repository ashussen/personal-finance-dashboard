<script>
	/**
	 * Reusable pagination component
	 */
	export let currentPage = 1;
	export let totalPages = 1;
	export let onPageChange = (page) => {};
	
	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			onPageChange(currentPage);
		}
	}
	
	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			onPageChange(currentPage);
		}
	}
</script>

<div class="flex justify-between items-center mt-4 text-text-secondary text-sm">
	<button 
		on:click={prevPage}
		disabled={currentPage === 1}
		class="px-4 py-2 rounded-lg border border-bg-light bg-white text-text-primary flex items-center gap-2 transition-all hover:bg-bg-light disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white text-sm"
	>
		<i class="fa-solid fa-chevron-left text-xs"></i>
		Previous
	</button>
	<span class="text-sm">
		<slot name="info">
			Page {currentPage} of {totalPages}
		</slot>
	</span>
	<button 
		on:click={nextPage}
		disabled={currentPage === totalPages}
		class="px-4 py-2 rounded-lg border border-bg-light bg-white text-text-primary flex items-center gap-2 transition-all hover:bg-bg-light disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white text-sm"
	>
		Next
		<i class="fa-solid fa-chevron-right text-xs"></i>
	</button>
</div>
