<!-- svelte-ignore a11y-invalid-attribute -->
<script lang="ts">
  import { query } from "./store";
  import qstr from "query-string";

  let windowURL: Promise<string>;
  let targetLang: Promise<string>;
  const gm = browser.i18n.getMessage;

  browser.storage.local.get(["windowURL", "targetLang"]).then((res) => {
    windowURL = res.windowURL;
    targetLang = res.targetLang;
  });

  function openOptions(e: Event) {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  }

  function translateThisPage(e: Event) {
    e.preventDefault();
    const props = qstr.stringify({
      sl: "auto",
      tl: targetLang,
      u: windowURL,
    });
    const link = `https://translate.google.com/translate?${props}`;
    window.open(link);
    window.close();
  }

  function openInGoogleTranslate(e: Event) {
    e.preventDefault();
    const link = `https://translate.google.com/?source=gtx_m#auto/${targetLang}/${encodeURIComponent(
      $query
    )}`;
    window.open(link);
    window.close();
  }
</script>

<footer>
  <ul>
    <li>
      <a href="#" on:click={translateThisPage}>{gm("translateThisPage")}</a>
    </li>
    <span>-</span>
    <li><a href="#" on:click={openOptions}>{gm("extensionOptions")}</a></li>
    <span>-</span>
    <li>
      <a href="#" on:click={openInGoogleTranslate}
        >{gm("openInGoogleTranslate")}</a
      >
    </li>
  </ul>
</footer>

<style>
  footer {
    background-color: var(--translight-bg-color);
    color: var(--translight-fg-color);
  }
  ul {
    list-style: none;
    text-align: center;
    padding: 3px;
    margin: 0;
  }
  ul > li {
    display: inline;
  }
  ul > li > a {
    color: var(--translight-accent-blue);
    text-decoration: none;
    display: inline;
    cursor: pointer;
  }

  a {
    font-size: 13px;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
