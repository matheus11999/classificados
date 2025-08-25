import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "user-secret-key-change-in-production";

export interface UserJwtPayload {
  id: string;
  username: string;
  email: string;
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const user = await storage.getUserByUsername(username);
    
    if (!user || !user.active) {
      return null;
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Error authenticating user:", error);
    return null;
  }
}

export async function registerUser(userData: {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<User | null> {
  try {
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("Username já está em uso");
    }

    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error("Email já está em uso");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });
    
    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    return null;
  }
}

export function generateUserToken(user: User): string {
  const payload: UserJwtPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyUserToken(token: string): UserJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserJwtPayload;
  } catch (error) {
    return null;
  }
}

export function isUserAuthenticated(req: any): UserJwtPayload | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyUserToken(token);
}

// Express middleware for user authentication
export function requireAuth(req: any, res: any, next: any) {
  const userPayload = isUserAuthenticated(req);
  if (!userPayload) {
    return res.status(401).json({ message: "Acesso negado - Login requerido" });
  }
  
  req.user = userPayload;
  next();
}