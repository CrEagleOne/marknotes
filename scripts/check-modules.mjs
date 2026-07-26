const requiredModules = [
  "@tailwindcss/vite",
  "@tauri-apps/api",
  "@tauri-apps/plugin-dialog",
  "@tauri-apps/plugin-fs",
  "@vitejs/plugin-react",
  "dompurify",
  "highlight.js",
  "katex",
  "lucide-react",
  "marked",
  "marked-highlight",
  "marked-katex-extension",
  "mermaid",
  "react",
  "react-dom",
  "tailwindcss",
  "vite"
];
let failed = false;
for (const name of requiredModules) {
  try {
    await import.meta.resolve(name);
    console.log(`[OK] ${name}`);
  } catch (error) {
    failed = true;
    console.error(`[MISSING] ${name}: ${error.message}`);
  }
}
process.exitCode = failed ? 1 : 0;
