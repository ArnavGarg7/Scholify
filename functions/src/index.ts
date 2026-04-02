import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

admin.initializeApp();

// 2nd Generation Cloud Function: Robust Model Fallback + Course Deduplication
export const extractTimetable = onCall({
  secrets: ["GEMINI_API_KEY"],
  timeoutSeconds: 60,
  maxInstances: 10,
  cors: true
}, async (request: CallableRequest<any>) => {
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY secret is missing in Google Cloud Secret Manager.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    // Enhanced prompt with DEDUPLICATION instructions
    const prompt = `
      You are an expert AI parser for university timetables. You will receive raw text extracted from a Class Timetable PDF.
      
      CRITICAL RULES:
      1. Output ONLY a raw JSON array. NO markdown, NO \`\`\`json fences.
      2. DEDUPLICATE courses: If the SAME course name appears at DIFFERENT times, days, or rooms, 
         combine them into ONE course object. Merge all their days into scheduleDays, and list 
         all their distinct time+room+day combinations in the "timeSlots" array.
      3. CRITICAL: If a course meets at DIFFERENT times on DIFFERENT days (e.g., Mon 9 AM but Tue 2 PM),
         or multiple times on the SAME day, you MUST explicitly capture each unique pair as a separate object inside "timeSlots"!
      4. Course identity is determined by NAME (case-insensitive). "Applied Learning" at 8 AM and 
         "Applied Learning" at 10 AM is the SAME course with two time slots.
      
      For each UNIQUE course, extract:
      - name: Full course name (e.g., "Data Structures")
      - code: Course code (e.g., "CS201"). If unknown, create an abbreviation.
      - scheduleDays: Combined array of ALL days this course meets (from: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
      - time: The EARLIEST start time formatted like "09:00 AM" or "02:00 PM"
      - room: The primary room location. If multiple, pick the most common one.
      - creditHours: Integer (default 3 if unknown)
      - timeSlots: Array of ALL distinct time/room/day combinations:
        [{ "time": "09:00 AM", "room": "LT-04", "day": "Mon" }, { "time": "02:00 PM", "room": "LT-04", "day": "Tue" }]

      TypeScript interface:
      type TimeSlot = { time: string; room: string; day: string; }
      type Course = {
         name: string;
         code: string;
         scheduleDays: string[];
         time: string;
         room: string;
         creditHours: number;
         timeSlots: TimeSlot[];
      }

      Raw text:
      ------
      ${pdfText}
      ------
    `;

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
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        lastOutcomeText = result.response.text();
        finalModelUsed = modelName;
        success = true;
        break;
      } catch (error: any) {
        console.warn(`Model ${modelName} failed: ${error.message}`);
        continue;
      }
    }

    if (!success) {
      throw new Error("Exhausted all available Gemini models. Your account may have no quota or the API Key is invalid.");
    }

    console.log(`SUCCESS! Extraction completed with ${finalModelUsed}`);
    
    const cleanJSON = lastOutcomeText.replace(/```json/gi, '').replace(/```/g, '').trim();
    let extractedCourses = JSON.parse(cleanJSON);

    // SERVER-SIDE DEDUPLICATION FALLBACK
    // Even if the AI doesn't merge perfectly, we do it here
    const courseMap = new Map<string, any>();
    for (const course of extractedCourses) {
      const key = (course.name || '').trim().toLowerCase();
      if (courseMap.has(key)) {
        const existing = courseMap.get(key);
        // Merge scheduleDays
        const allDays = new Set([...existing.scheduleDays, ...course.scheduleDays]);
        existing.scheduleDays = Array.from(allDays);
        // Merge timeSlots
        const existingSlots = existing.timeSlots || [{ time: existing.time, room: existing.room, day: existing.scheduleDays[0] }];
        const newSlots = course.timeSlots || [{ time: course.time, room: course.room, day: course.scheduleDays[0] }];
        existing.timeSlots = [...existingSlots, ...newSlots];
        // Deduplicate timeSlots
        const slotKeys = new Set<string>();
        existing.timeSlots = existing.timeSlots.filter((s: any) => {
          const k = `${s.time}-${s.day}-${s.room}`;
          if (slotKeys.has(k)) return false;
          slotKeys.add(k);
          return true;
        });
      } else {
        if (!course.timeSlots || course.timeSlots.length === 0) {
          course.timeSlots = [{ time: course.time, room: course.room, day: course.scheduleDays[0] || 'Mon' }];
        }
        courseMap.set(key, course);
      }
    }
    extractedCourses = Array.from(courseMap.values());

    return { courses: extractedCourses, model: finalModelUsed };

  } catch (error: any) {
    console.error('Final Extraction Failure:', error);
    throw new HttpsError(
      'internal',
      `Failed to parse timetable with AI. Details: ${error.message}`
    );
  }
});
