<script lang="ts">
  import { langId } from "../lib/gtrans";

  import Header from "./Header.svelte";
  const gm = browser.i18n.getMessage;

  const bslocal = browser.storage.local;

  let config = {
    tl: "",
    atl: "",
    noReferer: true,
  };
  bslocal.get(["targetLang", "altTargetLang", "noReferer"]).then((res) => {
    config.tl = res.targetLang;
    config.atl = res.altTargetLang;
    config.noReferer = res.noReferer;
  });

  function updateTargetLang(e: Event) {
    e.preventDefault();
    const elem = e.target as HTMLOptionElement;
    const val = elem.value;

    // switch value if tl and atl is same
    if (val === config.atl) {
      const atlElement = document.querySelector(
        'select[name="atl"]'
      ) as HTMLOptionElement;
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
      const atlElement = document.querySelector(
        'select[name="tl"]'
      ) as HTMLOptionElement;
      config.tl = atlElement.value = config.atl;
    }
    config.atl = val;
    bslocal.set({
      altTargetLang: val,
      targetLang: config.tl,
    });
  }

  function updateNoRef(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    browser.storage.local.set({
      noReferer: checked,
    });
  }
</script>

{#await config then res}
  <div id="app">
    <Header />
    <main>
      <div class="opt-row">
        <label for="tl">{gm("targetLanguage")}</label>
        <select name="tl" id="tl" on:change={updateTargetLang}>
          {#each Object.entries(langId) as [code, language]}
            <option selected={res.tl === code ? true : false} value={code}>
              {language}
            </option>
          {/each}
        </select>
      </div>
      <div class="opt-row">
        <label for="atl">{gm("alternative")} {gm("targetLanguage")}</label>
        <select name="atl" id="atl" on:change={updateATL}>
          {#each Object.entries(langId) as [code, language]}
            <option selected={res.atl === code ? true : false} value={code}>
              {language}
            </option>
          {/each}
        </select>
      </div>
      <div class="opt-row">
        <input
          type="checkbox"
          name="noref"
          id="noref"
          checked={res.noReferer}
          on:change={updateNoRef}
        />
        <label for="noref"
          >{gm("optionsOmitReferer")}</label
        >
      </div>
    </main>
  </div>
{/await}

<style>
  main {
    max-width: 700px;
    margin: 2em auto;
    background-color: var(--translight-bg-color);
    color: var(--translight-fg-color);
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  }
  .opt-row {
    margin: 0 1px 40px 15px;
  }
  .opt-row label {
    display: block;
  }
  label[for="noref"] {
    display: inline;
  }
</style>
