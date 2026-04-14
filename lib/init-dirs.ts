import fs from "fs"
import path from "path"

const dirs = [
  process.env.UPLOAD_DIR || "./data/uploads",
  process.env.TEMPLATES_DIR || "./data/templates",
  process.env.OUTPUT_DIR || "./data/output",
]

export function initDirs(): void {
  for (const dir of dirs) {
    const absolute = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir)
    if (!fs.existsSync(absolute)) {
      fs.mkdirSync(absolute, { recursive: true })
    }
  }
}
