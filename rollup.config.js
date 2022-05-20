import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';
import copy from 'rollup-plugin-copy';
import renameMod from './getrid-underscore-plugin';
import { writeFileSync } from 'fs';

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
      });

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    }
  };
}

const output = {
  sourcemap: !production,
  format: 'esm',
  name: 'translight',

};

const plugins = [
  svelte({
    preprocess: sveltePreprocess({ sourceMap: !production }),
    compilerOptions: {
      // enable run-time checks when not in production
      dev: !production
    }
  }),
  // we'll extract any component CSS out into
  // a separate file - better for performance
  css({
    output: (styles) => {
      writeFileSync(`${outChromium}/bundle.css`, styles);
      writeFileSync(`${outFirefox}/bundle.css`, styles);
    }
  }),

  // If you have external dependencies installed from
  // npm, you'll most likely need these plugins. In
  // some cases you'll need additional configuration -
  // consult the documentation for details:
  // https://github.com/rollup/plugins/tree/master/packages/commonjs
  resolve({
    browser: true,
    dedupe: ['svelte']
  }),
  commonjs(),
  typescript({
    sourceMap: !production,
    inlineSources: !production
  }),

  // In dev mode, call `npm run start` once
  // the bundle has been generated
  !production && serve(),

  // If we're building for production (npm run build
  // instead of npm run dev), minify
  production && terser(),

];

const outputDir = production ? 'dist' : 'build';
const outChromium = `${outputDir}/chromium`;
const outFirefox = `${outputDir}/firefox`;

export default [
  {
    input: [
      'src/background/background.ts',
      'src/popup/main.ts',
      'src/options/main.ts',
    ],
    output: [
      {
        ...output,
        dir: outChromium,
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
      {
        ...output,
        dir: outFirefox,
        preserveModules: true,
        preserveModulesRoot: 'src',
      }
    ],
    plugins: [
      ...plugins,
      copy({
        targets: [
          { src: ['src/**/*', '!**/*.{ts,svelte,xcf}', '!**/manifest*.json'], dest: [outChromium, outFirefox], expandDirectories: true, onlyFiles: true },
        ],
        flatten: false
      }),
      renameMod('ඞ', !production)
    ],
    watch: {
      clearScreen: false
    }
  },
  {
    input: 'src/content/content-script.ts',
    output: [
      {
        ...output,
        file: `${outChromium}/content/content-script.js`
      }, {
        ...output,
        file: `${outFirefox}/content/content-script.js`
      }
    ],
    plugins: [
      ...plugins,
    ],
    watch: {
      clearScreen: false
    }
  }
];
