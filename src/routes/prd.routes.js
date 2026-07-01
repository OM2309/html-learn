import express from 'express';
import { generatePRD, streamProposal } from '../controllers/prd.controller.js';

const router = express.Router();

router.post('/propose', streamProposal);
router.post('/generate', generatePRD);


export default router;
