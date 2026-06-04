#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const SRC = path.resolve(__dirname, '..', 'src');
const OUT_JSON = path.resolve(__dirname, '..', 'i18n_strings.json');
const OUT_CSV = path.resolve(__dirname, '..', 'i18n_strings.csv');

function readFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const res = path.resolve(dir, e.name);
    if (e.isDirectory()) files = files.concat(readFiles(res));
    else if (/\.(js|ts|jsx|tsx)$/.test(e.name)) files.push(res);
  }
  return files;
}

function extractFromFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  } catch (err) {
    console.warn('Parse failed:', file, err.message);
    return [];
  }
  const results = [];
  traverse(ast, {
    JSXText(pathNode) {
      const val = pathNode.node.value.trim();
      if (val) results.push({ file, value: val, type: 'JSXText' });
    },
    JSXAttribute(pathNode) {
      const attr = pathNode.node;
      if (attr.value && attr.value.type === 'StringLiteral') {
        const val = attr.value.value.trim();
        if (val) results.push({ file, value: val, type: 'JSXAttribute', name: attr.name.name });
      }
    },
    StringLiteral(pathNode) {
      // filter out import/export specifiers and obvious non-UI strings
      const parent = pathNode.parent;
      if (parent && (parent.type === 'ImportDeclaration' || parent.type === 'ExportNamedDeclaration' || parent.type === 'TSImportEqualsDeclaration')) return;
      const val = pathNode.node.value.trim();
      if (!val) return;
      // skip long URLs and paths
      if (/https?:\/\//.test(val) || val.includes('node_modules') || val.length > 200) return;
      // heuristics: skip single-letter or code-like strings
      if (/^[A-Za-z0-9_\-\/]+$/.test(val) && val.length < 6) return;
      results.push({ file, value: val, type: 'StringLiteral' });
    }
  });
  return results;
}

function main() {
  const files = readFiles(SRC);
  const map = {};
  for (const f of files) {
    const items = extractFromFile(f);
    for (const it of items) {
      const key = it.value;
      if (!map[key]) map[key] = [];
      map[key].push({ file: path.relative(process.cwd(), it.file), type: it.type, attr: it.name || '' });
    }
  }
  const entries = Object.keys(map).map(k => ({ key: k, locations: map[k] }));
  fs.writeFileSync(OUT_JSON, JSON.stringify(entries, null, 2), 'utf8');

  // CSV: file, key, type, attr
  const rows = [];
  for (const e of entries) {
    for (const loc of e.locations) rows.push(`${loc.file.replace(/,/g,'')},"${e.key.replace(/"/g,'""')}",${loc.type},${loc.attr}`);
  }
  fs.writeFileSync(OUT_CSV, 'file,key,type,attr\n' + rows.join('\n'), 'utf8');
  console.log('Wrote', OUT_JSON, OUT_CSV);
}

main();
