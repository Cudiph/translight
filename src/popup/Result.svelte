<script lang="ts">
  import { query } from "./store";
  import Collapser from "../lib/Collapser.svelte";
  import { getLangId, langId, ReadableFormat } from "../lib/gtrans";
  import DOMPurify from 'dompurify';

  const gtrans = async function (
    text: string,
    gtransOptions: Record<string, any>
  ) {
    return browser.runtime.sendMessage({
      name: "gtrans-fetch",
      text,
      gtransOptions,
    });
  };

  export let gtransRes: Promise<ReadableFormat>;
  export let targetLang: string;
  export let fromContentScript = false;
  const gm = browser.i18n.getMessage;

  let audio: HTMLAudioElement;
  let splittedQuery: string[];

  let fromOptions: HTMLElement;
  let targetOptions: HTMLElement;

  let srcPlaying = false;
  let destPlaying = false;

  async function playTTS(
    query: string,
    langId: string,
    forComp: "src" | "dest"
  ) {
    async function getDataURI(text: string) {
      const dataURI: string = await browser.runtime.sendMessage({
        name: "tts-fetch",
        text: text,
        langId,
      });

      return dataURI;
    }

    if (audio) {
      audio.pause();
      srcPlaying = false;
      destPlaying = false;
    }
    if (forComp === "src") srcPlaying = true;
    else destPlaying = true;

    splittedQuery = splitTextToList(query, 200);

    const dataURI = await getDataURI(splittedQuery[0]);
    audio = new Audio();
    audio.src = dataURI;
    audio.crossOrigin = "anonymous";
    audio.onplay = () => {
      if (forComp === "src") srcPlaying = true;
      else destPlaying = true;
    };
    audio.onended = async () => {
      // play next audio when ended
      splittedQuery.shift();
      if (splittedQuery.length === 0) {
        if (forComp === "src") srcPlaying = false;
        else destPlaying = false;
        return;
      }
      audio.src = await getDataURI(splittedQuery[0]);
      audio.play();
    };
    audio.onerror = () => {
      srcPlaying = false;
      destPlaying = false;
    };
    audio.play();
  }

  // split text to array with each element has string with maxLength length
  function splitTextToList(text: string, maxLength: number): string[] {
    let copy = text.trim();
    if (text.length <= maxLength) return [copy];

    const list = [];
    while (copy.trim() !== "") {
      if (copy.length <= maxLength) {
        list.push(copy);
        break;
      }

      for (let i = maxLength; i >= 0; i--) {
        if (i === 0) {
          // if no space found
          list.push(copy.slice(0, maxLength));
          copy = copy.slice(maxLength).trim();
        }
        if (copy[i] !== " ") continue;

        list.push(copy.slice(0, i));
        copy = copy.slice(i).trim();
        break;
      }
    }
    return list;
  }

  function updateSource(
    e: Event,
    origFrom: string,
    origTo: string,
    sourceText: string,
    translated: string
  ) {
    const from = (e.target as HTMLOptionElement).value;
    if (from.trim() === "") return;

    // exchange language
    if (from === origTo) {
      gtransRes = gtrans(translated, { from: origTo, to: origFrom });
      targetLang = origFrom;
      return;
    }

    if (!fromContentScript) {
      gtransRes = gtrans($query, { from: from, to: targetLang });
    } else {
      gtransRes = gtrans(sourceText, { from: from, to: targetLang });
    }
  }
  function updateDestination(
    e: Event,
    origFrom: string,
    origTo: string,
    sourceText: string,
    translated: string
  ) {
    const to = (e.target as HTMLOptionElement).value;
    if (to.trim() === "") return;

    if (origFrom === to) {
      gtransRes = gtrans(translated, { from: origTo, to: origFrom });
      targetLang = origFrom;
      return;
    }

    if (!fromContentScript) {
      gtransRes = gtrans($query, { from: origFrom, to: to });
    } else {
      gtransRes = gtrans(sourceText, { from: origFrom, to: to });
    }
    targetLang = to;
  }

  async function switchLang(from: string, sourceText: string) {
    const tl = (await browser.storage.local.get("targetLang")).targetLang;
    const atl = (await browser.storage.local.get("altTargetLang"))
      .altTargetLang;

    // switch to alternate target
    if (from === tl) targetLang = atl;
    else return;

    if (!fromContentScript) {
      gtransRes = gtrans($query, { to: targetLang });
    } else {
      gtransRes = gtrans(sourceText, { to: targetLang });
    }
  }

  function sanitizeAndGiveBreak(text: string) {
    const newText = text.replace(/\n/g, '<br />');
    return DOMPurify.sanitize(newText);
  }
