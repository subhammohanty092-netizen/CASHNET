import { Router, type IRouter } from "express";
import { z } from "zod";

const creation = z.object({ caseId: z.string().uuid(), chain: z.enum(["BITCOIN", "ETHEREUM", "TRON", "BNB_CHAIN", "POLYGON", "SOLANA", "OTHER"]).optional(), walletAddress: z.string().min(3).max(256).optional(), investigationDepth: z.number().int().min(1).max(10).optional(), startTime: z.string().datetime().optional(), endTime: z.string().datetime().optional() }).strict();
const walletCreation = creation.extend({ chain: z.enum(["BITCOIN", "ETHEREUM", "TRON", "BNB_CHAIN", "POLYGON", "SOLANA", "OTHER"]), walletAddress: z.string().min(3).max(256), label: z.enum(["REPORTED", "SUSPECT", "SUBJECT", "OBSERVED", "UNKNOWN"]).optional() }).strict();
const update = z.object({ status: z.enum(["AUTHORIZED", "RUNNING", "COMPLETED", "PARTIAL", "FAILED", "CANCELLED"]) }).strict();
const router: IRouter = Router();
const getContext = async () => (await import("../../services/persistent-context")).getPersistentContext();

router.post("/", async (req, res) => { const context = await getContext(); const actor = await context.authenticate.authenticate(req); res.status(201).json(await context.investigations.create(actor, creation.parse(req.body), String(req.id))); });
router.post("/wallet", async (req, res) => { const context = await getContext(); const actor = await context.authenticate.authenticate(req); res.status(201).json(await context.investigations.createWalletSubject(actor, walletCreation.parse(req.body), String(req.id))); });
router.get("/:id", async (req, res) => { const context = await getContext(); const actor = await context.authenticate.authenticate(req); res.json(await context.investigations.get(actor, req.params.id, String(req.id))); });
router.patch("/:id", async (req, res) => { const context = await getContext(); const actor = await context.authenticate.authenticate(req); res.json(await context.investigations.transition(actor, req.params.id, update.parse(req.body).status, String(req.id))); });
router.post("/:id/collect", async (req, res) => { const context = await getContext(); const actor = await context.authenticate.authenticate(req); res.json(await context.collection.collect(actor, req.params.id, String(req.id))); });

export default router;
