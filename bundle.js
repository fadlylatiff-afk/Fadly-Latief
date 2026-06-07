import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.error("Folder 'dist' tidak ditemukan. Harap jalankan 'npm run build' terlebih dahulu!");
  process.exit(1);
}

let htmlContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// 1. Cari tautan CSS dan masukkan secara inline
const cssRegex = /<link[^>]*href=["']\/?assets\/([^"']+\.css)["'][^>]*>/gi;
let match;
while ((match = cssRegex.exec(htmlContent)) !== null) {
  const cssFile = match[1];
  const cssPath = path.join(distDir, 'assets', cssFile);
  if (fs.existsSync(cssPath)) {
    const cssCode = fs.readFileSync(cssPath, 'utf-8');
    htmlContent = htmlContent.replace(match[0], `<style>\n${cssCode}\n</style>`);
    console.log(`✓ Ditautkan inline CSS: assets/${cssFile}`);
  }
}

// 2. Cari tautan JS dan masukkan secara inline
const jsRegex = /<script\s+[^>]*src=["']\/?assets\/([^"']+\.js)["'][^>]*><\/script>/gi;
while ((match = jsRegex.exec(htmlContent)) !== null) {
  const jsFile = match[1];
  const jsPath = path.join(distDir, 'assets', jsFile);
  if (fs.existsSync(jsPath)) {
    const jsCode = fs.readFileSync(jsPath, 'utf-8');
    htmlContent = htmlContent.replace(match[0], `<script>\n${jsCode}\n</script>`);
    console.log(`✓ Ditautkan inline JS: assets/${jsFile}`);
  }
}

// 3. Bersihkan sisa referensi path absolut atau slash statis jika ada (Vite default module preload dsb)
htmlContent = htmlContent.replace(/<link rel=["']modulepreload["'] href=["']\/?assets\/[^"']+["']>/gi, '');

// 4. Simpan file hasil bundling untuk Google Apps Script
const outputPath = path.join(distDir, 'Index.html');
fs.writeFileSync(outputPath, htmlContent, 'utf-8');
console.log(`\n🎉 BERHASIL BUNDLING! File tunggal Apps Script siap digunakan:`);
console.log(`👉 ${outputPath}`);
console.log(`\nSilakan salin seluruh isi file ini ke file 'Index.html' di editor Google Apps Script Anda.`);
