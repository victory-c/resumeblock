"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { OllamaStatus } from "@/types"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<
  OllamaStatus,
  { label: string; dotClass: string }
> = {
  ready: { label: "LLM Ready", dotClass: "bg-green-500" },
  loading: { label: "LLM Loading", dotClass: "bg-yellow-500" },
  offline: { label: "LLM Offline", dotClass: "bg-red-500" },
}

export function OllamaStatusIndicator() {
  const [status, setStatus] = useState<OllamaStatus>("offline")
  const [model, setModel] = useState("")
  const [baseUrl, setBaseUrl] = useState("")

  const poll = async () => {
    try {
      const res = await fetch("/api/ollama-status")
      if (res.ok) {
        const data = await res.json()
        setStatus(data.status as OllamaStatus)
        setModel(data.model || "")
        setBaseUrl(data.baseUrl || "")
      }
    } catch {
      setStatus("offline")
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(poll, 0)
    const id = setInterval(poll, 30_000)
    return () => {
      clearTimeout(timeoutId)
      clearInterval(id)
    }
  }, [])

  const { label, dotClass } = STATUS_CONFIG[status]

  return (
    <Dialog>
      <DialogTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
        <span className={cn("h-2 w-2 rounded-full shrink-0", dotClass)} />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ollama Connection</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", dotClass)} />
            <span className="font-medium">{label}</span>
          </div>
          <div className="rounded-md bg-muted p-3 space-y-1 font-mono text-xs">
            <div>URL: {baseUrl || "http://localhost:11434"}</div>
            <div>Model: {model || "llama3.1:8b"}</div>
          </div>
          {status === "offline" && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs space-y-1">
              <p className="font-medium text-destructive">LLM not detected</p>
              <p>Make sure Ollama is running:</p>
              <ol className="list-decimal ml-4 space-y-0.5 text-muted-foreground">
                <li>Install Ollama from ollama.com</li>
                <li>
                  Run: <code className="bg-muted px-1 rounded">ollama serve</code>
                </li>
                <li>
                  Pull model:{" "}
                  <code className="bg-muted px-1 rounded">
                    ollama pull llama3.1:8b
                  </code>
                </li>
              </ol>
              <p className="text-muted-foreground mt-2">
                All AI features degrade gracefully to manual mode when offline.
              </p>
            </div>
          )}
          {status === "loading" && (
            <p className="text-muted-foreground text-xs">
              Ollama is running but the configured model ({model}) is not loaded yet.
              It may be downloading or not pulled. Run:{" "}
              <code className="bg-muted px-1 rounded">ollama pull {model || "llama3.1:8b"}</code>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
