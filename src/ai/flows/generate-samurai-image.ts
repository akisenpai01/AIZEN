'use server';
/**
 * @fileOverview A Genkit flow for generating samurai-themed images.
 *
 * - generateSamuraiImage - A function that generates an image based on a prompt.
 * - GenerateImageInput - The input type for the generateSamuraiImage function.
 * - GenerateImageOutput - The return type for the generateSamuraiImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A textual description of the image to generate. Should be samurai-themed or contextually relevant.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI (e.g., 'data:image/png;base64,...')."),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateSamuraiImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateSamuraiImageFlow(input);
}

const generateSamuraiImageFlow = ai.defineFlow(
  {
    name: 'generateSamuraiImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Must use this model for image generation
        prompt: `Generate a stylized image in a samurai art style. ${input.prompt}`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both
           safetySettings: [ // Relax safety settings slightly for creative images
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
      });

      if (!media || !media.url) {
        throw new Error('Image generation failed to produce a valid media object or URL.');
      }
      return {imageDataUri: media.url};
    } catch (error) {
      console.error('Error in generateSamuraiImageFlow:', error);
      // Consider how to surface this error; for now, throw to be caught by caller
      throw new Error(`Aizen's artistic vision is clouded. Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
