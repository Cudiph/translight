<script lang="ts">
  import { langId } from '../lib/gtrans';
  import browser from 'webextension-polyfill';

  import Header from './Header.svelte';
  const gm = browser.i18n.getMessage;
  const bslocal = browser.storage.local;

  // check permissions
  let has_all_perms = false;
  const page_query = { origins: ['http://*/*', 'https://*/*', 'file://*/*'] };
  browser.permissions.contains(page_query).then((res) => {
    has_all_perms = res;
  });

  // fetch configs
  let config = {
    tl: '',
    atl: '',
    hostnames: [''],
    keepCentered: false,
  };
  bslocal.get(['targetLang', 'altTargetLang', 'hostnames', 'keepCentered']).then((res) => {
    config.tl = res.targetLang;
    config.atl = res.altTargetLang;
    config.hostnames = res.hostnames;
    config.keepCentered = res.keepCentered;
  });

  function updateTargetLang(e: Event) {
    e.preventDefault();
    const elem = e.target as HTMLOptionElement;
    const val = elem.value;

    // switch value if tl and atl is same
    if (val === config.atl) {
      const atlElement = document.querySelector('select[name="atl"]') as HTMLOptionElement;
      config.atl = atlElement.value = config.tl;
    }
    config.tl = val;
    bslocal.set({
      targetLang: val,
      altTargetLang: config.atl,
    });
  }

  function updateATL(e: Event) {
    e.preventDefault();
    const elem = e.target as HTMLOptionElement;
    const val = elem.value;
    if (val === config.tl) {
      const atlElement = document.querySelector('select[name="tl"]') as HTMLOptionElement;
      config.tl = atlElement.value = config.atl;
    }
    config.atl = val;
    bslocal.set({
      altTargetLang: val,
      targetLang: config.tl,
    });
  }

  $: {
    bslocal.set({ keepCentered: config.keepCentered });
  }

  function updateBlocklist(e: Event) {
    const value = (e.target as HTMLTextAreaElement).value;
    const blocklist = value
      .trim()
      .replace(/(^\s+|[^\S\n]+)/gm, '')
      .split('\n');
    browser.storage.local.set({
      hostnames: blocklist,
    });
  }

  let timer: NodeJS.Timeout;
  function handleInput(e: Event) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      updateBlocklist(e);
    }, 500);
  }

  async function request_perms() {
    await browser.permissions.request(page_query);
    browser.permissions.contains(page_query).then((res) => {
      has_all_perms = res;
    });
  }
</script>

<div id="app">
  <Header />
  <main>
    {#if !has_all_perms}
      <div class="opt-row">
        <p>{gm('allowAccessExplanation')}</p>
        <button on:click={request_perms}>{gm('allowAccessButton')}</button>
      </div>
    {/if}
    <div class="opt-row">
      <label for="tl">{gm('targetLanguage')}</label>
      <select name="tl" id="tl" on:change={updateTargetLang}>
        {#each Object.entries(langId) as [code, language]}
          <option selected={config.tl === code ? true : false} value={code}>
            {language}
          </option>
        {/each}
      </select>
    </div>
    <div class="opt-row">
      <label for="atl">{gm('alternative')} {gm('targetLanguage')}</label>
      <select name="atl" id="atl" on:change={updateATL}>
        {#each Object.entries(langId) as [code, language]}
          <option selected={config.atl === code ? true : false} value={code}>
            {language}
          </option>
        {/each}
      </select>
    </div>
    <div class="opt-row">
      <label>
        <input type="checkbox" bind:checked={config.keepCentered} />
        {gm('keepCenteredDescription')}
      </label>
    </div>
    <div class="opt-row">
      <label for="blocklist">{gm('disabledIn')}: </label>
      <textarea
        on:input={handleInput}
        name="blocklist"
        id="blocklist"
        cols="45"
        rows="10"
        value={config.hostnames.join('\n')}
      />
    </div>
    <p class="note">*change is auto saved</p>
  </main>
</div>

<style>
  main {
    max-width: 700px;
    margin: 2em auto;
    background-color: var(--translight-bg-color);
    color: var(--translight-fg-color);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .opt-row {
    margin: 0 1px 25px 15px;
  }

  .opt-row label {
    display: block;
  }

  .note {
    font-size: 0.8em;
    text-align: center;
  }
</style>
