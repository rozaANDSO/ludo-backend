import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { signJWT } from "../utils/auth/jwt.utils";

import User from "../models/user";
import { UnauthorizedAccess } from "../errors/unauthorized.error";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.middleware";

const signin = [
  body("password")
    .trim()
    .notEmpty()
    .isLength({ min: 6, max: 20 })
    .withMessage("You must supply password of minimum 6 character"),
  body("username").trim().notEmpty().withMessage("You must supply username"),
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("click");
      const user = await User.findOne({ username: req.body.username }); //(req.body.username);

      if (user) {
        const statusLogin = await bcrypt.compare(
          req.body.password,
          user.password
        );

        if (!statusLogin) {
          throw new UnauthorizedAccess();
        }
        const accessToken = signJWT(
          {
            username: user.username,
            userId: user.id,
          },
          60 * 60 * 20
        );
        //const sessionId = await generateSession(user.username);
        const refreshToken = signJWT(
          {
            username: user.username,
            // sessionId: sessionId,
            userId: user.id,
          },
          "30d"
        );
        res.cookie("refreshToken", refreshToken, {
          maxAge: 60 * 60 * 24 * 30 * 1000, //1 month
          secure: true,
          httpOnly: true,
        });
        res
          .cookie("accessToken", accessToken, {
            maxAge: 60 * 60 * 24 * 30 * 1000, //1 month
            secure: true,
            httpOnly: true,
          })
          .status(200)
          .json({
            refreshToken,
          });
      } else {
        throw new UnauthorizedAccess();
      }
    } catch (err) {
      next(err);
    }
  },
];
export default signin;
