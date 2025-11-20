<script>
	import Header from './Header.svelte';
	
	/**
	 * Standardized page layout wrapper
	 * Provides consistent structure across all pages
	 */
	export let pageTitle = 'Shaft Finance';
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="min-h-screen bg-bg-light p-5">
	<div class="bg-white rounded-3xl min-h-[90vh] p-6 md:p-8 shadow-lg relative overflow-hidden">
		<Header />
		
		<!-- Main Content -->
		<div class="flex flex-col gap-8">
			<slot />
		</div>
	</div>
</div>
