// Assembles an upload-ready Firefox package in package-firefox/.
// Run after `pnpm run build`: `pnpm run package:firefox`.
import {cpSync, copyFileSync, existsSync, mkdirSync, rmSync} from 'node:fs';

const outDir = 'package-firefox';
const files = ['popup.html', 'options.html', 'changelog.html'];
const dirs = ['dist', 'images', 'css'];

if (existsSync(outDir)) {
	rmSync(outDir, {recursive: true, force: true});
}
mkdirSync(outDir, {recursive: true});

for (const dir of dirs) {
	if (!existsSync(dir)) {
		console.warn(`warning: ${dir}/ not found, skipping (run pnpm run build first)`);
		continue;
	}
	cpSync(dir, `${outDir}/${dir}`, {recursive: true});
}
for (const file of files) {
	if (!existsSync(file)) {
		console.warn(`warning: ${file} not found, skipping`);
		continue;
	}
	copyFileSync(file, `${outDir}/${file}`);
}
copyFileSync('manifest-firefox.json', `${outDir}/manifest.json`);
console.log(`Firefox package ready in ${outDir}/`);
