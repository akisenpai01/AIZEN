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

// This is the schema for the actual data structure used by the template after processing
const ProcessedMessageHistoryItemSchema = MessageHistoryItemSchema.extend({
  isUserMessage: z.boolean().describe('True if the sender is the user.'),
});

const SamuraiAIChatInputSchema = z.object({
  message: z.string().describe('The current user message to the Samurai AI.'),
  history: z.array(MessageHistoryItemSchema).optional().describe('Recent conversation history to provide context. Ordered from oldest to newest.'),
});
export type SamuraiAIChatInput = z.infer<typeof SamuraiAIChatInputSchema>;

// Schema for the data structure including the processed history for the prompt
const InternalPromptInputSchema = z.object({
  message: z.string(),
  history: z.array(ProcessedMessageHistoryItemSchema).optional(),
});

const SamuraiAIChatOutputSchema = z.object({
  response: z.string().describe('The Samurai AI response.'),
});
export type SamuraiAIChatOutput = z.infer<typeof SamuraiAIChatOutputSchema>;

export async function samuraiAIChat(input: SamuraiAIChatInput): Promise<SamuraiAIChatOutput> {
  return samuraiAIChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'samuraiAIChatPrompt',
  input: {schema: InternalPromptInputSchema}, // Use the internal schema that includes isUserMessage
  output: {schema: SamuraiAIChatOutputSchema},
  prompt: `You are Aizen, a wise and articulate samurai. Respond to the user's message with contextually appropriate and emotionally nuanced responses, embodying the persona of a venerable samurai.

Consider the recent conversation history for context:
{{#if history}}
{{#each history}}
{{#if isUserMessage}}User{{else}}Aizen{{/if}}: {{{text}}}
{{/each}}
{{/if}}

Current user message: {{{message}}}

Aizen's response:`,
});

const samuraiAIChatFlow = ai.defineFlow(
  {
    name: 'samuraiAIChatFlow',
    inputSchema: SamuraiAIChatInputSchema, // Flow input remains the original schema
    outputSchema: SamuraiAIChatOutputSchema,
  },
  async (input) => {
    // Process the input to add the isUserMessage flag for the template
    const processedInput = {
      ...input,
      history: input.history?.map(item => ({
        ...item,
        isUserMessage: item.sender === 'user',
      })),
    };
    // Now, 'processedInput' matches 'InternalPromptInputSchema' expected by the prompt
    const {output} = await prompt(processedInput);
    return output!;
  }
);
