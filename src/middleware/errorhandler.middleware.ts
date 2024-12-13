
import { Request, Response, NextFunction } from "express";
import { CustomError } from "../errors/custom.error";
import mongoose, { mongo } from "mongoose";


export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(err)
  if (err instanceof mongo.MongoError && err.code === 11000) {
    let errors = []
    //@ts-ignore
    for (let k in err.keyValue) {
      //@ts-ignore
      if (err.keyValue.hasOwnProperty(k)) {
        errors.push({ message: `${k} taken`, field: k })
      }
    }
    return res.status(403).send({ errors: errors });
  }
  if (err instanceof CustomError) {
    return res.status(err.statusCode).send({ errors: err.serializeErrors() });
  }
  console.error(err);
  res.status(500).send({
    errors: [{ message: "Something went wrong" }],
  });
};