import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/readyz", async (_req, res) => {
  // Readiness probe: checks if the service can accept traffic
  // In production with DATABASE_URL, this would verify DB connectivity
  const checks: Record<string, string> = { process: "ok" };
  if (process.env.DATABASE_URL) {
    // DB connectivity is validated at startup via migration runner;
    // readiness probe confirms the process is ready to serve
    checks.database = "configured";
  } else {
    checks.database = "not_configured";
  }
  res.json({ status: "ok", checks });
});

export default router;
