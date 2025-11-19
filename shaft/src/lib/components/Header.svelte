<script>
	// No props needed for static header
</script>

<header class="flex justify-between items-center mb-10">
	<!-- Logo -->
	<div class="flex items-center gap-2 font-bold text-xl">
		<i class="fa-solid fa-caret-right"></i>
		<span>Shaft</span>
	</div>

	<!-- Navigation Pill -->
	<div class="bg-bg-light p-1.5 rounded-xl flex gap-1">
		<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-text-black hover:text-white">
			<i class="fa-solid fa-house"></i>
		</div>
		<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer bg-text-black text-white">
			<i class="fa-solid fa-folder"></i>
		</div>
		<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-text-black hover:text-white">
			<i class="fa-solid fa-bolt"></i>
		</div>
		<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-text-black hover:text-white">
			<i class="fa-solid fa-briefcase"></i>
		</div>
		<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-text-black hover:text-white">
			<i class="fa-solid fa-file-lines"></i>
		</div>
		<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-text-black hover:text-white">
			<i class="fa-solid fa-building-columns"></i>
		</div>
		<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-text-black hover:text-white">
			<i class="fa-solid fa-comment-dots"></i>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="bg-bg-light py-2.5 px-4 rounded-xl flex items-center gap-2.5 text-text-secondary w-[300px]">
		<i class="fa-solid fa-magnifying-glass"></i>
		<input 
			type="text" 
			placeholder="Type Transaction Name..." 
			class="bg-transparent border-none outline-none w-full text-sm"
		/>
	</div>

	<!-- User Profile -->
	<div class="flex items-center gap-3">
		<div class="bg-transparent p-1.5 rounded-xl flex gap-1">
			<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-bg-light">
				<i class="fa-solid fa-bell"></i>
			</div>
			<div class="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer text-text-secondary transition-all hover:bg-bg-light">
				<i class="fa-solid fa-gear"></i>
			</div>
		</div>
		<div class="w-10 h-10 rounded-full bg-text-gray" style="background-image: url('https://api.dicebear.com/7.x/avataaars/svg?seed=Stewart'); background-size: cover;"></div>
		<div class="leading-tight">
			<div class="font-bold text-sm">Stewart Menzies</div>
			<div class="text-xs text-text-secondary">Manager</div>
		</div>
	</div>
</header>
