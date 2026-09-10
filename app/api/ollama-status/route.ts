import { NextRequest, NextResponse } from "next/server"
import { checkOllamaStatus, ollamaConfig } from "@/lib/ollama"
import { enforceLocalRequest } from "@/lib/compile-security"

export async function GET(req: NextRequest) {
  const localOnlyError = enforceLocalRequest(req)
  if (localOnlyError) return localOnlyError
  const status = await checkOllamaStatus()
  return NextResponse.json({
    status,
    model: ollamaConfig.model,
    baseUrl: ollamaConfig.baseUrl,
  })
}
