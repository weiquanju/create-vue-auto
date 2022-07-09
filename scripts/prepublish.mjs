#!/usr/bin/env zx
import 'zx/globals'

// await $`pnpm build`

let { version } = JSON.parse(await fs.readFile('./package.json'))

console.log(version)

await $`git tag -m "v${version}" v${version}`

const projectRoot = path.resolve(__dirname, '../')
cd(projectRoot)
await $`git add .`
await $`git commit -m 'chore: publish' --allow-empty`
await $`git push --follow-tags`
