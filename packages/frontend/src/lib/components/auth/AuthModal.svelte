<script lang="ts">
  import { showAuthModal, login, register, getGuestNotes } from '$stores/auth';
  import { onMount } from 'svelte';

  let activeTab = $state<'login' | 'register'>('login');
  let email = $state('');
  let password = $state('');
  let name = $state('');
  let isLoading = $state(false);
  let errorMessage = $state<string | null>(null);
  let guestNotesCount = $state(0);

  onMount(() => {
    guestNotesCount = getGuestNotes().length;
  });

  function close() {
    showAuthModal.set(false);
    errorMessage = null;
  }

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    if (!email.trim() || !password || isLoading) return;

    isLoading = true;
    errorMessage = null;

    try {
      await login(email.trim(), password);
      close();
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Falha ao autenticar';
    } finally {
      isLoading = false;
    }
  }

  async function handleRegister(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || isLoading) return;

    if (password.length < 6) {
      errorMessage = 'A senha deve conter pelo menos 6 caracteres.';
      return;
    }

    isLoading = true;
    errorMessage = null;

    try {
      await register(name.trim(), email.trim(), password);
      close();
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Falha ao criar conta';
    } finally {
      isLoading = false;
    }
  }
</script>

{#if $showAuthModal}
  <!-- Backdrop -->
  <div
    role="button"
    tabindex="0"
    class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity"
    onclick={close}
    onkeydown={(e) => e.key === 'Escape' && close()}
    aria-label="Fechar janela de autenticação"
  >
    <!-- Modal Window -->
    <div
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      class="max-w-md w-full rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text)"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Modal Header -->
      <div
        class="px-6 pt-6 pb-4 border-b flex items-start justify-between"
        style="border-color: var(--color-border); background-color: var(--color-surface)"
      >
        <div>
          <h2 class="text-xl font-bold flex items-center gap-2" style="color: var(--color-text)">
            <span>🔐</span>
            <span>{activeTab === 'login' ? 'Acessar Conta' : 'Criar Nova Conta'}</span>
          </h2>
          <p class="text-xs mt-1" style="color: var(--color-muted)">
            Sincronização na nuvem protegida por PostgreSQL Row-Level Security (RLS).
          </p>
        </div>
        <button
          onclick={close}
          class="p-1.5 rounded-lg border text-xs cursor-pointer hover:opacity-80"
          style="border-color: var(--color-border); background-color: var(--color-bg)"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <!-- Guest Note Sync Alert (if any guest notes found) -->
      {#if guestNotesCount > 0}
        <div class="mx-6 mt-4 p-3 rounded-xl text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
          <span class="text-lg">💡</span>
          <div>
            <strong>{guestNotesCount} anotação(ões) local(is) detectada(s):</strong>
            <p class="mt-0.5 opacity-90">Ao entrar ou se cadastrar, todas serão migradas automaticamente para sua conta segura.</p>
          </div>
        </div>
      {/if}

      <!-- Tabs Navigation -->
      <div class="px-6 pt-4 flex border-b" style="border-color: var(--color-border)">
        <button
          class="flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer {activeTab === 'login' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
          onclick={() => { activeTab = 'login'; errorMessage = null; }}
        >
          Já tenho uma conta
        </button>
        <button
          class="flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer {activeTab === 'register' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
          onclick={() => { activeTab = 'register'; errorMessage = null; }}
        >
          Criar conta gratuita
        </button>
      </div>

      <!-- Error alert -->
      {#if errorMessage}
        <div class="mx-6 mt-4 p-3 rounded-xl text-xs bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
          {errorMessage}
        </div>
      {/if}

      <!-- Form Body -->
      <div class="p-6">
        {#if activeTab === 'login'}
          <form onsubmit={handleLogin} class="space-y-4">
            <div>
              <label for="login-email" class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-muted)">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                required
                bind:value={email}
                placeholder="seu.email@exemplo.com"
                class="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500"
                style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
              />
            </div>

            <div>
              <label for="login-password" class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-muted)">
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                required
                bind:value={password}
                placeholder="••••••••"
                class="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500"
                style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              class="w-full mt-2 py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {#if isLoading}
                <span>⏳ Entrando...</span>
              {:else}
                <span>Entrar na Conta</span>
              {/if}
            </button>
          </form>
        {:else}
          <form onsubmit={handleRegister} class="space-y-4">
            <div>
              <label for="reg-name" class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-muted)">
                Nome Completo
              </label>
              <input
                id="reg-name"
                type="text"
                required
                bind:value={name}
                placeholder="Seu Nome"
                class="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500"
                style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
              />
            </div>

            <div>
              <label for="reg-email" class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-muted)">
                E-mail
              </label>
              <input
                id="reg-email"
                type="email"
                required
                bind:value={email}
                placeholder="seu.email@exemplo.com"
                class="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500"
                style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
              />
            </div>

            <div>
              <label for="reg-password" class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-muted)">
                Senha (mínimo 6 dígitos)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minlength="6"
                bind:value={password}
                placeholder="••••••••"
                class="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500"
                style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text)"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              class="w-full mt-2 py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {#if isLoading}
                <span>⏳ Criando sua conta...</span>
              {:else}
                <span>Cadastrar e Começar</span>
              {/if}
            </button>
          </form>
        {/if}

        <!-- Guest mode fallback notice -->
        <div class="mt-6 pt-4 border-t text-center" style="border-color: var(--color-border)">
          <p class="text-xs" style="color: var(--color-muted)">
            Prefere continuar sem conta?
            <button
              onclick={close}
              class="font-semibold underline ml-1 hover:opacity-80 cursor-pointer"
              style="color: var(--color-primary)"
            >
              Continuar como Visitante
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
