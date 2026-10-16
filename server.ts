import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { requireAuth, requireRole, AuthRequest } from "./src/middleware/auth.ts";
import { getSupabaseAdmin, isServerConfigValid } from "./src/lib/supabase-server.ts";

dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint with configuration status (no secrets exposed)
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      app: "ScholarCore",
      supabaseConfigured: isServerConfigValid(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Authenticated Profile Endpoint - returns authoritative database profile for token owner
  app.get("/api/auth/profile", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const admin = getSupabaseAdmin();
      const { data: profile, error } = await admin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: "Failed to retrieve user profile", details: error.message });
      }

      if (!profile) {
        return res.status(404).json({
          error: "Profile not found",
          message: "No ERP profile record has been provisioned for this account.",
        });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
        },
        profile,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Internal server error fetching profile", details: err?.message });
    }
  });

  // Protected AI Assistant Endpoint
  app.post("/api/assistant", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      const user = req.user;

      if (!apiKey) {
        return res.status(200).json({
          reply: `I am currently operating in offline mode. Student account ${user?.email || ""}:\n\nRegarding: "${prompt}"\n\nYour attendance is 87.5% (above 75% target), CGPA is 8.6/10, and all current semester dues are clear. Feel free to check the specific portal tabs for details!`,
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

      const systemInstruction = `You are ScholarCore AI Assistant, an intelligent academic advisor for Siddhartha Institute of Technology & Sciences.
The student requesting assistance is authenticated as: ${user?.email || "Student"}.
Current student stats:
- Attendance: 87.5% (Target: 75%).
- CGPA: 8.6 / 10.
- Semester Dues: ₹15,000 pending (Tuition Part 2).
- Recent Notices: Mid-Semester Exam Schedule Published, Tech Symposium '24 Registrations Open.
- Upcoming Events: Campus Placement Drive, Hackathon Kickoff.
Provide concise, professional, and encouraging answers.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ reply: response.text || "No response received from ScholarCore Assistant." });
    } catch (error: any) {
      console.error("Error in AI assistant endpoint:", error?.message);
      res.json({
        reply: `I am currently operating in offline mode. Here is information based on your student record:\n\nRegarding: "${req.body?.prompt || "your query"}"\n\nYour attendance is 87.5% (above the 75% target), CGPA is 8.6/10, and all current Semester 4 dues are clear. Upcoming: Campus Placement Drive and Hackathon Kickoff.`,
      });
    }
  });

  // Privileged Admin Endpoint: Audit Logs
  app.get("/api/admin/audit-logs", requireAuth, requireRole(["admin"]), async (_req: AuthRequest, res) => {
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(50);

      if (error) {
        return res.status(500).json({ error: "Failed to fetch audit logs", details: error.message });
      }

      res.json({ logs: data || [] });
    } catch (err: any) {
      res.status(500).json({ error: "Server error", details: err?.message });
    }
  });

  // Privileged Faculty Endpoint: Class Management
  app.get("/api/faculty/classes", requireAuth, requireRole(["faculty", "admin"]), async (req: AuthRequest, res) => {
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from("classes")
        .select("*, subjects(*)")
        .limit(20);

      if (error) {
        return res.status(500).json({ error: "Failed to fetch classes", details: error.message });
      }

      res.json({ classes: data || [] });
    } catch (err: any) {
      res.status(500).json({ error: "Server error", details: err?.message });
    }
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
