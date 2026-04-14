import { NextResponse } from "next/server"
import { checkOllamaStatus, ollamaConfig } from "@/lib/ollama"

export async function GET() {
  const status = await checkOllamaStatus()
  return NextResponse.json({
    status,
    model: ollamaConfig.model,
    baseUrl: ollamaConfig.baseUrl,
  })
}
