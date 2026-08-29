import { Router, type IRouter } from "express";
import { z } from "zod";
const params = z.object({ chain: z.enum(["BITCOIN", "ETHEREUM", "TRON", "BNB_CHAIN", "POLYGON", "SOLANA", "OTHER"]), address: z.string().min(3).max(256) }).strict();
const router: IRouter = Router();
const getContext = async () => (await import("../../services/persistent-context")).getPersistentContext();
router.get("/:chain/:address", async (req, res) => { const context = await getContext(); const actor = await context.authenticate.authenticate(req); const input = params.parse(req.params); res.json(await context.blockchain.wallet(actor, input.chain, input.address)); });
export default router;
