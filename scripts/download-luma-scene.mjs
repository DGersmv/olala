import fs from "fs"
import https from "https"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const LUMA_PUBLIC_API = "https://webapp.engineeringlumalabs.com/api/v3/captures"

/** Luma artifact type → local filename for luma-web `source: "/luma/..."` */
const ARTIFACT_FILES = {
  gs_compressed: "gs_compressed.bin",
  gs_compressed_meta: "gs_compressed_meta.json",
  with_background_gs_camera_params: "with_background_gs_camera_params.json",
  skybox: "skybox.jpg",
  skybox_meta: "skybox_meta.json",
  semantics: "semantics.bin",
}

function parseArgs(argv) {
  let captureId = "918250fc-a1ea-4d1a-979b-b241517d4bd2"
  let slug = "olala-inbox"

  for (const arg of argv) {
    if (arg.startsWith("--capture=")) captureId = arg.slice("--capture=".length)
    else if (arg.startsWith("--slug=")) slug = arg.slice("--slug=".length)
    else if (arg.startsWith("--url=")) {
      const url = arg.slice("--url=".length)
      const match = url.match(/capture\/([\w-]+)/)
      if (match) captureId = match[1]
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/download-luma-scene.mjs [options]

Options:
  --capture=<uuid>   Luma capture id (default: olala-inbox)
  --url=<url>        Full lumalabs.ai capture URL
  --slug=<folder>    Output folder under public/luma/ (default: olala-inbox)
`)
      process.exit(0)
    }
  }

  return { captureId, slug }
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath)
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`GET ${url} → ${res.statusCode}`))
          return
        }
        res.pipe(file)
        file.on("finish", () => {
          file.close()
          resolve(fs.statSync(destPath).size)
        })
      })
      .on("error", reject)
  })
}

async function main() {
  const { captureId, slug } = parseArgs(process.argv.slice(2))
  const outDir = path.join(root, "public", "luma", slug)
  fs.mkdirSync(outDir, { recursive: true })

  console.log(`Fetching capture ${captureId}…`)
  const metaRes = await fetch(`${LUMA_PUBLIC_API}/${captureId}/public`)
  if (!metaRes.ok) throw new Error(`Luma API ${metaRes.status}`)
  const metaJson = await metaRes.json()
  const response = metaJson.response ?? metaJson.latestRun
  const artifacts = response?.artifacts
  if (!Array.isArray(artifacts)) throw new Error("No artifacts in Luma response")

  const byType = Object.fromEntries(artifacts.map((a) => [a.type, a.url]))
  const required = ["gs_compressed", "gs_compressed_meta"]
  for (const type of required) {
    if (!byType[type]) throw new Error(`Missing required artifact: ${type}`)
  }

  let totalBytes = 0
  const downloaded = []

  for (const [type, filename] of Object.entries(ARTIFACT_FILES)) {
    const url = byType[type]
    if (!url) continue
    const dest = path.join(outDir, filename)
    process.stdout.write(`  ${filename}… `)
    const bytes = await downloadFile(url, dest)
    totalBytes += bytes
    downloaded.push({ type, filename, bytes })
    console.log(`${(bytes / 1024).toFixed(1)} KB`)
  }

  const manifest = {
    captureId,
    slug,
    title: response.title ?? null,
    downloadedAt: new Date().toISOString(),
    publicPath: `/luma/${slug}`,
    files: downloaded,
    totalBytes,
  }
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )

  console.log(`\nDone: ${downloaded.length} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
  console.log(`Scene path: /luma/${slug}`)
  console.log(`Set OLALA_LUMA_SCENE_SRC in lib/luma-scene.ts if you changed --slug`)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
