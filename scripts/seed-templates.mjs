import fs from "node:fs"
import path from "node:path"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const templateDir = path.resolve(process.cwd(), "data/templates")
const templates = [
  { id: "10936dfb-8a2f-4b42-b77c-b71d438f62bd", name: "Single-column (bundled)" },
  { id: "de81f83b-b92c-4330-a32a-c9a7752de27b", name: "Two-column (bundled)" },
]

function placeholders(source) {
  return [...source.matchAll(/%%([A-Z_]+(?::[A-Z0-9_ -]+)?)%%/g)].map((match) => match[1])
}

try {
  for (const template of templates) {
    const latexSource = fs.readFileSync(path.join(templateDir, `${template.id}.tex`), "utf8")
    await prisma.template.upsert({
      where: { id: template.id },
      create: { ...template, latexSource, placeholderFormat: JSON.stringify(placeholders(latexSource)) },
      update: { name: template.name, latexSource, placeholderFormat: JSON.stringify(placeholders(latexSource)) },
    })
  }
  console.log("Bundled templates are ready.")
} finally {
  await prisma.$disconnect()
}
