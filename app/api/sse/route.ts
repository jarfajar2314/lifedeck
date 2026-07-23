import { auth } from "@/lib/auth"
import { sseManager } from "@/lib/sse-manager"
import { uid } from "@/lib/uid"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const clientId = uid()

  const stream = new ReadableStream({
    start(controller) {
      sseManager.addClient(clientId, controller, session.user.id)

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30_000)

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        sseManager.removeClient(clientId)
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

export const runtime = "nodejs"
