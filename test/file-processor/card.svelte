---
filename: card.svelte
dev: true
customElement: "ca-rd"
css: injected
---

<h1>
	{message}
</h1>

<script>
	let message = $state('Hello, my name is John Deighan');
</script>
