<script lang="ts">
  import browser from 'webextension-polyfill';
  import { query } from './store';
  import gtrans from '../lib/gtrans';
  import type { ReadableFormat } from '../lib/gtrans';
  import Footer from './Footer.svelte';
  import Header from './Header.svelte';
  import Result from './Result.svelte';

  const bslocal = browser.storage.local;
  const config = { tl: '', atl: '' };
  let gtransPromise: Promise<ReadableFormat>;
  let targetLang: string;

  const loadConfig = bslocal.get(['targetLang', 'altTargetLang', 'selection']).then((res) => {
    targetLang = config.tl = res.targetLang;
    config.atl = res.altTargetLang;
    $query = res.selection;
    if ($query?.trim()) gtransPromise = gtrans($query, { to: targetLang });
  });

  let translateTimeout: NodeJS.Timeout;
  function handleInput() {
    clearTimeout(translateTimeout);
    translateTimeout = setTimeout(() => {
      if ($query.trim() === '') return;
      gtransPromise = gtrans($query, { to: targetLang });
    }, 1000);
  }
</script>

<div>
  <Header />
  <main>
    <!-- svelte-ignore a11y-autofocus -->
    <textarea
      bind:value={$query}
      on:input={handleInput}
      name="query"
      id="query"
      rows="7"
      autofocus
    />

    {#await loadConfig then _}
      {#if gtransPromise}
        <hr />
        <Result gtransRes={gtransPromise} {targetLang} />
      {/if}
    {/await}
  </main>
  <Footer />
</div>

<style>
  main {
    padding: 5px;
    margin: 0 auto;
    background-color: var(--translight-bg-color);
    color: var(--translight-fg-color);
  }

  textarea[name='query'] {
    resize: vertical;
    background: var(--translight-bg-color);
    color: var(--translight-fg-color);
    border: 1px solid var(--translight-fg-color);
    padding: auto;
    outline: none;
  }

  #query {
    width: calc(100% - 5px);
  }
</style>
