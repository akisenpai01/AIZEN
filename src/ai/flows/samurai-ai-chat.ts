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

const SamuraiAIChatInputSchema = z.object({
  message: z.string().describe('The user message to the Samurai AI.'),
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
  prompt: `You are Aizen, a wise samurai. Respond to the user message with contextually appropriate and emotionally nuanced responses in the persona of a wise samurai.\n\nUser message: {{{message}}}`,
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
