import Result from '../popup/Result.svelte';
import gtrans from '../lib/gtrans';

const gm = browser.i18n.getMessage;

// stolen method
function getSelectionText() {
  let text = "";
  const activeEl = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
  const activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
  if (
    (activeElTagName == "textarea") || (activeElTagName == "input" &&
      /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
    (typeof activeEl.selectionStart == "number")
  ) {
    text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
  } else if (window.getSelection) {
    text = window.getSelection().toString();
  }
  return text;
}

// save selection to storage so textarea in popup can use it
document.addEventListener("click", () => {
  const selected = getSelectionText();
  browser.storage.local.set({
    selection: selected,
  });
});

document.addEventListener("selectionchange", () => {
  const selected = getSelectionText();
  browser.storage.local.set({
    selection: selected,
  });
});

browser.runtime.onMessage.addListener(msg => {
  if (msg.name !== 'tabchanged') return;

  browser.storage.local.set({
    selection: window.getSelection().toString(),
    windowURL: window.location.href,
  });
});
//////

// create container for result.svelte to sit in
function createContainer(x: number, y: number) {
  const container = document.createElement('div');
  container.classList.add('translight-container');
  container.style.top = `${y}px`;
  container.style.left = `${x}px`;
  return container;
}

// add clickable icon
function addTooltip(tooltipParent: HTMLElement, x: number, y: number) {
  const icon = document.createElement('img');
  icon.src = browser.runtime.getURL('images/translight-48.png');
  icon.alt = 'translate';
  icon.classList.add('translight-icon');
  icon.style.position = 'absolute';
  icon.style.top = `${y}px`;
  icon.style.left = `${x}px`;
  icon.style.animation = 'translight-fade .1s ease-in-out'
  tooltipParent.appendChild(icon);
  return icon;
}

// event handler to handle whether inline popup should work as expected
let container: HTMLDivElement;
let tooltip: HTMLDivElement;
let isTranslating = false;
document.addEventListener("click", (e) => {
  const selected = getSelectionText();

  if (tooltip && !tooltip.contains(e.target as HTMLElement)) {
    tooltip.remove();
  }
  const clickingExtButton = (e.target as HTMLElement).classList.contains('translight-clickable');
  
  if (container && !container.contains(e.target as HTMLElement) && !isTranslating && !clickingExtButton) {
    container.remove();
  }

  if (!selected) return;
  const x = e.pageX - 5;
  const y = e.pageY + 12;

  if (!isTranslating && !clickingExtButton) tooltip = addTooltip(document.body, x, y);

  tooltip.onclick = async (_) => {
    isTranslating = true;
    tooltip.remove();
    container = createContainer(x, y);
    container.style.height = 'auto';
    container.style.overflowY = 'scroll';
    container.style.padding = '5px';
    container = document.body.appendChild(container);
    const { targetLang } = await browser.storage.local.get('targetLang');
    const translated = gtrans(selected, { to: targetLang });

    const resComponent = new Result({
      target: container,
      props: {
        gtransRes: translated,
        targetLang,
        fromContentScript: true,
      }
    });
  };

  isTranslating = false;
});

document.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape') return;
  if (container) {
    container.remove();
  }
  if (tooltip) tooltip.remove();
});

browser.storage.local.get('noReferer').then(res => {
  if (!res.noReferer) return;
  const metaNoRef = document.createElement('meta');
  metaNoRef.name = "referrer";
  metaNoRef.content = "no-referrer";
  document.head.appendChild(metaNoRef);
});

