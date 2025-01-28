import { rollup } from 'rollup';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import baseConfig from '../rollup.config.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildProject(name, dir) {
  const siteConfig = yaml.load(
    fs.readFileSync(path.join(dir, 'config.yaml'), 'utf8')
  );
  const banner = generateBanner(siteConfig);

  const config = {
    ...baseConfig,
    input: path.join(dir, 'entry.js'),
    output: {
      ...baseConfig.output,
      file: `dist/${name.toLowerCase().replace(/[ .]/g, '-')}.user.js`,
      banner,
    },
  };

  const bundle = await rollup(config);
  await bundle.write(config.output);
  console.log(`Built project for config: ${dir}`);
}

function generateBanner(config) {
  return `// ==UserScript==
// @name         ${config.name || 'MovieButAds'}
// @namespace    ${config.namespace || 'https://movie-but-ads.mutoo.im'}
// @version      ${config.version || '1.0.0'}
// @description  ${config.description || 'Movie But Ads is a collection of user scripts that enhance the viewing experience on Chinese movie websites. These scripts remove ads, improve functionality, and optimize the user interface for a smoother movie-watching experience.'}
// @author       ${config.author || 'mutoo<gmutoo@gmail.com>'}
// @license      ${config.license || 'MIT'}
// @icon         ${config.icon || ''}
// @match        ${config.match.join('\n// @match        ')}
// @run-at       ${config.runAt || 'document-start'}
// @grant        ${config.grant || 'none'}
// ==/UserScript==
  `;
}

async function buildAll() {
  // find all the path match <project-name>/config.yaml
  const configPaths = glob.sync('**/config.yaml', {
    cwd: path.resolve(__dirname, '..'),
  });
  for (const configPath of configPaths) {
    const dir = path.dirname(configPath);
    const name = path.basename(dir);
    await buildProject(name, dir);
  }
}

buildAll();
