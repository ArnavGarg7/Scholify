"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTimetable = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const generative_ai_1 = require("@google/generative-ai");
admin.initializeApp();
// 2nd Generation Cloud Function: Robust Model Fallback + Course Deduplication
exports.extractTimetable = (0, https_1.onCall)({
    secrets: ["GEMINI_API_KEY"],
    timeoutSeconds: 120,
    maxInstances: 10,
    cors: true
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'You must be signed in to extract a timetable.');
    }
    const pdfText = request.data.pdfText;
    if (!pdfText || typeof pdfText !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'You must provide valid text extracted from the PDF.');
    }
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY secret is missing in Google Cloud Secret Manager.');
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
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
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-pro'
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
            }
            catch (error) {
                console.warn(`Model ${modelName} failed: ${error.message}`);
                continue;
            }
        }
        if (!success) {
            throw new Error("Exhausted all available Gemini models. Your account may have no quota or the API Key is invalid.");
        }
        console.log(`SUCCESS! Extraction completed with ${finalModelUsed}. Raw length: ${lastOutcomeText.length}`);
        const cleanJSON = lastOutcomeText.replace(/```json/gi, '').replace(/```/g, '').trim();
        let extractedCourses;
        try {
            extractedCourses = JSON.parse(cleanJSON);
        }
        catch (e) {
            console.error("JSON Parse Error. Raw Text:", lastOutcomeText);
            throw new Error("AI returned malformed JSON. Please try again.");
        }
        if (!Array.isArray(extractedCourses)) {
            extractedCourses = extractedCourses.courses || []; // Handle { courses: [...] } wrapper if AI adds it
        }
        // SERVER-SIDE DEDUPLICATION FALLBACK
        const courseMap = new Map();
        for (const course of extractedCourses) {
            try {
                const key = (course.name || '').trim().toLowerCase();
                if (!key)
                    continue;
                if (courseMap.has(key)) {
                    const existing = courseMap.get(key);
                    // Merge scheduleDays
                    const allDays = new Set([...(existing.scheduleDays || []), ...(course.scheduleDays || [])]);
                    existing.scheduleDays = Array.from(allDays);
                    // Merge timeSlots
                    const existingSlots = existing.timeSlots || [{
                            time: existing.time || '09:00 AM',
                            room: existing.room || 'TBA',
                            day: (existing.scheduleDays && existing.scheduleDays[0]) || 'Mon'
                        }];
                    const newSlots = course.timeSlots || [{
                            time: course.time || '09:00 AM',
                            room: course.room || 'TBA',
                            day: (course.scheduleDays && course.scheduleDays[0]) || 'Mon'
                        }];
                    existing.timeSlots = [...existingSlots, ...newSlots];
                    // Deduplicate timeSlots
                    const slotKeys = new Set();
                    existing.timeSlots = existing.timeSlots.filter((s) => {
                        const k = `${s.time}-${s.day}-${s.room}`;
                        if (slotKeys.has(k))
                            return false;
                        slotKeys.add(k);
                        return true;
                    });
                }
                else {
                    if (!course.timeSlots || course.timeSlots.length === 0) {
                        course.timeSlots = [{
                                time: course.time || '09:00 AM',
                                room: course.room || 'TBA',
                                day: (course.scheduleDays && course.scheduleDays[0]) || 'Mon'
                            }];
                    }
                    courseMap.set(key, course);
                }
            }
            catch (err) {
                console.warn("Skipping malformed course entry:", course, err);
            }
        }
        extractedCourses = Array.from(courseMap.values());
        return { courses: extractedCourses, model: finalModelUsed };
    }
    catch (error) {
        console.error('Final Extraction Failure:', error);
        throw new https_1.HttpsError('internal', `Failed to parse timetable with AI. Details: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map