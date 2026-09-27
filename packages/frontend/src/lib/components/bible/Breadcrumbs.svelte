<script lang="ts">
  interface Crumb {
    label: string;
    href?: string;
  }

  let { items }: { items: Crumb[] } = $props();
</script>

<nav class="flex items-center space-x-2 text-sm mb-6 select-none" style="color: var(--color-muted)">
  {#each items as item, i}
    {#if i > 0}
      <span>/</span>
    {/if}
    {#if item.href && i < items.length - 1}
      <a href={item.href} class="hover:underline hover:text-blue-500 transition-colors">
        {item.label}
      </a>
    {:else}
      <span class="font-medium" style="color: var(--color-text)">
        {item.label}
      </span>
    {/if}
  {/each}
</nav>
