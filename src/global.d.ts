/// <reference types="svelte" />

// variable saved in browser.storage.local
interface LocalStorage {
  targetLang?: string;
  altTargetLang?: string;
  windowURL?: string;
  selection?: string;
}
