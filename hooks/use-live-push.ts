import { useEffect } from "react"

/**
 * A highly scalable architecture hook for listening to pushed server events.
 * 
 * When scaling up your API, replace the setInterval with an actual EventSource (SSE) 
 * or WebSocket connection. This ensures your app lightning fast and only downloads
 * initial payload on hard reloads, relying purely on streamed additions/updates otherwise.
 */
export function useLivePush<T>(
  channelEndpoint: string | undefined,
  onNewData: (pushedItems: T[]) => void
) {
  useEffect(() => {
    if (!channelEndpoint) return

    let sse: EventSource | null = null
    let reconnectTimer: NodeJS.Timeout

    const connect = () => {
      sse = new EventSource(channelEndpoint)

      sse.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data)
          const itemsToPush = Array.isArray(newData) ? newData : [newData]
          console.log(`[SSE Push] Received data from ${channelEndpoint}:`, itemsToPush)
          onNewData(itemsToPush)
        } catch (err) {
          console.error(`[SSE Push] Failed to parse data:`, err)
        }
      }

      sse.onerror = () => {
        // When the server is completely offline, the browser will spam "Failed to load resource" natively.
        // We catch the error, forcibly close the EventSource to kill the aggressive browser retries, 
        // and do our own quiet 10 second backoff before trying again.
        console.warn(`[SSE Push] Backend offline. Retrying connection in 10 seconds...`)
        sse?.close()
        reconnectTimer = setTimeout(connect, 10000)
      }
    }

    connect()

    return () => {
      sse?.close()
      clearTimeout(reconnectTimer)
    }
  }, [channelEndpoint, onNewData])
}
