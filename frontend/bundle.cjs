const esbuild = require('esbuild-wasm');
const path = require('path');

async function run() {
  console.log("Initializing esbuild-wasm...");
  await esbuild.initialize({
    // Let esbuild locate the wasm binary automatically
  });
  
  console.log("Bundling React application...");
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'main.tsx')],
    bundle: true,
    outfile: path.join(__dirname, 'dist', 'index.js'),
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.css': 'css',
    },
    define: {
      'process.env.NODE_ENV': '"development"',
    },
    minify: false,
    sourcemap: true,
  });
  console.log("ESBuild bundling complete!");
}

run().catch(err => {
  console.error("Bundle error:", err);
  process.exit(1);
});
