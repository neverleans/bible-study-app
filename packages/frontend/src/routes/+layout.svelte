<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import {
    currentUser,
    isAuthenticated,
    isAuthLoading,
    showAuthModal,
    authNotification,
    initAuth,
    logout,
  } from '$stores/auth';
  import AuthModal from '$components/auth/AuthModal.svelte';

  let { children } = $props();
  let isDark = $state(false);

  onMount(async () => {
    isDark = localStorage.getItem('theme') === 'dark';
    updateTheme();
    await initAuth();
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

  function dismissNotification() {
    authNotification.set(null);
  }
</script>

<div class="min-h-screen" style="background-color: var(--color-bg); color: var(--color-text)">
  <!-- Global Notification Banner (e.g. Sync notes success) -->
  {#if $authNotification}
    <div class="px-6 py-2.5 bg-blue-600 text-white text-xs font-medium flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-2 max-w-6xl mx-auto w-full">
        <span>{$authNotification}</span>
      </div>
      <button
        onclick={dismissNotification}
        class="text-white hover:opacity-80 px-2 py-0.5 rounded cursor-pointer"
        aria-label="Dispensar aviso"
      >
        ✕
      </button>
    </div>
  {/if}

  <header class="border-b px-6 py-4 flex items-center justify-between" style="border-color: var(--color-border)">
    <div class="flex items-center gap-4">
      <a href="/" class="text-xl font-bold flex items-center gap-2" style="color: var(--color-primary)">
        <span>📖</span>
        <span>Estudo Bíblico</span>
      </a>

      <!-- Guest vs Authenticated Status Badge -->
      {#if !$isAuthLoading}
        {#if $isAuthenticated && $currentUser}
          <div
            class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
            title="Sincronizado na nuvem com isolamento PostgreSQL RLS"
          >
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>RLS Ativo ({$currentUser.name || $currentUser.email.split('@')[0]})</span>
          </div>
        {:else}
          <div
            class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
            title="Recursos básicos liberados. Suas anotações ficam salvas neste navegador."
          >
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Modo Visitante</span>
          </div>
        {/if}
      {/if}
    </div>

    <nav class="flex items-center gap-3">
      <a href="/" class="text-sm hover:underline" style="color: var(--color-muted)">Início</a>
      <a
        href="/notes"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:border-blue-500 cursor-pointer"
        style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
      >
        <span>📝</span>
        <span>Anotações</span>
      </a>
      <a
        href="/search"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:border-blue-500 cursor-pointer"
        style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
      >
        <span>🔍</span>
        <span>Buscar</span>
      </a>

      <!-- Auth Controls in Nav -->
      {#if !$isAuthLoading}
        {#if $isAuthenticated && $currentUser}
          <div class="flex items-center gap-2 border-l pl-3 ml-1" style="border-color: var(--color-border)">
            <button
              onclick={logout}
              class="px-3 py-1.5 rounded-lg border text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer text-red-500 hover:text-red-600"
              style="border-color: var(--color-border); background-color: var(--color-surface)"
              title="Encerrar sessão"
            >
              Sair
            </button>
          </div>
        {:else}
          <div class="flex items-center gap-2 border-l pl-3 ml-1" style="border-color: var(--color-border)">
            <button
              onclick={() => showAuthModal.set(true)}
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <span>🔑</span>
              <span>Entrar</span>
            </button>
          </div>
        {/if}
      {/if}

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
    Estudo Bíblico &copy; {new Date().getFullYear()} — Plataforma de Estudo e Exegese Bíblica
  </footer>

  <!-- Auth Modal -->
  <AuthModal />
</div>
