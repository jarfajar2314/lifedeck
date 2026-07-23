type SSEClient = {
  id: string
  controller: ReadableStreamDefaultController
  userId: string
}

class SSEManager {
  private clients = new Map<string, SSEClient>()

  addClient(id: string, controller: ReadableStreamDefaultController, userId: string) {
    this.clients.set(id, { id, controller, userId })
  }

  removeClient(id: string) {
    this.clients.delete(id)
  }

  broadcast(event: string, data: unknown) {
    const payload = new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    for (const [id, client] of this.clients) {
      try {
        client.controller.enqueue(payload)
      } catch {
        this.clients.delete(id)
      }
    }
  }

  get clientCount() {
    return this.clients.size
  }
}

export const sseManager = new SSEManager()
