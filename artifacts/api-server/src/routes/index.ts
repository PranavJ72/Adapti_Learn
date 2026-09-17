import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learnerRouter from "./learner";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learnerRouter);

export default router;
