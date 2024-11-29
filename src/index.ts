/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import Stripe from 'stripe'
import { Hono } from 'hono'
import { env } from 'hono/adapter'

const app = new Hono()

app.post('/webhook', async (context) => {
  const { STRIPE_SECRET_API_KEY, STRIPE_WEBHOOK_SECRET } =
    env(context)

  const stripe = new Stripe(STRIPE_SECRET_API_KEY as string)
  const signature = context.req.header('stripe-signature')
  try {
    if (!signature) {
      return context.text('', 400)
    }
    const body = await context.req.text()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET as string
    )
    switch (event.type) {
      case 'payment_intent.created': {
        console.log(event.data.object)
        break
      }
      default:
        break
    }
    return context.text('', 200)
  } catch (err) {
    const errorMessage = `⚠️  Webhook signature verification failed. ${
      err instanceof Error ? err.message : 'Internal server error.'
    }`
    console.log(errorMessage)
    return context.text(errorMessage, 400)
  }
})

export default app
