import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/cloudflare-workers'
import { requireAdminAuth } from '../middleware/admin-auth'
import { z } from 'zod'

type Env = {
  Bindings: {
    ENVIRONMENT: string
    API_VERSION: string
    ADMIN_API_KEY: string
    JWT_SECRET: string
  }
}

const app = new Hono<Env>()

// Track active connections per channel (in-memory for now)
// In production, use Durable Objects or KV for distributed state
const channelSubscriptions = new Map<string, Set<WebSocket>>()

// WebSocket endpoint
app.get(
  '/ws',
  upgradeWebSocket((c) => {
    const channels = new Set<string>()
    let clientId: string | null = null

    return {
      onMessage(event, ws) {
        try {
          const data = typeof event.data === 'string' ? event.data : ''

          // Parse message
          let message: any
          try {
            message = JSON.parse(data)
          } catch {
            // Plain text message - treat as echo test
            ws.send(JSON.stringify({
              type: 'echo',
              data: data,
              timestamp: new Date().toISOString()
            }))
            return
          }

          // Handle different message types
          switch (message.type) {
            case 'subscribe': {
              // Subscribe to a channel
              const channel = message.channel
              if (channel && typeof channel === 'string') {
                channels.add(channel)
                
                // Add to channel subscriptions
                if (!channelSubscriptions.has(channel)) {
                  channelSubscriptions.set(channel, new Set())
                }
                channelSubscriptions.get(channel)!.add(ws.raw as WebSocket)
                
                ws.send(JSON.stringify({
                  type: 'subscribed',
                  channel: channel,
                  timestamp: new Date().toISOString()
                }))
              } else {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Invalid channel name',
                  timestamp: new Date().toISOString()
                }))
              }
              break
            }

            case 'unsubscribe': {
              // Unsubscribe from a channel
              const channel = message.channel
              if (channel && channels.has(channel)) {
                channels.delete(channel)
                
                // Remove from channel subscriptions
                const subscribers = channelSubscriptions.get(channel)
                if (subscribers) {
                  subscribers.delete(ws.raw as WebSocket)
                  if (subscribers.size === 0) {
                    channelSubscriptions.delete(channel)
                  }
                }
                
                ws.send(JSON.stringify({
                  type: 'unsubscribed',
                  channel: channel,
                  timestamp: new Date().toISOString()
                }))
              }
              break
            }

            case 'ping': {
              // Keepalive ping
              ws.send(JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString()
              }))
              break
            }

            case 'identify': {
              // Client identification
              if (message.clientId && typeof message.clientId === 'string') {
                clientId = message.clientId
                ws.send(JSON.stringify({
                  type: 'identified',
                  clientId: clientId,
                  timestamp: new Date().toISOString()
                }))
              }
              break
            }

            default: {
              // Echo unknown message types
              ws.send(JSON.stringify({
                type: 'echo',
                data: message,
                timestamp: new Date().toISOString()
              }))
            }
          }
        } catch (error) {
          console.error('[WebSocket] Message handling error:', error)
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message',
            timestamp: new Date().toISOString()
          }))
        }
      },

      onClose(event, ws) {
        // Clean up channel subscriptions
        for (const channel of channels) {
          const subscribers = channelSubscriptions.get(channel)
          if (subscribers) {
            subscribers.delete(ws.raw as WebSocket)
            if (subscribers.size === 0) {
              channelSubscriptions.delete(channel)
            }
          }
        }
        channels.clear()
      },

      onError(error, ws) {
        console.error('[WebSocket] Error:', error)
        // Error handler - connection will be closed automatically
      }
    }
  })
)

// WebSocket status endpoint (HTTP)
app.get('/ws/status', (c) => {
  const activeChannels: Record<string, number> = {}
  for (const [channel, subscribers] of channelSubscriptions.entries()) {
    activeChannels[channel] = subscribers.size
  }

  return c.json({
    status: 'active',
    service: 'websocket',
    activeChannels: Object.keys(activeChannels).length,
    channels: activeChannels,
    timestamp: new Date().toISOString()
  })
})

// Broadcast schema validation
const BroadcastMessageSchema = z.object({
  channel: z.string().max(100),
  message: z.unknown(),
})

// Broadcast to channel (HTTP endpoint for admin/testing)
// SECURITY: Requires admin authentication
app.post('/ws/broadcast', requireAdminAuth, async (c) => {
  try {
    const body = await c.req.json()
    
    // Validate message structure
    const parsed = BroadcastMessageSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({
        error: 'Invalid request',
        details: parsed.error.issues
      }, 400)
    }
    
    const { channel, message } = parsed.data

    const subscribers = channelSubscriptions.get(channel)
    if (!subscribers || subscribers.size === 0) {
      return c.json({
        error: 'No subscribers for channel',
        channel
      }, 404)
    }

    const payload = JSON.stringify({
      type: 'broadcast',
      channel,
      data: message,
      timestamp: new Date().toISOString()
    })

    let sent = 0
    for (const ws of subscribers) {
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === 1) {
          ws.send(payload)
          sent++
        }
      } catch (err) {
        console.error('[WebSocket] Broadcast error to subscriber:', err)
      }
    }

    return c.json({
      success: true,
      channel,
      recipients: sent,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      error: 'Invalid request body'
    }, 400)
  }
})

export default app
