import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

admin.initializeApp();

// 2nd Generation Cloud Function: Robust Model Fallback for 2026 Resilience
export const extractTimetable = onCall({
  secrets: ["GEMINI_API_KEY"],
  timeoutSeconds: 60,
  maxInstances: 10,
  cors: true
}, async (request: CallableRequest<any>) => {
  // 1. Ensure user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'You must be signed in to extract a timetable.'
    );
  }

  const pdfText = request.data.pdfText;
  if (!pdfText || typeof pdfText !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'You must provide valid text extracted from the PDF.'
    );
  }

  try {
    // 2. Initialize Gemini API securely from Secrets
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY secret is missing in Google Cloud Secret Manager.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    // 3. Construct a bullet-proof system prompt
    const prompt = `
      You are an expert AI parser. You will receive raw, messy text extracted from a university Class Timetable PDF.
      Your ONE AND ONLY task is to parse the text and output a perfectly formatted JSON array. 
      DO NOT include markdown block markers like \`\`\`json. Output ONLY the raw JSON array.
      
      Extract every single distinct class course you can find.
      For every class course, try your best to determine:
      - name: The full name of the course (e.g., "Data Structures").
      - code: The course code (e.g., "CS201"). If unknown, guess an abbreviation.
      - scheduleDays: An Array of exactly the days the class meets (using strictly from: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"). If unknown, use ["Mon"].
      - time: The start time formatted like "09:00 AM". If unknown, use "10:00 AM".
      - room: The room location (e.g., "LT-04"). If unknown, use "TBA".
      - creditHours: An integer (e.g., 3). If unknown, use 3.

      Return ONLY a JSON Array of objects following this TypeScript interface:
      type Course = {
         name: string;
         code: string;
         scheduleDays: string[];
         time: string;
         room: string;
         creditHours: number;
      }

      Here is the raw text to parse:
      ------
      ${pdfText}
      ------
    `;

    // 4. Robust Auto-Select Loop (Bypasses 404 Retired and 429 Quota issues)
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-3.0-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-latest',
      'gemini-1.5-flash-latest'
    ];

    let lastOutcomeText = "";
    let finalModelUsed = "";
    let success = false;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting extraction with model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
        const result = await model.generateContent(prompt);
        lastOutcomeText = result.response.text();
        finalModelUsed = modelName;
        success = true;
        break; // Stop loop on first success!
      } catch (error: any) {
        console.warn(`Model ${modelName} failed: ${error.message}`);
        // If it's a 429 or 404, we loop. If it's something else, we might still loop.
        continue;
      }
    }

    if (!success) {
      throw new Error("Exhausted all available Gemini models. Your account may have no quota or the API Key is invalid.");
    }

    console.log(`SUCCESS! Extraction completed with ${finalModelUsed}`);
    
    // Clean potential markdown blocks
    const cleanJSON = lastOutcomeText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const extractedCourses = JSON.parse(cleanJSON);

    return { courses: extractedCourses, model: finalModelUsed };

  } catch (error: any) {
    console.error('Final Extraction Failure:', error);
    throw new HttpsError(
      'internal',
      `Failed to parse timetable with AI. Details: ${error.message}`
    );
  }
});
