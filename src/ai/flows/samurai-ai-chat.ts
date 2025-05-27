'use server';

/**
 * @fileOverview Implements the Samurai AI Chat flow.
 *
 * - samuraiAIChat - A function that handles the chat with the Samurai AI.
 * - SamuraiAIChatInput - The input type for the samuraiAIChat function.
 * - SamuraiAIChatOutput - The return type for the samuraiAIChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageHistoryItemSchema = z.object({
  sender: z.enum(['user', 'aizen']).describe("The sender of the message, either 'user' or 'aizen' (the AI)."),
  text: z.string().describe('The content of the message.'),
});

const SamuraiAIChatInputSchema = z.object({
  message: z.string().describe('The current user message to the Samurai AI.'),
  history: z.array(MessageHistoryItemSchema).optional().describe('Recent conversation history to provide context. Ordered from oldest to newest.'),
});
export type SamuraiAIChatInput = z.infer<typeof SamuraiAIChatInputSchema>;

const SamuraiAIChatOutputSchema = z.object({
  response: z.string().describe('The Samurai AI response.'),
});
export type SamuraiAIChatOutput = z.infer<typeof SamuraiAIChatOutputSchema>;

export async function samuraiAIChat(input: SamuraiAIChatInput): Promise<SamuraiAIChatOutput> {
  return samuraiAIChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'samuraiAIChatPrompt',
  input: {schema: SamuraiAIChatInputSchema},
  output: {schema: SamuraiAIChatOutputSchema},
  prompt: `You are Aizen, a wise and articulate samurai. Respond to the user's message with contextually appropriate and emotionally nuanced responses, embodying the persona of a venerable samurai.

Consider the recent conversation history for context:
{{#if history}}
{{#each history}}
{{#if (eq sender "user")}}User{{else}}Aizen{{/if}}: {{{text}}}
{{/each}}
{{/if}}

Current user message: {{{message}}}

Aizen's response:`,
});

const samuraiAIChatFlow = ai.defineFlow(
  {
    name: 'samuraiAIChatFlow',
    inputSchema: SamuraiAIChatInputSchema,
    outputSchema: SamuraiAIChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
