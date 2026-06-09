import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '..', 'src', 'chains.ts');
let content = readFileSync(file, 'utf-8');

// Extract block boundaries
const startMarker = 'export const CHAIN_REGISTRY: ChainRegistryEntry[] = [';
const endMarker = '\n];\n';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx + startMarker.length);

const header = content.substring(0, startIdx + startMarker.length) + '\n';
const footer = content.substring(endIdx);
const block = content.substring(startIdx + startMarker.length, endIdx);

// Parse entries by splitting on '  {\n    id:'
const entries = [];
const lines = block.split('\n');
let current = [];
for (const line of lines) {
  if (/^\s*{\s*$/.test(line.trim()) || (line.includes('id:') && current.length === 0)) {
    if (current.length > 0) entries.push(current.join('\n'));
    current = [line];
  } else {
    current.push(line);
  }
}
if (current.length > 0) entries.push(current.join('\n'));

// Deduplicate by chain id
const seen = new Set();
const unique = [];
for (const entry of entries) {
  const m = entry.match(/id:\s*(\d+)/);
  if (m) {
    const id = m[1];
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(entry);
    }
  }
}

unique.sort((a, b) => {
  const aid = parseInt(a.match(/id:\s*(\d+)/)?.[1] || '0');
  const bid = parseInt(b.match(/id:\s*(\d+)/)?.[1] || '0');
  return aid - bid;
});

const newBlock = unique.join(',\n');
const newContent = header + newBlock + footer;
writeFileSync(file, newContent, 'utf-8');

console.log(`Deduped: ${entries.length} -> ${unique.length} unique entries`);
console.log(`Lines: ${newContent.split('\n').length}`);
