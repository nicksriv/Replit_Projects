import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Progress tracking for YouTube processing
export const progressTrackers = new Map<string, {
  progress: number;
  stage: string;
  message: string;
  completed: boolean;
  error?: string;
}>();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Create a sub-app for the YouTube AI application
    const mainApp = express();
    const server = await registerRoutes(mainApp);

    mainApp.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (mainApp.get("env") === "development") {
      await setupVite(mainApp, server);
    } else {
      serveStatic(mainApp);
    }

    // Mount the main app at root level for subdomain deployment
    app.use("/", mainApp);

    // Health check at root level for server monitoring
    app.get("/health", (req, res) => {
      res.json({ status: "healthy", timestamp: new Date().toISOString() });
    });

    // Use PORT environment variable for Autoscale deployments, fallback to 5001
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT as string) || 5001;
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Failed to start server: ${error}`);
    process.exit(1);
  }
})();
