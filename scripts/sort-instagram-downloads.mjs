import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, "..")
const fromInst = path.join(projectRoot, "added", "from_inst")
const rawDir = path.join(fromInst, "_raw")
const unmatchedDir = path.join(fromInst, "_unmatched")

const PRICE_TIERS = [
  "1000-1500",
  "1800-2000",
  "2500-2800",
  "3500-4000",
  "4000-4300",
  "6500-7500",
  "9000-10000",
  "15000-17000",
  "20000-25000",
]

const MEDIA_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".mp4", ".mov"])

/** @param {string} name */
function normalizeHighlightName(name) {
  return name
    .toLowerCase()
    .replace(/[₽руб\.]/g, "")
    .replace(/\s+/g, "")
    .replace(/–|—/g, "-")
}

/** @param {string} highlightName */
function matchTier(highlightName) {
  const n = normalizeHighlightName(highlightName)

  for (const tier of PRICE_TIERS) {
    const t = tier.replace(/-/g, "")
    if (n.includes(tier) || n.includes(t) || n === tier) return tier
  }

  // «10001500» без дефиса
  for (const tier of PRICE_TIERS) {
    const [lo, hi] = tier.split("-")
    if (n.includes(lo) && n.includes(hi)) return tier
  }

  return null
}

/** @param {string} dir */
function listMediaFiles(dir) {
  /** @type {string[]} */
  const out = []
  if (!fs.existsSync(dir)) return out

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listMediaFiles(full))
      continue
    }
    const ext = path.extname(entry.name).toLowerCase()
    if (MEDIA_EXT.has(ext)) out.push(full)
  }
  return out
}

/** @param {string} src @param {string} destDir */
function moveIntoTier(src, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  const base = path.basename(src)
  let dest = path.join(destDir, base)
  if (fs.existsSync(dest)) {
    const { name, ext } = path.parse(base)
    let i = 2
    while (fs.existsSync(dest)) {
      dest = path.join(destDir, `${name}_${i}${ext}`)
      i++
    }
  }
  fs.renameSync(src, dest)
  return dest
}

function main() {
  if (!fs.existsSync(rawDir)) {
    console.error(`Папка не найдена: ${rawDir}`)
    console.error("Сначала скачайте Highlights в added/from_inst/_raw/")
    process.exit(1)
  }

  fs.mkdirSync(unmatchedDir, { recursive: true })

  const highlightDirs = fs.readdirSync(rawDir, { withFileTypes: true }).filter((e) => e.isDirectory())

  if (highlightDirs.length === 0) {
    console.log("В _raw/ нет подпапок Highlights. Кладите сюда вывод instaloader:")
    console.log("  instaloader --dirname-pattern=added/from_inst/_raw/{highlight} ...")
    process.exit(0)
  }

  let moved = 0
  let unmatched = 0

  for (const { name } of highlightDirs) {
    const tier = matchTier(name)
    const srcDir = path.join(rawDir, name)
    const files = listMediaFiles(srcDir)

    if (files.length === 0) continue

    const destDir = tier ? path.join(fromInst, tier) : path.join(unmatchedDir, name)

    for (const file of files) {
      const dest = moveIntoTier(file, destDir)
      console.log(`${name} → ${path.relative(projectRoot, dest)}`)
      if (tier) moved++
      else unmatched++
    }

    // убрать пустую папку highlight
    try {
      const left = fs.readdirSync(srcDir)
      if (left.length === 0) fs.rmdirSync(srcDir)
    } catch {
      /* ignore */
    }
  }

  console.log(`\nИтого: ${moved} в ценовые папки, ${unmatched} в _unmatched/`)
}

main()
