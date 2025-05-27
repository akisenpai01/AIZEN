
'use server';

/**
 * @fileOverview Implements the Samurai AI Chat flow, now with image generation, haiku generation, weather oracle, and enhanced conversational abilities.
 *
 * - samuraiAIChat - A function that handles the chat with the Samurai AI.
 * - SamuraiAIChatInput - The input type for the samuraiAIChat function.
 * - SamuraiAIChatOutput - The return type for the samuraiAIChat function.
 */

import {ai} from '@/ai/genkit';
import {generateSamuraiImage} from './generate-samurai-image';
import {generateHaiku} from './haiku-flow';
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
  currentDate: z.string().describe("The current date, e.g., 'Tuesday, May 28th, 2024'"),
});

const SamuraiAIChatOutputSchema = z.object({
  response: z.string().describe('The Samurai AI text response.'),
  imageUrl: z.string().nullable().optional().describe('URL of a generated image, if any, or null.'),
  imagePrompt: z.string().nullable().optional().describe('The prompt used for generating the image, if any, or null.'),
});
export type SamuraiAIChatOutput = z.infer<typeof SamuraiAIChatOutputSchema>;

// Tool for image generation
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

// Tool for Haiku generation
const requestHaikuTool = ai.defineTool(
  {
    name: 'requestHaiku',
    description: 'Generates a haiku based on a given theme. Use this if the user asks for a haiku or expresses a desire for poetic insight on a topic.',
    inputSchema: z.object({
      theme: z.string().describe('The theme or subject for the haiku.'),
    }),
    outputSchema: z.object({
      haiku: z.string().describe('The generated haiku.'),
    }),
  },
  async (input: { theme: string }) => {
    try {
      const haikuOutput = await generateHaiku({ theme: input.theme });
      return { haiku: haikuOutput.haiku };
    } catch (e) {
      console.error('Tool: Haiku generation failed', e);
      return { haiku: `Aizen's muse is fleeting; the haiku for "${input.theme}" remains elusive.` };
    }
  }
);

// Tool for Thematic Weather (Mocked)
const getThematicWeatherTool = ai.defineTool(
  {
    name: 'getThematicWeather',
    description: "Provides a samurai-themed, poetic interpretation of the current weather. Use this if the user asks about the weather or conditions.",
    inputSchema: z.object({
        location: z.string().optional().describe("The location for the weather forecast. If not provided, assumes the user's general area."),
    }),
    outputSchema: z.object({
      poeticInterpretation: z.string().describe('A poetic, samurai-themed description of the weather.'),
    }),
  },
  async (input: { location?: string }) => {
    // MOCK IMPLEMENTATION
    const mockInterpretations = [
      "The sun marches boldly across the sky, a general leading its luminous troops. A day for clear purpose and decisive action.",
      "Clouds gather like ronin on the horizon, their intentions veiled. Proceed with awareness, warrior.",
      "A gentle rain descends, washing the world anew. A time for reflection, for sharpening the mind as water sharpens stone.",
      "The wind whispers secrets through the pines, a restless spirit stirring. Listen closely to its counsel.",
      "Snow blankets the land in silent honor. Stillness reigns, inviting deep contemplation and resilience against the cold.",
      "Mist clings to the valleys, obscuring the path. Trust your inner compass, for clarity lies beyond the veil."
    ];
    const interpretation = mockInterpretations[Math.floor(Math.random() * mockInterpretations.length)];
    return { poeticInterpretation: interpretation };
  }
);


export async function samuraiAIChat(input: SamuraiAIChatInput): Promise<SamuraiAIChatOutput> {
  const currentDate = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const processedInput: InternalPromptInputSchema = {
    message: input.message,
    history: input.history?.map(item => ({
      ...item,
      isUserMessage: item.sender === 'user',
    })),
    currentDate,
  };
  return samuraiAIChatFlow(processedInput);
}


const chatSystemInstructionTemplate = `You are Aizen, a wise and articulate samurai embodying the principles of Bushido. Today is {{{currentDate}}}.
You respond to the user with contextually appropriate and emotionally nuanced responses. Your responses should be formatted in Markdown for clarity.
Be concise in your responses.

**Conversational Abilities & Tool Usage:**

1.  **Image Generation:** If the user's message or the natural flow of conversation suggests a visual element (e.g., "Show me...", or you are describing a scene, artifact, or abstract concept like "honor"), use the 'requestSamuraiImage' tool. Provide a concise, evocative prompt for the image. After deciding to use the tool, you should mention that you are conjuring a vision or that an image will be provided as part of your textual response.
2.  **Haiku Generation:** If the user asks for a haiku or expresses a desire for poetic insight on a topic (e.g., "Aizen, can you write a haiku about tranquility?"), use the 'requestHaiku' tool with the identified theme. Present the haiku clearly within your textual response, usually after your main thoughts.
3.  **Thematic Weather:** If the user asks about the weather (e.g., "What's it like outside, Aizen?", "Tell me of the skies today."), use the 'getThematicWeather' tool. Relay its poetic interpretation in your textual response.
4.  **Daily Goal Setting & Reflection:**
    *   **Setting Goal:** If the user states a daily goal or intention (e.g., "My goal for today is to finish my scroll," "I intend to practice my swordsmanship"), acknowledge their commitment and offer a brief, encouraging samurai perspective (e.g., "A noble pursuit. May your focus be true.").
    *   **Reflection:** If the user reflects on their day or goal progress (e.g., "I accomplished my goal," "I struggled today"), listen and offer thoughtful reflections based on samurai principles like perseverance, learning from setbacks, or the value of effort.
5.  **"Path Clarification" (Decision Support):** When the user discusses a decision or dilemma, avoid giving direct advice. Instead, guide them to clarify their own thoughts by asking probing questions or offering timeless principles (e.g., "Which path aligns with your code of honor?", "What does inner stillness counsel in this moment?", "Consider the long shadow of your choice, warrior.").
`;

