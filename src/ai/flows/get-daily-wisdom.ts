'use server';
/**
 * @fileOverview A Genkit flow for Aizen to share daily wisdom.
 *
 * - getDailyWisdom - A function that retrieves a piece of wisdom from Aizen.
 * - GetWisdomInput - The input type for the getDailyWisdom function.
 * - GetWisdomOutput - The return type for the getDailyWisdom function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetWisdomInputSchema = z.object({
  // No specific input needed for now, but can be extended later (e.g., topic preference)
}).describe("Input for requesting daily wisdom. Currently empty.");
export type GetWisdomInput = z.infer<typeof GetWisdomInputSchema>;

const GetWisdomOutputSchema = z.object({
  wisdom: z.string().describe('A piece of samurai wisdom, a concise haiku, or a thoughtful proverb shared by Aizen.'),
});
export type GetWisdomOutput = z.infer<typeof GetWisdomOutputSchema>;

export async function getDailyWisdom(input: GetWisdomInput): Promise<GetWisdomOutput> {
  return getDailyWisdomFlow(input);
}

const wisdomPrompt = ai.definePrompt({
  name: 'getDailyWisdomPrompt',
  input: {schema: GetWisdomInputSchema},
  output: {schema: GetWisdomOutputSchema},
  prompt: `You are Aizen, a wise samurai. 
Share a piece of samurai wisdom, a concise and evocative haiku, or a thoughtful proverb suitable for daily reflection. 
Keep it relatively brief and impactful. Ensure the response is formatted as a single string for the 'wisdom' field.`,
});

const getDailyWisdomFlow = ai.defineFlow(
  {
    name: 'getDailyWisdomFlow',
    inputSchema: GetWisdomInputSchema,
    outputSchema: GetWisdomOutputSchema,
  },
  async (input: GetWisdomInput) => { // Explicitly type input here
    const {output} = await wisdomPrompt(input);
    if (!output) {
      // This case should ideally not happen if the prompt and model behave as expected.
      // However, it's good practice to handle it.
      throw new Error("Aizen's wisdom is currently beyond reach. The flow did not produce an output.");
    }
    return output;
  }
);
