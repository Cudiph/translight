browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason == "install") {
    browser.runtime.openOptionsPage();
    browser.storage.local.set({
      targetLang: 'en',
      altTargetLang: 'zh',
      noReferer: true,
    });
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
