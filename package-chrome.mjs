import {cpSync, copyFileSync, existsSync, mkdirSync, rmSync} from 'node:fs';

const outDir = 'package-chrome';
const files = ['popup.html', 'options.html', 'changelog.html'];
const dirs = ['dist', 'images'];

if (existsSync(outDir)) {
	rmSync(outDir, {recursive: true, force: true});
}
mkdirSync(outDir, {recursive: true});

for (const dir of dirs) {
	if (!existsSync(dir)) {
		console.warn(`warning: ${dir}/ not found, skipping (run build first)`);
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

const cssDir = 'css';
if (existsSync(cssDir)) {
	cpSync(cssDir, `${outDir}/css`, {recursive: true});
} else {
	const cssFiles = ['dark.css', 'fun.css', 'normalize.css', 'option.css', 'popup.css'];
	for (const css of cssFiles) {
		if (existsSync(css)) {
			copyFileSync(css, `${outDir}/${css}`);
		}
	}
}

copyFileSync('manifest.json', `${outDir}/manifest.json`);
console.log(`Chrome package ready in ${outDir}/`);
