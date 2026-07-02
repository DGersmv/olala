import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..", "added", "from_inst")

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

const EXTRA = ["_raw", "_unmatched"]

for (const name of [...PRICE_TIERS, ...EXTRA]) {
  const dir = path.join(root, name)
  fs.mkdirSync(dir, { recursive: true })
  const keep = path.join(dir, ".gitkeep")
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, "")
  console.log(`  ${path.relative(path.join(__dirname, ".."), dir)}/`)
}

console.log(`\nГотово: ${PRICE_TIERS.length} ценовых папок + _raw + _unmatched`)
