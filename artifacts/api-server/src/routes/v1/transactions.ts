import { Router, type IRouter } from "express";
import { z } from "zod";
const params = z.object({ chain: z.enum(["BITCOIN", "ETHEREUM", "TRON", "BNB_CHAIN", "POLYGON", "SOLANA", "OTHER"]), txHash: z.string().min(3).max(256) }).strict();
const router: IRouter = Router();
const getContext = async () => (await import("../../services/persistent-context")).getPersistentContext();
router.get("/:chain/:txHash", async (req, res) => { const context = await getContext(); const actor = await context.authenticate.authenticate(req); const input = params.parse(req.params); res.json(await context.blockchain.transaction(actor, input.chain, input.txHash)); });
export default router;
