import path from 'node:path'
import { fileURLToPath } from 'node:url'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const currentFile = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFile)

export default {
    root: path.join(currentDir, 'sources'), // Source files (where index.html is)
    envDir: currentDir, // Directory where the env file is located
    publicDir: path.join(currentDir, 'static'), // Static assets served as-is
    base: './', // Public path (what's after the domain)
    server:
    {
        host: true, // Open to local network and display URL
        port: 5174,
        open: false
    },
    preview:
    {
        host: true,
        port: 4174,
        open: false
    },
    build:
    {
        outDir: path.join(currentDir, '../dist/world'), // Output in the main frontend dist/world folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: false // Add sourcemap
    },
    plugins:
    [
        wasm(),
        topLevelAwait(),
        nodePolyfills(),
    ]
}
