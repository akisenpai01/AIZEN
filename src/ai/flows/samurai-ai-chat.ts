'use server';

/**
 * @fileOverview Implements the Samurai AI Chat flow, now with image generation capabilities.
 *
 * - samuraiAIChat - A function that handles the chat with the Samurai AI.
 * - SamuraiAIChatInput - The input type for the samuraiAIChat function.
 * - SamuraiAIChatOutput - The return type for the samuraiAIChat function.
 */

import {ai} from '@/ai/genkit';
import {generateSamuraiImage, type GenerateImageInput} from './generate-samurai-image';
import {z} from 'genkit';

const MessageHistoryItemSchema = z.object({
  sender: z.enum(['user', 'aizen']).describe("The sender of the message, either 'user' or 'aizen' (the AI)."),
  text: z.string().describe('The content of the message.'),
});

const ProcessedMessageHistoryItemSchema = MessageHistoryItemSchema.extend({
  isUserMessage: z.boolean().describe('True if the sender is the user.'),
});

const SamuraiAIChatInputSchema = z.object({
  message: z.string().describe('The current user message to the Samurai AI.'),
  history: z.array(MessageHistoryItemSchema).optional().describe('Recent conversation history to provide context. Ordered from oldest to newest.'),
});
export type SamuraiAIChatInput = z.infer<typeof SamuraiAIChatInputSchema>;

const InternalPromptInputSchema = z.object({
  message: z.string(),
  history: z.array(ProcessedMessageHistoryItemSchema).optional(),
});

const SamuraiAIChatOutputSchema = z.object({
  response: z.string().describe('The Samurai AI text response.'),
  imageUrl: z.string().optional().describe('URL of a generated image, if any.'),
  imagePrompt: z.string().optional().describe('The prompt used for generating the image, if any.'),
});
export type SamuraiAIChatOutput = z.infer<typeof SamuraiAIChatOutputSchema>;

// Define the tool for image generation
const requestImageGenerationTool = ai.defineTool(
  {
    name: 'requestSamuraiImage',
    description: 'Requests the generation of a samurai-themed or contextually relevant image based on a given prompt. Use this if the user asks for an image or if an image would visually enhance the conversation (e.g., describing a scene, object, or concept).',
    inputSchema: z.object({
      imagePrompt: z.string().describe('A detailed textual prompt for the image to be generated. Describe the scene, characters, style (e.g., ink wash, ukiyo-e, modern anime).'),
    }),
    outputSchema: z.object({
      status: z.string().describe('Status of the image request, e.g., "Image generation initiated." or "Image generation failed."'),
      imageUrl: z.string().optional().describe('The data URI of the generated image, if successful.'),
    }),
  },
  async (input: { imagePrompt: string }) => {
    try {
      const imageOutput = await generateSamuraiImage({ prompt: input.imagePrompt });
      return { status: 'Image generation successful.', imageUrl: imageOutput.imageDataUri };
    } catch (e) {
      console.error('Tool: Image generation failed', e);
      return { status: `Image generation failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
);


export async function samuraiAIChat(input: SamuraiAIChatInput): Promise<SamuraiAIChatOutput> {
  return samuraiAIChatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'samuraiAIChatPrompt',
  input: {schema: InternalPromptInputSchema},
  output: {schema: SamuraiAIChatOutputSchema}, // The prompt itself won't directly output imageUrl, flow handles it.
  tools: [requestImageGenerationTool],
  prompt: `You are Aizen, a wise and articulate samurai. Respond to the user's message with contextually appropriate and emotionally nuanced responses, embodying the persona of a venerable samurai. 
Your responses should be formatted in Markdown for clarity and emphasis where appropriate (e.g., use bold, italics, or lists if it enhances readability).

Consider the recent conversation history for context:
{{#if history}}
{{#each history}}
{{#if isUserMessage}}User{{else}}Aizen{{/if}}: {{{text}}}
{{/each}}
{{/if}}

Current user message: {{{message}}}

If the user's message or the natural flow of conversation suggests a visual element could be beneficial (e.g., user asks "Show me...", or you are describing a specific scene, artifact, or abstract concept like "honor"), use the 'requestSamuraiImage' tool to generate an image. Provide a concise and evocative prompt for the image. After requesting the image, you can mention that you are conjuring a vision, and then continue with your textual response. The image will appear alongside your text.

Aizen's response (in Markdown):`,
});

const samuraiAIChatFlow = ai.defineFlow(
  {
    name: 'samuraiAIChatFlow',
    inputSchema: SamuraiAIChatInputSchema,
    outputSchema: SamuraiAIChatOutputSchema,
  },
  async (input) => {
    const processedInput = {
      ...input,
      history: input.history?.map(item => ({
        ...item,
        isUserMessage: item.sender === 'user',
      })),
    };
    
    const {response} = await chatPrompt(processedInput); // Use `response` from `ai.generateStream` or `ai.generate`
    const llmResponse = response; // Assuming `response` is the direct output from the LLM call

    let generatedImageUrl: string | undefined = undefined;
    let usedImagePrompt: string | undefined = undefined;

    if (llmResponse?.toolRequests && llmResponse.toolRequests.length > 0) {
      for (const toolRequest of llmResponse.toolRequests) {
        if (toolRequest.tool === 'requestSamuraiImage') {
          const toolInput = toolRequest.input as { imagePrompt: string };
          usedImagePrompt = toolInput.imagePrompt;
          try {
            // Call the image generation flow/tool directly
            const imageResult = await generateSamuraiImage({ prompt: toolInput.imagePrompt });
            generatedImageUrl = imageResult.imageDataUri;
            // You might want to inform the LLM about the success or append to its response.
            // For now, we just pass the URL back.
          } catch (e) {
            console.error("Error during image generation tool call in flow:", e);
            // Optionally, inform the LLM or append an error message.
          }
        }
      }
    }
    
    const textResponse = llmResponse?.text ?? "Aizen remains silent, lost in thought.";

    return {
      response: textResponse,
      imageUrl: generatedImageUrl,
      imagePrompt: usedImagePrompt,
    };
  }
);
