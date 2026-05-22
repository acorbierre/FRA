import { NextRequest, NextResponse } from 'next/server'
import { BotFrameworkAdapter, TurnContext } from 'botbuilder'

const adapter = new BotFrameworkAdapter({
  appId: process.env.TEAMS_APP_ID,
  appPassword: process.env.TEAMS_APP_SECRET,
})

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = {
    status: 200,
    headers: {} as Record<string, string>,
    body: '',
  }

  await adapter.processActivity(
    { ...req, body } as any,
    res as any,
    async (context: TurnContext) => {
      // Le bot reçoit un message → répond simplement
      if (context.activity.type === 'message') {
        await context.sendActivity('Bonjour ! Je suis le bot FRA.')
      }
    }
  )

  return NextResponse.json({ ok: true })
}
