import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint for AI Assistant using Gemini API
  app.post("/api/assistant", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(200).json({
          reply: `I am currently operating in offline mode. Here is information based on your student record:\n\nRegarding: "${prompt}"\n\nYour attendance is 87.5% (above 75% target), CGPA is 8.6/10, and all current Semester 4 fees are cleared. Feel free to check the specific tabs for details!`,
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = `You are ScholarCore AI Assistant, an intelligent academic advisor and campus helper for Arjun Kumar (Roll No: 22CS045, B.Tech Computer Science, Semester 4).
You have access to Arjun's live student record:
- Attendance: 87.5% (Target: 75%). Subjects: DAA (89%), OS (85%), DBMS (88%).
- Academic Standing: CGPA 8.6 / 10 (Top 5% of class).
- Fee Dues: Total Dues ₹15,000 (Tuition Part 2 due in 12 days). Paid so far: ₹1,25,000. Scholarship: ₹20,000 Merit Waiver.
- Recent Notices: Mid-Semester Exam Schedule Published (2h ago), Tech Symposium '24 Registrations Open.
- Upcoming Events: Campus Placement Drive (Oct 12), Hackathon Kickoff (Oct 15 - RSVP'd).
- Pending Assignments: Assignment 2 (Graph Algorithms - DAA) due in 2 days, SQL Query Optimization (DBMS) due in 5 days.
- Lost & Found: 20 total items reported on campus, 14 recovered. Arjun posted a found Casio Calculator fx-991EX (1 inquiry).

Provide clear, encouraging, precise, and concise answers tailored to the student's context. Use Markdown formatting when appropriate.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ reply: response.text || "No response received from ScholarCore Assistant." });
    } catch (error: any) {
      console.error("Error in AI assistant endpoint:", error);
      res.status(500).json({
        error: "Failed to process AI assistant request.",
        details: error?.message || String(error),
      });
    }
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "ScholarCore" });
  });

  // Vite middleware for dev or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ScholarCore server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
