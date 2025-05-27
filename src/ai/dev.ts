import { config } from 'dotenv';
config();

import '@/ai/flows/samurai-ai-chat.ts';
import '@/ai/flows/get-daily-wisdom.ts';
import '@/ai/flows/generate-samurai-image.ts'; // Added new image generation flow