</script>

{#await gtransRes}
  <p style="margin: 0; padding: 0;">{gm("translateLoading")}</p>
{:then res}
  {#if res.altFrom === res.to}
    {switchLang(getLangId(res.from), res.sourceText)}
  {/if}
  <div class="translight-result">
    <h3
      on:mouseenter={() => {
        fromOptions.focus();
      }}
      class="translated-heading"
      style="margin-top: 0; padding-top: 0;"
    >
      {res.altFrom}
    </h3>
    <select
      class="translight-clickable translight-hidden language-option"
      name="srclang"
      on:change={(e) =>
        updateSource(
          e,
          getLangId(res.altFrom),
          getLangId(res.to),
          res.sourceText,
          res.translated
        )}
      bind:this={fromOptions}
    >
      {#each Object.entries(langId) as [code, language]}
        <option
          class="translight-clickable"
          selected={code === getLangId(res.altFrom) ? true : false}
          value={code}>{language}</option
        >
      {/each}
    </select>

    {#if !srcPlaying}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        version="1.1"
        class="translight-audio-svg translight-clickable"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        on:click={() => playTTS(res.sourceText, getLangId(res.altFrom), "src")}
      >
        <!-- the icon is "stolen" from https://github.com/Templarian/MaterialDesign-SVG -->
        <path
          class="translight-clickable"
          d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
        />
      </svg>
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        class="translight-audio-svg translight-clickable"
        version="1.1"
        width="24"
        height="24"
        on:click={() => {
          audio.pause();
          srcPlaying = false;
        }}
        viewBox="0 0 24 24"
        ><path class=" translight-clickable" d="M18,18H6V6H18V18Z" /></svg
      >
    {/if}
    {#if res.isCorrected}
      <p>{@html sanitizeAndGiveBreak(res.corrected)}</p>
    {:else}
      <p>{@html sanitizeAndGiveBreak(res.sourceText)}</p>
    {/if}

    {#if res.pronunciation}
      <p class="opacity-60">{res.pronunciation}</p>
    {/if}

    <h3
      class="key-label translated-heading"
      on:mouseenter={() => {
        targetOptions.focus();
      }}
      style="font-size: 19px;"
    >
      {res.to}
    </h3>
    <select
      class="translight-clickable translight-hidden language-option"
      name="destlang"
      bind:this={targetOptions}
      on:change={(e) =>
        updateDestination(
          e,
          getLangId(res.altFrom),
          getLangId(res.to),
          res.sourceText,
          res.translated
        )}
    >
      {#each Object.entries(langId) as [code, language]}
        <option
          class="translight-clickable"
          selected={code === getLangId(res.to) ? true : false}
          value={code}>{language}</option
        >
      {/each}
    </select>

    {#if !destPlaying}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        version="1.1"
        class="mdi-volume-high translight-clickable"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style="float: right;"
        on:click={() => playTTS(res.translated, getLangId(res.to), "dest")}
        ><path
          class="translight-clickable"
          d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
        />
      </svg>
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        class="translight-audio-svg translight-clickable"
        version="1.1"
        width="24"
        height="24"
        on:click={() => {
          audio.pause();
          destPlaying = false;
        }}
        viewBox="0 0 24 24"
        ><path class="translight-clickable" d="M18,18H6V6H18V18Z" /></svg
      >
    {/if}

    <p>{@html sanitizeAndGiveBreak(res.translated)}</p>
    {#if res.destPronunciation}
      <p class="opacity-60">{res.destPronunciation}</p>
    {/if}

    {#if res.related}
      <div class="key-label">{gm("seeAlso")}</div>
      {#each res.related as word}
        <button
          class="translight-btn translight-clickable"
          on:click={(e) => {
            e.preventDefault();
            $query = word;
            gtransRes = gtrans(word, { to: targetLang });
          }}>{word}</button
        >
      {/each}
    {/if}

    {#if res.translations}
      <Collapser title={gm("translations")}>
        <div class="translations">
          {#each Object.keys(res.translations) as key}
            <table class="width-100">
              <thead>
                <tr>
                  <th class="align-left key-label">{key}</th>
                  <th />
                  <th class="align-right" style="font-weight: bold;"
                    >{gm("frequency")}</th
                  >
                </tr>
              </thead>
              <tbody>
                {#each res.translations[key] as translationsObj}
                  <tr>
                    <td class="align-left no-wrap">{translationsObj.word}</td>
                    <td
                      class="opacity-60 width-100"
                      style="padding-bottom: 5px; padding-left: 5px;"
                      >{translationsObj.translations.join(", ")}</td
                    >
                    <td class="align-right">{translationsObj.frequency}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/each}
        </div>
      </Collapser>
    {/if}

    {#if res.examples}
      <Collapser title={gm("examples")}>
        <table>
          {#each res.examples as example}
            <tr>
              <td
                style="vertical-align: middle; padding: 0; padding-right: 5px;"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  version="1.1"
                  id="mdi-format-quote-open"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  ><path
                    d="M10,7L8,11H11V17H5V11L7,7H10M18,7L16,11H19V17H13V11L15,7H18Z"
                  /></svg
                >
              </td>
              <td style="padding-bottom: 5px;">{@html example}</td>
            </tr>
          {/each}
        </table>
      </Collapser>
    {/if}

    {#if res.definitions}
      <Collapser title={gm("definitions")}>
        <div class="definitions">
          {#each Object.keys(res.definitions) as key}
            <div class="key-label">{key}</div>
            <table class="width-100 def-table">
              <tbody>
                {#each res.definitions[key] as defsObj, i}
                  <tr>
                    <td style="vertical-align: top; min-width: 25px;"
                      ><div class="definitions-number">
                        {i + 1}
                      </div></td
                    >
                    <td width="100%">
                      <div>{defsObj.definition}</div>
                      {#if defsObj.example}
                        <div class="opacity-60">"{defsObj.example}"</div>
                      {/if}
                      {#if defsObj.synonyms.length}
                        <p class="opacity-60">{gm("synonyms")}:</p>
                        {#each defsObj.synonyms as synonym}
                          <button
                            class="translight-btn translight-clickable"
                            on:click={(e) => {
                              e.preventDefault();
                              $query = synonym;
                              gtransRes = gtrans(synonym, { to: targetLang });
                            }}>{synonym}</button
                          >
                        {/each}
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/each}
        </div>
      </Collapser>
    {/if}
  </div>
{:catch e}
  {#if $query?.length > 10000}
    <p class="error-text">{gm("errorTextLimit")}</p>
  {:else}
    <p>
      {gm("unexpectedError")}: <span class="error-text">{e.message}</span>
    </p>
  {/if}
{/await}

<style>
  .translight-result * {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    color: var(--translight-fg-color);
    background-color: var(--translight-bg-color);
  }
  svg {
    fill: var(--translight-fg-color);
  }
  .translight-audio-svg {
    cursor: pointer;
    float: right;
  }
  .translight-audio-svg:hover {
    opacity: 0.6;
  }
  .translated-heading {
    font-weight: bold;
    font-size: 19px;
    display: inline;
  }
  p {
    margin: 5px 0;
  }
  table,
  tr,
  tbody,
  thead,
  th,
  td {
    border: none;
    padding-top: 0;
    padding-left: 0;
    padding-right: 0;
  }
  .language-option,
  p,
  th,
  td,
  .definitions-number,
  .key-label {
    font-size: 16px;
  }
  .opacity-60 {
    color: var(--translight-fg-color);
    opacity: 60%;
  }
  .width-100 {
    width: 100%;
  }
  .align-left {
    text-align: left;
  }
  .align-right {
    text-align: right;
  }
  .key-label {
    color: var(--translight-accent-blue);
    font-weight: bold;
    text-transform: capitalize;
  }
  .definitions-number {
    border: 1px solid var(--translight-fg-color);
    border-radius: 50%;
    text-align: center;
    width: 18px;
    height: 18px;
    line-height: 14px;
    margin: auto 5px;
    padding: 1px;
    font-size: 14px;
  }
  .translight-btn {
    border: 1px solid var(--translight-fg-color);
    padding: 3px 8px;
    border-radius: 32px;
    margin: auto 2px 10px;
    display: inline-block;
    background-color: unset;
    color: var(--translight-fg-color);
  }

  .translight-clickable {
    cursor: pointer;
  }
  .no-wrap {
    white-space: nowrap;
  }
  .def-table td {
    padding-bottom: 5px;
  }
  .translight-hidden {
    position: absolute;
    left: -9999px;
    overflow: hidden;
    font-size: large;
  }
  .translight-hidden:focus {
    left: 0px;
  }
  .error-text {
    color: red;
  }
</style>
