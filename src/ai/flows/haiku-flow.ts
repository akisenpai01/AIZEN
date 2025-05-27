
'use server';
/**
 * @fileOverview A Genkit flow for generating Haikus.
 *
 * - generateHaiku - A function that generates a haiku based on a theme.
 * - HaikuInput - The input type for the generateHaiku function.
 * - HaikuOutput - The return type for the generateHaiku function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HaikuInputSchema = z.object({
  theme: z.string().describe('The theme or subject for the haiku.'),
});
export type HaikuInput = z.infer<typeof HaikuInputSchema>;

const HaikuOutputSchema = z.object({
  haiku: z.string().describe('The generated haiku (typically 3 lines, 5-7-5 syllables).'),
});
export type HaikuOutput = z.infer<typeof HaikuOutputSchema>;

export async function generateHaiku(input: HaikuInput): Promise<HaikuOutput> {
  return generateHaikuFlow(input);
}

const haikuPrompt = ai.definePrompt({
  name: 'haikuPrompt',
  input: {schema: HaikuInputSchema},
  output: {schema: HaikuOutputSchema},
  prompt: `You are a skilled Haiku poet. Craft a Haiku (three lines, 5-7-5 syllables) about the theme: {{{theme}}}.
Present only the haiku.`,
});

const generateHaikuFlow = ai.defineFlow(
  {
    name: 'generateHaikuFlow',
    inputSchema: HaikuInputSchema,
    outputSchema: HaikuOutputSchema,
  },
  async (input) => {
    const {output} = await haikuPrompt(input);
    if (!output) {
        throw new Error("Aizen's muse is silent; the haiku remains unwritten.");
    }
    return output;
  }
);
