"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    Tokenizer: any
  }
}

type Props = {
  amount: string // "5.55" style
  onToken: (token: string, rawResponse: any) => void
  onError?: (message: string, rawResponse: any) => void
}

export default function FluidPayTokenizer({ amount, onToken, onError }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tokenizerRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const pubKey = process.env.NEXT_PUBLIC_FLUIDPAY_PUBLIC_KEY
    if (!pubKey) {
      onError?.("Missing NEXT_PUBLIC_FLUIDPAY_PUBLIC_KEY", null)
      return
    }

    const init = () => {
      if (!window.Tokenizer) return false

      tokenizerRef.current = new window.Tokenizer({
        apikey: pubKey,
        container: containerRef.current, // can pass element OR selector depending on implementation
        submission: (resp: any) => {
          // Docs describe status handling: success / error / validation
          if (resp?.status === "success" && resp?.token) {
            onToken(resp.token, resp)
          } else {
            const msg =
              resp?.msg ||
              (resp?.invalid ? JSON.stringify(resp.invalid) : "Tokenizer failed")
            onError?.(msg, resp)
          }
        },
        onLoad: () => setReady(true),
      })

      return true
    }

    // Wait a tick for script load
    const t = setInterval(() => {
      if (init()) clearInterval(t)
    }, 50)

    return () => clearInterval(t)
  }, [onError, onToken])

  const submit = () => {
    if (!tokenizerRef.current) return
    // Docs: submit can take amount; required for certain flows (e.g. paay)
    tokenizerRef.current.submit(amount)
  }

  return (
    <div>
      <div ref={containerRef} />
      <button type="button" onClick={submit} disabled={!ready}>
        Pay
      </button>
    </div>
  )
}