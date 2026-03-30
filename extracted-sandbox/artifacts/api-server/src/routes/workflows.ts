import { Router, type IRouter } from "express";
import { AGENTIC_WORKFLOWS, getWorkflowById, getWorkflowsByCategory, WORKFLOW_CATEGORIES, CATEGORY_ICONS, DIFFICULTY_COLORS } from "../lib/workflows.js";

const router: IRouter = Router();

router.get("/workflows", (_req, res) => {
  res.json({
    total: AGENTIC_WORKFLOWS.length,
    categories: WORKFLOW_CATEGORIES,
    categoryIcons: CATEGORY_ICONS,
    difficultyColors: DIFFICULTY_COLORS,
    workflows: AGENTIC_WORKFLOWS,
  });
});

router.get("/workflows/:id", (req, res) => {
  const workflow = getWorkflowById(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: "Workflow not found" });
  }
  res.json(workflow);
});

router.get("/workflows/category/:category", (req, res) => {
  const workflows = getWorkflowsByCategory(req.params.category as any);
  res.json({ category: req.params.category, workflows, count: workflows.length });
});

export default router;
