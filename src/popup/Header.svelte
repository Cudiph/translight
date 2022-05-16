<script lang="ts">
  const gm = browser.i18n.getMessage;
</script>

<header>
  <h3>{gm("shortName")}</h3>
</header>

<style>
  h3 {
    color: var(--translight-fg-color);
    margin: unset;
    text-transform: uppercase;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  header {
    margin: unset;
    background-color: var(--translight-bg-color);
  }
</style>
