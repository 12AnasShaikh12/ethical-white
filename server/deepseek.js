import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'node:fs/promises'
import path from 'node:path'

const app = express()
const port = process.env.API_PORT || 8787
const unansweredLog = path.resolve('server/unanswered-questions.jsonl')
app.use(cors())
app.use(express.json({ limit: '32kb' }))

const systemPrompt = `You are the Ethical White skincare shopping assistant.
Only answer from the provided product context plus cautious, general skincare knowledge.
Never invent clinical claims, certifications, ingredients, medical guarantees, or results.
Keep answers concise: 2 to 4 sentences. For comparisons, recommend only a product present in the catalog.
For order issues, complaints, reactions, diagnosis, or anything outside product Q&A, say that a human support specialist should help and offer Contact human support.
When useful, include a short deep-link hint such as "Open the Ingredients tab".`

app.post('/api/chat', async (req, res) => {
  const { question, product, history = [] } = req.body || {}
  if (!question || typeof question !== 'string') return res.status(400).json({ error: 'A question is required.' })
  if (!process.env.DEEPSEEK_API_KEY) {
    await logUnanswered(question, product, 'missing_api_key')
    return res.json({ answer: 'I’m ready to help with ingredients, usage, and skin fit. Connect the DeepSeek API key to enable live answers, or contact human support for a personal recommendation.' })
  }

  const context = JSON.stringify({ currentProduct: product, catalog: 'Use the product catalog supplied by the app context only.' })
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', temperature: 0.2, max_tokens: 220, messages: [{ role: 'system', content: systemPrompt }, { role: 'system', content: `PRODUCT CONTEXT: ${context}` }, ...history.slice(-8).map(message => ({ role: message.role, content: message.text })), { role: 'user', content: question }] }),
    })
    if (!response.ok) {
      const reason = response.status === 402
        ? 'provider_credits_unavailable'
        : `DeepSeek returned ${response.status}`
      await logUnanswered(question, product, reason)
      const answer = response.status === 402
        ? 'The skin guide is temporarily unavailable because the DeepSeek account has no available credits. Add credits to the account or configure another API key, then try again.'
        : 'I could not reach the skin guide right now. Please try again or contact human support.'
      return res.status(502).json({ error: 'Assistant unavailable', answer })
    }
    const data = await response.json()
    return res.json({ answer: data.choices?.[0]?.message?.content || 'I could not find that in my product notes. Contact human support for help.' })
  } catch (error) {
    await logUnanswered(question, product, error.message)
    return res.status(502).json({ error: 'Assistant unavailable', answer: 'I could not reach the skin guide right now. Please try again or contact human support.' })
  }
})

async function logUnanswered(question, product, reason) {
  const entry = JSON.stringify({ at: new Date().toISOString(), question, productId: product?.id, reason }) + '\n'
  await fs.mkdir(path.dirname(unansweredLog), { recursive: true })
  await fs.appendFile(unansweredLog, entry)
}

const distDirectory = path.resolve('dist')
app.use(express.static(distDirectory))
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(distDirectory, 'index.html'))
  }
  return next()
})

app.listen(port, () => console.log(`Ethical White assistant API listening on http://localhost:${port}`))
