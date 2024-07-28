---
filename: card.svelte
dev: true
customElement: true
css: injected
---
<svelte-options customElement="ca-rd"/>

<h1>
	{message}
</h1>

<script>
	let message = $state('Hello, my name is John Deighan');
</script>
