import express from "express";
import  signin  from "../controllers/signin.controller";
import  signup from "../controllers/signup.controller";
const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
export default router ;
