<script lang="ts">
  import { slide } from 'svelte/transition';
  export let title = 'Title';
  export let hide = true;

  function toggle() {
    hide = !hide;
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.code === 'Space' || e.code === 'Enter') && e.target === document.activeElement) toggle();
  }
</script>

<div class="collapser" tabindex="0" on:keydown={handleKeydown} on:click={toggle} role="button">
  <div class="handler" class:hide={!hide}>
    <span>{title}</span>
    <span class="marker"
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        version="1.1"
        class="mdi-plus marker"
        width="20"
        height="20"
        viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg
      ></span
    >
  </div>
  <div class="handler" class:hide>
    <span>{title}</span>
    <span
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        version="1.1"
        class="mdi-minus marker"
        width="20"
        height="20"
        viewBox="0 0 24 24"><path d="M19,13H5V11H19V13Z" /></svg
      ></span
    >
  </div>
  {#if !hide}
    <div class="content" transition:slide>
      <slot>content empty</slot>
    </div>
  {/if}
</div>

<style>
  .handler {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    margin: 5px auto;
    border-bottom: 1px solid var(--translight-fg-color);
    user-select: none;
    padding: 3px 5px;
  }

  .handler > span {
    font-size: 16px;
  }

  .hide {
    display: none;
  }

  .marker {
    fill: var(--translight-fg-color);
  }
</style>
