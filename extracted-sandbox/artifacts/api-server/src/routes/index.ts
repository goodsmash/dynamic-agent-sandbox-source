import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import providersRouter from "./providers";
import usageRouter from "./usage";
import researchRouter from "./research";
import skillsRouter from "./skills";
import workflowsRouter from "./workflows";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionsRouter);
router.use("/providers", providersRouter);
router.use("/usage", usageRouter);
router.use("/research", researchRouter);
router.use("/skills", skillsRouter);
router.use(workflowsRouter);

export default router;
