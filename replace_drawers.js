import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const targetDir = path.join(__dirname, 'src/features');
const allFiles = getAllFiles(targetDir);

let count = 0;

allFiles.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Clean duplicate Modal import lines
  const modalImportRegex = /import\s+\{\s*Modal\s*\}\s+from\s+['"]@\/shared\/components\/ui\/Modal['"];?\n?/g;
  const matches = content.match(modalImportRegex);
  if (matches && matches.length > 1) {
    content = content.replace(modalImportRegex, '');
    content = "import { Modal } from '@/shared/components/ui/Modal';\n" + content;
  }

  // Replace any leftover Drawer tags with Modal
  content = content.replace(/<Drawer\b([^>]*?)>/g, (match, p1) => {
    let newTag = `<Modal${p1}`;
    if (!newTag.includes('width=')) {
      newTag += ` width="max-w-2xl"`;
    }
    newTag += '>';
    return newTag;
  });
  content = content.replace(/<\/Drawer>/g, '</Modal>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
  }
});

console.log(`Deduplicated imports and verified ${count} files.`);
