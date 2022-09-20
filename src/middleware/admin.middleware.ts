import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/AuthRequest.type";
import { auth } from "../firebase/firebase";

const admins = process.env.ADMINS?.split(",");

async function verify(token: string) {
  const decodedToken = await auth.verifyIdToken(token);
  return decodedToken;
}

export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // extract token from request
    const isToken = req.headers["authorization"]?.split(" ")[1];
    if (!isToken) {
      throw new Error("Token not found");
    }

    // verify user's google authentication
    const userGoogle = await auth.verifyIdToken(isToken);

    console.log(userGoogle.email);
    // if user's email is in the list of admins, move forward
    if (admins?.includes(userGoogle.email!)) {
      return next();
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Not an Admin, Fuck Off" });
  }
};