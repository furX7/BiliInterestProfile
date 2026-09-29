import { defineConfig } from 'wxt'
import packageJson from './package.json'

export function isValidExtensionVersion(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const components = value.split('.')
  return (
    components.length <= 4 &&
    components.every(
      (component) => /^(?:0|[1-9]\d*)$/.test(component) && Number(component) <= 65535,
    ) &&
    components.some((component) => component !== '0')
  )
}

if (!isValidExtensionVersion(packageJson.version)) {
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
