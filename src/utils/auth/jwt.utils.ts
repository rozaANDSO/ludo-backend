import * as jwt from "jsonwebtoken";
export function signJWT(payload: object, expiresIn: string | number) {
  return jwt.sign(payload, "process.env.JWT_KEY" as string, {
    expiresIn,
  });
}

// verify jwt
export const verifyJWT = (token: string) => {
  try {
    const decoded = jwt.verify(token,"process.env.JWT_KEY" as string);
    return { payload: decoded, expired: false };
  } catch (error: any) {
    console.log(error)
    return { payload: null, expired: true };
  }
};