const chatUserMessageTemplate = `{{#if history}}
**Recent Conversation History:**
{{#each history}}
{{#if isUserMessage}}User: {{{text}}}{{else}}Aizen: {{{text}}}{{/if}}
{{/each}}
{{else}}
No recent conversation history.
{{/if}}

**Current User Message:**
User: {{{message}}}

**Aizen's concise response (in Markdown):**`;


const chatPrompt = ai.definePrompt({
  name: 'samuraiAIChatPrompt',
  input: {schema: InternalPromptInputSchema},
  output: {schema: SamuraiAIChatOutputSchema}, 
  tools: [requestImageGenerationTool, requestHaikuTool, getThematicWeatherTool],
  messages: [ // Using the messages array for clearer structure
    {role: 'system', content: chatSystemInstructionTemplate },
    {role: 'user', content: chatUserMessageTemplate }
  ],
});

const samuraiAIChatFlow = ai.defineFlow(
  {
    name: 'samuraiAIChatFlow',
    inputSchema: InternalPromptInputSchema, 
    outputSchema: SamuraiAIChatOutputSchema, 
  },
  async (input) => {
    const genkitResponse = await ai.generate({prompt: chatPrompt, input: input}); 

    const structuredOutput = genkitResponse.output(); 
    const toolReqs = genkitResponse.toolRequests;    

    let textResponseFromLLM = structuredOutput?.response ?? ""; 

    let finalToolGeneratedImageUrl: string | null = null;
    let finalToolGeneratedImagePrompt: string | null = null;

    if (toolReqs && toolReqs.length > 0) {
      for (const toolRequest of toolReqs) {
        const toolResponse = await toolRequest.run(); // Genkit handles calling the tool function

        if (toolRequest.tool === 'requestSamuraiImage') {
          finalToolGeneratedImagePrompt = (toolRequest.input as { imagePrompt: string }).imagePrompt;
          const toolOutput = toolResponse as { status: string; imageUrl?: string };
          if (toolOutput.imageUrl) {
            finalToolGeneratedImageUrl = toolOutput.imageUrl;
          } else {
             console.error("Image generation tool ran but produced no URL:", toolOutput.status);
            if (!textResponseFromLLM.includes("vision is clouded")) { // Avoid duplicate error messages
                textResponseFromLLM += `\n\n(Aizen's vision for an image of "${finalToolGeneratedImagePrompt}" is momentarily clouded: ${toolOutput.status})`;
            }
          }
        } else if (toolRequest.tool === 'requestHaiku') {
            const toolOutput = toolResponse as { haiku: string };
            if (textResponseFromLLM && !textResponseFromLLM.includes(toolOutput.haiku)) {
                textResponseFromLLM += `\n\n${toolOutput.haiku}`;
            } else if (!textResponseFromLLM) { // If LLM gave no initial text, use haiku as response
                textResponseFromLLM = toolOutput.haiku;
            }
        } else if (toolRequest.tool === 'getThematicWeather') {
            const toolOutput = toolResponse as { poeticInterpretation: string };
             if (textResponseFromLLM && !textResponseFromLLM.includes(toolOutput.poeticInterpretation)) {
                textResponseFromLLM += `\n\nRegarding the skies:\n${toolOutput.poeticInterpretation}`;
            } else if (!textResponseFromLLM) { // If LLM gave no initial text, use weather as response
                textResponseFromLLM = `Regarding the skies:\n${toolOutput.poeticInterpretation}`;
            }
        }
      }
    }
    
    const finalTextContent = textResponseFromLLM.trim();
    let responseTextToShow: string;

    if (finalTextContent) {
      responseTextToShow = finalTextContent;
    } else if (finalToolGeneratedImageUrl) {
      // If only an image is generated, provide a default text response.
      responseTextToShow = `A vision appears... (regarding: ${finalToolGeneratedImagePrompt || 'your request'})`;
    } else {
      // Fallback if no text and no image.
      responseTextToShow = "Aizen remains silent, lost in thought.";
    }
    
    return {
      response: responseTextToShow,
      imageUrl: finalToolGeneratedImageUrl, 
      imagePrompt: finalToolGeneratedImagePrompt, 
    };
  }
);
