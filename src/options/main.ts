import './main.css';
import Options from './main.svelte';
import 'webextension-polyfill';

const app = new Options({
  target: document.body,
  props: {},
});

export default app;
