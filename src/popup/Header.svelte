<script lang="ts">
  import browser from 'webextension-polyfill';
  const gm = browser.i18n.getMessage;

  let active = true;
  let isPopup = false;
  let hostname = '';
  let blocklist: string[] = [];

  const p1 = browser.tabs.query({ active: true, lastFocusedWindow: true });
  const p2 = browser.storage.local.get('hostnames');

  Promise.all([p1, p2]).then((vals) => {
    const [[tab], { hostnames }] = vals;
    blocklist = hostnames;
    hostname = new URL(tab.url).hostname;

    if (hostnames.includes(hostname)) active = false;
    else active = true;
  });

  browser.windows.getCurrent().then((win) => {
    if (win.type === 'popup') isPopup = true;
    else isPopup = false;
  });

  function handlePowerClick(_: Event) {
    active = !active;

    if (active) {
      blocklist = blocklist.filter((hname) => hname !== hostname);
    } else {
      blocklist.push(hostname);
    }

    browser.storage.local.set({
      hostnames: blocklist,
    });
  }

  function handleDetachClick(_: Event) {
    browser.windows.create({
      url: window.location.href,
      type: 'popup',
      width: 470,
      height: 600,
    });
  }
</script>

<header>
  <div class="flex">
    <div>
      <button type="button" on:click={handlePowerClick}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          style="margin-left: 2px; margin-top: 2px;"
          class:lopacity={!active}
          ><path
            d="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13"
          /></svg
        >
      </button>
    </div>
    <div>
      <h3>{gm('shortName')}</h3>
    </div>
    <div>
      <button type="button" on:click={handleDetachClick}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          id="mdi-dock-window"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          class:lopacity={isPopup}
          ><path
            d="M18 18V20H4A2 2 0 0 1 2 18V8H4V18M22 6V14A2 2 0 0 1 20 16H8A2 2 0 0 1 6 14V6A2 2 0 0 1 8 4H20A2 2 0 0 1 22 6M20 6H8V14H20Z"
          /></svg
        >
      </button>
    </div>
  </div>
</header>

<style>
  .flex {
    display: flex;
    justify-content: space-between;
    height: 24px;
  }

  button {
    padding: 0;
    background-color: transparent;
    border: none;
  }
  h3 {
    color: var(--translight-fg-color);
    margin: unset;
    text-transform: uppercase;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
      'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 18px;
  }

  header {
    margin: unset;
    background-color: var(--translight-bg-color);
  }

  .lopacity {
    opacity: 30%;
  }

  svg {
    fill: var(--translight-accent-blue);
    cursor: pointer;
    transition: all 0.1s ease-in-out;
    border-radius: 10%;
  }

  svg:hover {
    background-color: var(--translight-fg-color);
  }
</style>
