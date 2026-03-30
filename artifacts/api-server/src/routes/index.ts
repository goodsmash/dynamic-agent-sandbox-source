import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import providersRouter from "./providers";
import usageRouter from "./usage";
import researchRouter from "./research";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionsRouter);
router.use("/providers", providersRouter);
router.use("/usage", usageRouter);
router.use("/research", researchRouter);

export default router;
