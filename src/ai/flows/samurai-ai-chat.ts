
'use server';

/**
 * @fileOverview Implements the Samurai AI Chat flow, now with image generation, haiku generation, weather oracle, internet search, and enhanced conversational abilities.
 *
 * - samuraiAIChat - A function that handles the chat with the Samurai AI.
 * - SamuraiAIChatInput - The input type for the samuraiAIChat function.
 * - SamuraiAIChatOutput - The return type for the samuraiAIChat function.
 */

import {ai} from '@/ai/genkit';
import {generateSamuraiImage} from './generate-samurai-image';
import {generateHaiku} from './haiku-flow';
import {z} from 'genkit';
import type {MessageData, Part} from 'genkit/ai';
import Handlebars from 'handlebars';

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
export type InternalPromptInput = z.infer<typeof InternalPromptInputSchema>;


const SamuraiAIChatOutputSchema = z.object({
  response: z.string().optional().describe('The Samurai AI text response. Can be empty if AI primarily uses a tool.'),
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

// Tool for Internet Search (Mocked)
const searchInternetTool = ai.defineTool(
  {
    name: 'searchInternetTool',
    description: "Searches the internet for information on a given query. Use this when the user asks for very current information, specific facts not typically in general knowledge, or information from the wider web that you wouldn't inherently know.",
    inputSchema: z.object({
        query: z.string().describe("The search query to find information on the internet."),
    }),
    outputSchema: z.object({
      summary: z.string().describe('A summary of the information found.'),
    }),
  },
  async (input: { query: string }) => {
    // MOCK IMPLEMENTATION
    return { summary: `(Aizen consults the digital scrolls regarding "${input.query}". The information he sought would be presented here, woven into his wisdom.)` };
  }
);


export async function samuraiAIChat(input: SamuraiAIChatInput): Promise<SamuraiAIChatOutput> {
  const currentDate = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const processedInput: InternalPromptInput = {
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
Be concise in your responses. Always provide a direct textual answer to the user, even if it's brief and accompanies a tool's action or output.

**Refer to the "Recent Conversation History" provided with the user's message to maintain context. Actively seek connections between the current user message and previous points in the dialogue. If the user's current query is a follow-up or relates to topics discussed earlier in the history, acknowledge this and use the prior context to inform your response, ensuring your answers flow naturally and show an understanding of the conversation's progression.**

**Conversational Abilities & Tool Usage:**

1.  **Image Generation:** If the user's message or the natural flow of conversation suggests a visual element (e.g., "Show me...", or you are describing a scene, artifact, or abstract concept like "honor"), use the 'requestSamuraiImage' tool. Provide a concise, evocative prompt for the image. After deciding to use the tool, you should mention that you are conjuring a vision or that an image will be provided as part of your textual response.
2.  **Haiku Generation:** If the user asks for a haiku or expresses a desire for poetic insight on a topic (e.g., "Aizen, can you write a haiku about tranquility?"), use the 'requestHaiku' tool with the identified theme. Present the haiku clearly in your textual response, usually after your main thoughts.
3.  **Thematic Weather:** If the user asks about the weather (e.g., "What's it like outside, Aizen?", "Tell me of the skies today."), use the 'getThematicWeather' tool. Relay its poetic interpretation in your textual response.
4.  **Internet Search:** If the user asks for very current information (e.g., events after your knowledge cutoff), specific facts outside common knowledge, or data from the wider web that you wouldn't inherently know, use the 'searchInternetTool'. Formulate a concise search query. Incorporate the findings into your response naturally, stating that you have consulted the digital scrolls or sought wider knowledge.
5.  **Daily Goal Setting & Reflection:**
    *   **Setting Goal:** If the user states a daily goal or intention (e.g., "My goal for today is to finish my scroll," "I intend to practice my swordsmanship"), acknowledge their commitment and offer a brief, encouraging samurai perspective (e.g., "A noble pursuit. May your focus be true.").
    *   **Reflection:** If the user reflects on their day or goal progress (e.g., "I accomplished my goal," "I struggled today"), listen and offer thoughtful reflections on samurai principles like perseverance, learning from setbacks, or the value of effort.
6.  **"Path Clarification" (Decision Support):** When the user discusses a decision or dilemma, avoid giving direct advice. Instead, guide them to clarify their own thoughts by asking probing questions or offering timeless principles (e.g., "Which path aligns with your code of honor?", "What does inner stillness counsel in this moment?", "Consider the long shadow of your choice, warrior.").
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

const systemRender = Handlebars.compile(chatSystemInstructionTemplate, { noEscape: true });
const userRender = Handlebars.compile(chatUserMessageTemplate, { noEscape: true });

// Tools available to Aizen
const availableTools = [requestImageGenerationTool, requestHaikuTool, getThematicWeatherTool, searchInternetTool];

const chatPrompt = ai.definePrompt(
  {
    name: 'samuraiAIChatPrompt',
    input: {schema: InternalPromptInputSchema},
    output: {schema: SamuraiAIChatOutputSchema}, // Ensure this is defined for structured output
    tools: availableTools,
    config: { 
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
    }
  },
  (input: InternalPromptInput): MessageData[] => {
    const systemMessageText = systemRender(input);
    const userMessageText = userRender(input);

    // Ensure text content is always a string, even if empty, to prevent null in content array.
    const finalSystemText = (typeof systemMessageText === 'string') ? systemMessageText : '';
    const finalUserText = (typeof userMessageText === 'string') ? userMessageText : '';

    return [
      {role: 'system', content: [{text: finalSystemText} as Part]},
      {role: 'user', content: [{text: finalUserText} as Part]},
    ];
  }
);

const samuraiAIChatFlow = ai.defineFlow(
  {
    name: 'samuraiAIChatFlow',
    inputSchema: InternalPromptInputSchema,
    outputSchema: SamuraiAIChatOutputSchema,
  },
  async (input) => {
    // Manually prepare messages using the Handlebars templates
    const systemMessageText = systemRender(input);
    const userMessageText = userRender(input);

    const messagesToGenerate: MessageData[] = [
        {role: 'system', content: [{text: (systemMessageText ?? '')} as Part]},
        {role: 'user', content: [{text: (userMessageText ?? '')} as Part]},
    ];

    // Call ai.generate with explicitly passed messages, tools, output schema, and config
    const genkitResponse = await ai.generate({
        messages: messagesToGenerate,
        tools: availableTools, // Pass the defined tools
        output: { schema: SamuraiAIChatOutputSchema }, // Pass the Zod schema for structured output
        config: { 
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
        },
    });

    const llmOutput = genkitResponse.output; // This should be SamuraiAIChatOutput | undefined
    const toolRequests = genkitResponse.toolRequests;

    const textFragments: string[] = [];
    if (llmOutput?.response) { // llmOutput.response is Aizen's main textual reply
        textFragments.push(llmOutput.response);
    }

    let finalImageUrl: string | null = null;
    let finalImagePrompt: string | null = null;

    if (toolRequests && toolRequests.length > 0) {
        for (const toolRequest of toolRequests) {
            const toolResponseData = await toolRequest.run(); // Run the tool to get its output

            if (toolRequest.tool === 'requestSamuraiImage') {
                finalImagePrompt = (toolRequest.input as { imagePrompt: string }).imagePrompt;
                const imageToolOutput = toolResponseData as z.infer<typeof requestImageGenerationTool.outputSchema>;
                if (imageToolOutput.imageUrl) {
                    finalImageUrl = imageToolOutput.imageUrl;
                     // Avoid duplicating if Aizen already mentioned it
                     // if (!llmOutput?.response?.includes(finalImagePrompt ?? '')) { 
                       // textFragments.push(`(A vision of "${finalImagePrompt}" appears below.)`);
                    // }
                } else {
                    textFragments.push(`(Aizen's vision for an image of "${finalImagePrompt}" is momentarily clouded: ${imageToolOutput.status})`);
                }
            } else if (toolRequest.tool === 'requestHaiku') {
                const haikuToolOutput = toolResponseData as z.infer<typeof requestHaikuTool.outputSchema>;
                // Avoid duplicating if Aizen already wove it into his main response
                if (haikuToolOutput.haiku && !(llmOutput?.response?.includes(haikuToolOutput.haiku))) {
                    textFragments.push(haikuToolOutput.haiku);
                }
            } else if (toolRequest.tool === 'getThematicWeather') {
                const weatherToolOutput = toolResponseData as z.infer<typeof getThematicWeatherTool.outputSchema>;
                 // Avoid duplicating
                if (weatherToolOutput.poeticInterpretation && !(llmOutput?.response?.includes(weatherToolOutput.poeticInterpretation))) {
                    textFragments.push(`Regarding the skies:\n${weatherToolOutput.poeticInterpretation}`);
                }
            } else if (toolRequest.tool === 'searchInternetTool') {
                const searchToolOutput = toolResponseData as z.infer<typeof searchInternetTool.outputSchema>;
                // Avoid duplicating
                 if (searchToolOutput.summary && !(llmOutput?.response?.includes(searchToolOutput.summary))) {
                    textFragments.push(searchToolOutput.summary);
                }
            }
        }
    }

    // Construct the final response text
    let responseTextToShow = textFragments.join("\n\n").trim();

    // Fallback if no text was generated at all by AI or tools, but an image was.
    if (!responseTextToShow && finalImageUrl) {
        responseTextToShow = `A vision appears... (regarding: ${finalImagePrompt || 'your inquiry'})`;
    } else if (!responseTextToShow && !finalImageUrl) {
        // Ultimate fallback if nothing was generated
        responseTextToShow = "Aizen remains silent, lost in thought. Perhaps a different path of inquiry, or try rephrasing?";
    }

    return {
      response: responseTextToShow,
      imageUrl: finalImageUrl,
      imagePrompt: finalImagePrompt,
    };
  }
);

