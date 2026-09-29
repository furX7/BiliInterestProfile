import { defineConfig } from 'wxt'
import packageJson from './package.json'

if (typeof packageJson.version !== 'string' || !/^\d+(?:\.\d+){0,3}$/.test(packageJson.version)) {
  throw new Error('package.json must contain a valid extension version')
}

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Bili Interest Profile',
    description: 'Local analysis of public Bilibili profile content',
    version: packageJson.version,
  },
})
