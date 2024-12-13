import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs"
import User from "../models/user";
import { validateRequest } from "../middleware/validateRequest.middleware";
import {body}  from "express-validator";

const signup = [
  body("number")
    .trim()
    .notEmpty()
    .isLength({ min: 9, max: 12 })
    .withMessage("You must supply correct phone number"),
  body("fname").trim().notEmpty().withMessage("You must supply first Name"),
  body("lname").trim().notEmpty().withMessage("You must supply last Name"),
  body("password")
    .trim()
    .notEmpty()
    .isLength({ min: 6, max: 20 })
    .withMessage("You must supply password of minimum 6 character"),
  body("username").trim().notEmpty().withMessage("You must supply username"),
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      console.log("what")
      const user = new User({
        fname: req.body.lname,
        email: `${req.body.username}@zgames.com`,
        lname: req.body.lname,
        number: req.body.number,
        username: req.body.username,
        password: hashedPassword,
      });
      await user.save();
      res.status(201).json({ msg: "account created!", user });
    } catch (err) {
      next(err);
    }
  },
];

export default signup;
