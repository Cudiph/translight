import gtrans, { getTTSLink } from '../lib/gtrans';
browser.runtime.onInstalled.addListener(async ({ reason }) => {
  const requiredKey = await browser.storage.local.get(['targetLang', 'altTargetLang', 'hostnames']);
  browser.storage.local.set({
    targetLang: requiredKey.targetLang || 'en',
    altTargetLang: requiredKey.altTargetLang || 'zh',
    hostnames: requiredKey.hostnames || [],
  });

  if (reason === "install") {
    browser.runtime.openOptionsPage();
  }
});

// for updating selected text
browser.tabs.onActivated.addListener(activeInfo => {
  browser.tabs.sendMessage(activeInfo.tabId, { name: 'tabchanged' });
});

// for updating windowURL
browser.tabs.onUpdated.addListener((id, info, tab) => {
  browser.storage.local.set({
    windowURL: tab.url,
  });
});

// for updating windowURL when window change
browser.windows.onFocusChanged.addListener(async (wid) => {
  const win = await browser.windows.get(wid, { populate: true });

  const activeTab = win.tabs.find(el => el.active === true);
  browser.storage.local.set({
    windowURL: activeTab.url,
  });

});

// address bar button
browser.pageAction?.onClicked.addListener(async (tab) => {
  const props = {
    sl: "auto",
    tl: (await browser.storage.local.get('targetLang')).targetLang,
    u: tab.url,
  };

  const link = `https://translate.google.com/translate?sl=auto&tl=${props.tl}&atl=ja&u=${tab.url}`;
  browser.tabs.create({ url: link });
});

browser.commands.onCommand.addListener(async (cmd) => {
  if (cmd === 'translate-this-page') {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab) return;
    const props = {
      sl: "auto",
      tl: (await browser.storage.local.get('targetLang')).targetLang,
      u: tab.url,
    };

    const link = `https://translate.google.com/translate?sl=auto&tl=${props.tl}&atl=ja&u=${tab.url}`;
    browser.tabs.create({ url: link });

  }
});

function blobToDataURL(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => { resolve(e.target.result); };
    reader.readAsDataURL(blob);
    reader.onerror = (_) => { reject('something went wrong'); };
  });
}

// handle all the request from content script
browser.runtime.onMessage.addListener(async (msg, sender, sendRes) => {
  if (msg.name === 'tts-fetch') {
    const ttsLink = getTTSLink(msg.text, msg.langId);
    const res = await fetch(ttsLink);
    const blob = await res.blob();
    const dataUri = await blobToDataURL(blob);

    if (res.ok) return dataUri;
    else return Promise.reject('no stream');

  } else if (msg.name === 'gtrans-fetch') {
    return gtrans(msg.text, msg.gtransOptions);
  } else if (msg.name === 'active-tab') {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    return tab;
  }
});
