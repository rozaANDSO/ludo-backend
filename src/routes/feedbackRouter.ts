import express, { Request, Response } from 'express';
import Feedback, { Feedback as FeedbackType } from '../models/feedbackModel';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const feedback: FeedbackType[] = await Feedback.find().sort({ date: -1 });
    res.json(feedback);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});



router.post('/', async (req: Request, res: Response) => {
  const { username, message } = req.body;
  const feedback = new Feedback({ username, message });
  try {
    const newFeedback = await feedback.save();
    res.status(201).json(newFeedback);
    console.log(newFeedback)
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
