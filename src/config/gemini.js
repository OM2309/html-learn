import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY environment variable is not set.');
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export default ai;
