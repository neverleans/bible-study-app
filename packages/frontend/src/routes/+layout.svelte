<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';

  let { children } = $props();
  let isDark = $state(false);

  onMount(() => {
    isDark = localStorage.getItem('theme') === 'dark';
    updateTheme();
  });

  function toggleTheme() {
    isDark = !isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateTheme();
  }

  function updateTheme() {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
</script>

<div class="min-h-screen" style="background-color: var(--color-bg); color: var(--color-text)">
  <header class="border-b px-6 py-4 flex items-center justify-between" style="border-color: var(--color-border)">
    <a href="/" class="text-xl font-bold flex items-center gap-2" style="color: var(--color-primary)">
      <span>📖</span>
      <span>Estudo Bíblico</span>
    </a>
    <nav class="flex items-center gap-3">
      <a href="/" class="text-sm hover:underline" style="color: var(--color-muted)">Início</a>
      <a
        href="/search"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:border-blue-500 cursor-pointer"
        style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
      >
        <span>🔍</span>
        <span>Buscar</span>
      </a>
      <button
        onclick={toggleTheme}
        class="p-2 rounded-lg transition-colors cursor-pointer"
        style="background-color: var(--color-surface)"
        aria-label="Alternar tema claro/escuro"
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    </nav>
  </header>

  <main class="max-w-6xl mx-auto px-6 py-8">
    {@render children()}
  </main>

  <footer class="border-t px-6 py-4 text-center text-sm" style="border-color: var(--color-border); color: var(--color-muted)">
    Estudo Bíblico &copy; {new Date().getFullYear()}
  </footer>
</div>
