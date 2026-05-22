import { BotFrameworkAdapter, ConversationReference, TurnContext } from 'botbuilder'

const adapter = new BotFrameworkAdapter({
  appId: process.env.TEAMS_APP_ID,
  appPassword: process.env.TEAMS_APP_SECRET,
})

// Stocke la référence de conversation pour envoyer des messages proactifs
// En prod, cette référence doit être persistée en base (Neon)
let conversationRef: Partial<ConversationReference> | null = null

export function saveConversationReference(context: TurnContext) {
  conversationRef = TurnContext.getConversationReference(context.activity)
}

export async function sendTeamsNotification(message: string) {
  if (!conversationRef) {
    console.warn('[Teams] Pas de référence de conversation enregistrée')
    return
  }

  await adapter.continueConversation(
    conversationRef,
    async (context: TurnContext) => {
      await context.sendActivity(message)
    }
  )
}
