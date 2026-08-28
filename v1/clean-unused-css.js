/**
 * clean-unused-css.js
 *
 * Rewrites a CSS file to keep ONLY rules whose class/ID selectors are
 * confirmed to exist somewhere in your built HTML, templates, or JS.
 * Everything else is removed. The original file is backed up first.
 *
 * A selector is kept if EVERY class/ID it references appears somewhere in
 * the search corpus (necessary condition for it to ever possibly match).
 * If even one referenced class/ID appears nowhere at all, that selector can
 * never match anything and is removed.
 *
 * Rules with NO class/ID (bare tag selectors like `body`, `a:hover`, `h1`,
 * universal `*`) are always KEPT — this script can't safely judge those, and
 * they're almost always foundational/reset styles.
 * @font-face, @keyframes, and comments are always KEPT as-is (matched by
 * name, not by DOM presence — different mechanism, out of scope here).
 * @media blocks are processed recursively; if a media block ends up with
 * zero rules after filtering, the whole block is dropped.
 *
 * SAFETY:
 *   - By default this is a DRY RUN: it prints what WOULD be removed and
 *     writes a preview report, but does NOT touch your actual CSS file.
 *   - Pass --apply to actually back up the original and overwrite it.
 *
 * USAGE:
 *   npm install css --save-dev   (if not already installed)
 *   node clean-unused-css.js path/to/style.blue.css            (dry run)
 *   node clean-unused-css.js path/to/style.blue.css --apply     (for real)
 *
 * Place this script inside the "v1" folder, next to public/themes/layouts/static
 * (same as find-unused-css.js), so the search paths resolve correctly.
 */

const fs = require('fs');
const path = require('path');
const css = require('css');

const args = process.argv.slice(2);
const CSS_FILE = args.find((a) => !a.startsWith('--'));
const APPLY = args.includes('--apply');

if (!CSS_FILE) {
  console.error('Usage: node clean-unused-css.js path/to/style.blue.css [--apply]');
  process.exit(1);
}

const SEARCH_DIRS = [
  path.join(__dirname, 'public'),
  path.join(__dirname, 'themes'),
  path.join(__dirname, 'layouts'),
  path.join(__dirname, 'static', 'js'),
];

function collectFiles(dir, exts, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, exts, fileList);
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      fileList.push(full);
    }
  }
  return fileList;
}

console.log('Collecting search corpus...');
let files = [];
for (const dir of SEARCH_DIRS) {
  files = files.concat(collectFiles(dir, ['.html', '.js']));
}
console.log(`Found ${files.length} files across ${SEARCH_DIRS.join(', ')}`);

let corpus = '';
for (const f of files) {
  try {
    corpus += fs.readFileSync(f, 'utf8') + '\n';
  } catch (e) {
    console.warn(`Could not read ${f}: ${e.message}`);
  }
}
console.log(`Corpus size: ${(corpus.length / 1024 / 1024).toFixed(2)} MB\n`);

if (corpus.length < 10000) {
  console.error(
    '\n⚠️  ABORTING: search corpus is suspiciously small (under 10 KB).\n' +
    '   Check that this script sits directly inside the "v1" folder,\n' +
    '   next to "public", "themes", "layouts", and "static".\n'
  );
  process.exit(1);
}

const originalCssText = fs.readFileSync(CSS_FILE, 'utf8');
const ast = css.parse(originalCssText, { silent: true });

function extractTokens(selector) {
  const classes = [...selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
  const ids = [...selector.matchAll(/#([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
  return [...classes, ...ids];
}

function isTokenUsed(token) {
  return corpus.includes(token);
}

let keptSelectorCount = 0;
let removedSelectorCount = 0;
let removedRuleCount = 0;
let keptRuleCount = 0;
const removedLog = [];

function filterRules(rules) {
  const result = [];
  for (const rule of rules) {
    if (rule.type === 'rule') {
      const keptSelectors = [];
      for (const selector of rule.selectors) {
        const tokens = extractTokens(selector);
        if (tokens.length === 0) {
          // bare tag/pseudo/universal selector — always keep, can't evaluate
          keptSelectors.push(selector);
          keptSelectorCount++;
          continue;
        }
        const allFound = tokens.every((t) => isTokenUsed(t));
        if (allFound) {
          keptSelectors.push(selector);
          keptSelectorCount++;
        } else {
          removedSelectorCount++;
          removedLog.push({
            selector,
            line: rule.position ? rule.position.start.line : '?',
          });
        }
      }
      if (keptSelectors.length > 0) {
        rule.selectors = keptSelectors;
        result.push(rule);
        keptRuleCount++;
      } else {
        removedRuleCount++;
      }
    } else if (rule.type === 'media') {
      const filteredInner = filterRules(rule.rules);
      if (filteredInner.length > 0) {
        rule.rules = filteredInner;
        result.push(rule);
      }
    } else {
      // comments, @font-face, @keyframes, @import, etc — always keep as-is
      result.push(rule);
    }
  }
  return result;
}

const filteredRules = filterRules(ast.stylesheet.rules);
ast.stylesheet.rules = filteredRules;

const cleanedCssText = css.stringify(ast);

console.log(`Selectors kept: ${keptSelectorCount}`);
console.log(`Selectors removed: ${removedSelectorCount}`);
console.log(`Rule blocks kept: ${keptRuleCount}`);
console.log(`Rule blocks removed entirely: ${removedRuleCount}`);
console.log(`Original size: ${(originalCssText.length / 1024).toFixed(1)} KB`);
console.log(`Cleaned size:  ${(cleanedCssText.length / 1024).toFixed(1)} KB`);

// Always write a preview, regardless of --apply
const previewPath = CSS_FILE + '.cleaned-preview.css';
fs.writeFileSync(previewPath, cleanedCssText);
console.log(`\nPreview of cleaned CSS written to: ${previewPath}`);

let removedReport = `# Removed Selectors Log\n\n${removedSelectorCount} selectors removed.\n\n`;
for (const r of removedLog) {
  removedReport += `- Line ${r.line}: \`${r.selector}\`\n`;
}
fs.writeFileSync(CSS_FILE + '.removed-selectors.md', removedReport);
console.log(`Log of removed selectors written to: ${CSS_FILE}.removed-selectors.md`);

if (!APPLY) {
  console.log(
    '\nDRY RUN ONLY — your original file has NOT been changed.\n' +
    'Review the preview file above, then re-run with --apply to actually replace it\n' +
    '(a timestamped backup of the original will be made automatically).'
  );
} else {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = CSS_FILE + `.backup-${timestamp}.css`;
  fs.copyFileSync(CSS_FILE, backupPath);
  console.log(`\nOriginal backed up to: ${backupPath}`);

  fs.writeFileSync(CSS_FILE, cleanedCssText);
  console.log(`Original file replaced with cleaned version: ${CSS_FILE}`);
  console.log('\nNow rebuild (hugo --minify) and check the site carefully before deploying.');
}