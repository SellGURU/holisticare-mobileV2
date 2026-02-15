import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertLabResultSchema, 
  insertActionPlanSchema, 
  loginSchema,
  insertEducationalContentSchema,
  insertChatMessageSchema,
  insertCoachProfileSchema,
  insertDeepAnalysisSchema,
  insertCoachingSessionSchema,
  insertHealthGoalSchema,
  insertHolisticPlanSchema,
  insertWellnessChallengeSchema,
  supportMessageSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Extend Request type for file uploads
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  },
});

// Simple session management (in production, use proper session store)
const sessions = new Map<string, { userId: number; expires: Date }>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function isAuthenticated(req: any): number | null {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session || session.expires < new Date()) {
    sessions.delete(sessionId);
    return null;
  }

  return session.userId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Create session
      const sessionId = generateSessionId();
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      sessions.set(sessionId, { userId: user.id, expires });

      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        sessionId,
        expires: expires.toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Registration failed" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      const sessionId = generateSessionId();
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      sessions.set(sessionId, { userId: user.id, expires });

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        sessionId,
        expires: expires.toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Login failed" });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: "Logged out successfully" });
  });

  // Change password
  app.post("/api/auth/change-password", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { current_password, new_password, confirm_password } = req.body;

      // Validate input
      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({ message: "New passwords do not match" });
      }

      if (new_password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(current_password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password and mark as changed
      await storage.updateUserPassword(userId, hashedPassword);

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Delete account
  app.delete("/api/auth/delete-account", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Delete user account and all associated data
      await storage.deleteUser(userId);
      
      // Clear session
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (sessionId) {
        sessions.delete(sessionId);
      }
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // Rook Connect API proxy (credentials stay on server)
  const ROOK_API_URL = process.env.ROOK_API_URL || "https://api.rook-connect.com";
  const ROOK_CLIENT_UUID = process.env.ROOK_CLIENT_UUID;
  const ROOK_PASSWORD = process.env.ROOK_PASSWORD;

  app.get("/api/rook/authorizers", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!ROOK_CLIENT_UUID || !ROOK_PASSWORD) {
      return res.status(503).json({ message: "Rook integration not configured" });
    }
    try {
      const auth = Buffer.from(`${ROOK_CLIENT_UUID}:${ROOK_PASSWORD}`).toString("base64");
      const url = `${ROOK_API_URL}/api/v1/client_uuid/${ROOK_CLIENT_UUID}/user_id/${userId}/data_sources/authorizers`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ message: text || "Rook API error" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Rook authorizers error:", error);
      res.status(500).json({ message: "Failed to fetch Rook authorizers" });
    }
  });

  app.post("/api/rook/revoke", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!ROOK_CLIENT_UUID || !ROOK_PASSWORD) {
      return res.status(503).json({ message: "Rook integration not configured" });
    }
    try {
      const { data_source: dataSource } = req.body;
      if (!dataSource || typeof dataSource !== "string") {
        return res.status(400).json({ message: "data_source is required" });
      }
      const auth = Buffer.from(`${ROOK_CLIENT_UUID}:${ROOK_PASSWORD}`).toString("base64");
      const url = `${ROOK_API_URL}/api/v1/user_id/${userId}/data_sources/revoke_auth`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data_source: dataSource }),
      });
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ message: text || "Rook API error" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Rook revoke error:", error);
      res.status(500).json({ message: "Failed to revoke Rook data source" });
    }
  });

  // Get client information mobile
  app.get("/api/client_information_mobile", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get action plans count
      const actionPlans = await storage.getActionPlans(userId);
      const labResults = await storage.getLabResults(userId);

      res.json({
        name: user.fullName,
        age: user.age || 0,
        sex: user.gender || "not_specified",
        id: user.id.toString(),
        connected_wearable: false,
        coach_username: [],
        email: user.email,
        date_of_birth: user.createdAt, // Using createdAt as placeholder
        pheno_age: user.age || 0,
        verified_account: true,
        member_since: user.createdAt,
        lab_test: labResults.length,
        action_plan: actionPlans.length,
        active_client: true,
        plan: user.subscriptionTier || "free",
        show_phenoage: true,
        has_report: false,
        has_changed_password: user.hasChangedPassword || false,
      });
    } catch (error) {
      console.error('Get client information error:', error);
      res.status(500).json({ message: "Failed to fetch client information" });
    }
  });

  // Lab results routes
  app.get("/api/lab-results", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const results = await storage.getLabResults(userId, limit);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab results" });
    }
  });

  app.post("/api/lab-results", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const labData = insertLabResultSchema.parse({
        ...req.body,
        userId,
        testDate: new Date(req.body.testDate),
      });

      const result = await storage.createLabResult(labData);
      
      // Calculate new health score after adding lab result
      await calculateHealthScore(userId);
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create lab result" });
      }
    }
  });

  // File upload route
  app.post("/api/upload", upload.single('file'), async (req: MulterRequest, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const fileUpload = await storage.createFileUpload({
        userId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadPath: req.file.path,
      });

      res.json({ 
        message: "File uploaded successfully", 
        fileId: fileUpload.id,
        status: "processing" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process file upload" });
    }
  });

  // Health score routes
  app.get("/api/health-score", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const score = await storage.getLatestHealthScore(userId);
      if (!score) {
        // Calculate initial health score if none exists
        const newScore = await calculateHealthScore(userId);
        return res.json(newScore);
      }
      res.json(score);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch health score" });
    }
  });

  app.get("/api/health-score/history", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const history = await storage.getHealthScoreHistory(userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch health score history" });
    }
  });

  // Action plans routes
  app.get("/api/action-plans", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const status = req.query.status as string;
      const plans = await storage.getActionPlans(userId, status);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch action plans" });
    }
  });

  app.post("/api/action-plans", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const planData = insertActionPlanSchema.parse({
        ...req.body,
        userId,
      });

      const plan = await storage.createActionPlan(planData);
      res.json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create action plan" });
      }
    }
  });

  app.put("/api/action-plans/:id", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const planId = parseInt(req.params.id);
      const existingPlan = await storage.getActionPlan(planId);
      
      if (!existingPlan || existingPlan.userId !== userId) {
        return res.status(404).json({ message: "Action plan not found" });
      }

      const updates = req.body;
      const updatedPlan = await storage.updateActionPlan(planId, updates);
      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update action plan" });
    }
  });

  // AI insights routes
  app.get("/api/insights", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const insights = await storage.getAiInsights(userId);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Trends data route
  app.get("/api/trends/:biomarker", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { biomarker } = req.params;
      const timeRange = req.query.range as string || '3M';
      
      let startDate = new Date();
      switch (timeRange) {
        case '3M':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6M':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1Y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0); // All time
      }

      const results = await storage.getLabResultsByDateRange(userId, startDate, new Date());
      const biomarkerResults = results.filter(r => 
        r.testName.toLowerCase().includes(biomarker.toLowerCase())
      );

      res.json(biomarkerResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trend data" });
    }
  });

  // Biomarkers reference data
  app.get("/api/biomarkers", async (req, res) => {
    try {
      const biomarkers = await storage.getBiomarkers();
      res.json(biomarkers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch biomarkers" });
    }
  });

  // Educational content routes
  app.get("/api/educational-content", async (req, res) => {
    try {
      const category = req.query.category as string;
      const content = await storage.getEducationalContent(category);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch educational content" });
    }
  });

  // Deep analyses routes
  app.get("/api/deep-analyses", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const analyses = await storage.getDeepAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  app.post("/api/deep-analyses", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Simulate AI deep analysis generation
      const analysisData = {
        title: "Health Analysis Report",
        summary: "Comprehensive analysis of your health biomarkers and trends",
        analysisData: {
          phenotypicAge: 28.5,
          riskFactors: ["Elevated LDL cholesterol", "Insufficient sleep"],
          recommendations: [
            "Increase omega-3 intake",
            "Implement consistent sleep schedule",
            "Add 30 minutes daily cardio exercise"
          ],
          scores: {
            cardiovascular: 82,
            metabolic: 75,
            inflammatory: 88,
            hormonal: 79
          }
        },
        userId
      };
      
      const analysis = await storage.createDeepAnalysis(analysisData);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate analysis" });
    }
  });

  // Chat messages routes
  app.get("/api/chat-messages", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const sessionId = req.query.sessionId as string;
      const messages = await storage.getChatMessages(userId, sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat-messages", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        userId
      });
      const message = await storage.createChatMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create message" });
      }
    }
  });

  // Coach profiles routes
  app.get("/api/coaches", async (req, res) => {
    try {
      const available = req.query.available === 'true' ? true : req.query.available === 'false' ? false : undefined;
      const coaches = await storage.getCoachProfiles(available);
      res.json(coaches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coaches" });
    }
  });

  // Health goals routes
  app.get("/api/health-goals", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const goals = await storage.getHealthGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/health-goals", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const goalData = insertHealthGoalSchema.parse({
        ...req.body,
        userId
      });
      const goal = await storage.createHealthGoal(goalData);
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create goal" });
      }
    }
  });

  // Wellness challenges routes
  app.get("/api/wellness-challenges", async (req, res) => {
    const userId = isAuthenticated(req);
    const userIdForFilter = (req.query.userOnly === 'true' && userId) ? userId : undefined;
    
    try {
      const challenges = await storage.getWellnessChallenges(userIdForFilter);
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.post("/api/wellness-challenges", async (req, res) => {
    const userId = isAuthenticated(req);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const challengeData = insertWellnessChallengeSchema.parse({
        ...req.body,
        userId
      });
      const challenge = await storage.createWellnessChallenge(challengeData);
      res.json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create challenge" });
      }
    }
  });

  // Support email endpoint
  app.post("/api/support/email", async (req, res) => {
    try {
      const userId = isAuthenticated(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Validate request body
      const validatedData = supportMessageSchema.parse(req.body);
      
      // In a real application, you would send an email here
      // For now, we'll just simulate the email being sent
      console.log(`Support email from user ${userId}:`, {
        subject: validatedData.subject || "Support Request",
        message: validatedData.message,
        timestamp: new Date().toISOString()
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.json({ 
        success: true, 
        message: "Support email sent successfully" 
      });
    } catch (error) {
      console.error("Support email error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to send support email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate health score
async function calculateHealthScore(userId: number) {
  try {
    const recentResults = await storage.getLabResults(userId, 20);
    
    // Simple health score calculation based on recent results
    let totalScore = 0;
    let categoryScores = {
      cardiovascular: 0,
      metabolic: 0,
      vitamin: 0,
    };

    // This is a simplified calculation - in production you'd have more sophisticated algorithms
    const scoreMapping = {
      'cholesterol': { category: 'cardiovascular', weight: 0.3 },
      'ldl': { category: 'cardiovascular', weight: 0.2 },
      'hdl': { category: 'cardiovascular', weight: 0.2 },
      'triglycerides': { category: 'cardiovascular', weight: 0.1 },
      'glucose': { category: 'metabolic', weight: 0.3 },
      'hba1c': { category: 'metabolic', weight: 0.4 },
      'vitamin d': { category: 'vitamin', weight: 0.5 },
    };

    for (const result of recentResults) {
      const testName = result.testName.toLowerCase();
      const mapping = Object.entries(scoreMapping).find(([key]) => 
        testName.includes(key)
      );

      if (mapping) {
        const [, config] = mapping;
        // Simple scoring: if within reference range, score is high
        if (result.referenceMin && result.referenceMax) {
          const value = parseFloat(result.value.toString());
          const min = parseFloat(result.referenceMin.toString());
          const max = parseFloat(result.referenceMax.toString());
          
          let score = 0;
          if (value >= min && value <= max) {
            score = 85 + Math.random() * 15; // 85-100 for normal range
          } else if (value < min || value > max) {
            const deviation = Math.abs(value - (min + max) / 2) / ((max - min) / 2);
            score = Math.max(20, 80 - (deviation * 30)); // Decrease based on deviation
          }

          categoryScores[config.category as keyof typeof categoryScores] += score * config.weight;
        }
      }
    }

    // Calculate overall score
    const overallScore = Math.round(
      (categoryScores.cardiovascular + categoryScores.metabolic + categoryScores.vitamin) / 3
    );

    const healthScore = await storage.createHealthScore({
      userId,
      overallScore: overallScore || 75, // Default score if no data
      cardiovascularScore: Math.round(categoryScores.cardiovascular) || 75,
      metabolicScore: Math.round(categoryScores.metabolic) || 75,
      vitaminScore: Math.round(categoryScores.vitamin) || 75,
    });

    // Generate AI insights if score is concerning
    if (overallScore < 70) {
      await storage.createAiInsight({
        userId,
        title: "Health Score Alert",
        content: `Your overall health score is ${overallScore}. Consider reviewing your recent lab results and consulting with a healthcare professional.`,
        category: "warning",
        priority: "high",
      });
    }

    return healthScore;
  } catch (error) {
    console.error('Error calculating health score:', error);
    throw error;
  }
}
