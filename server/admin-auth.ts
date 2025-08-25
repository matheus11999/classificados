import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import type { AdminUser } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "admin-secret-key-change-in-production";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@marketplace.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export interface AdminJwtPayload {
  id: string;
  email: string;
  role: string;
}

export async function createDefaultAdmin(): Promise<void> {
  try {
    const existingAdmin = await storage.getAdminByEmail(ADMIN_EMAIL);
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      await storage.createAdmin({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "System",
        role: "admin",
        active: true,
      });
      
      console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
      console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
  try {
    const admin = await storage.getAdminByEmail(email);
    
    if (!admin || !admin.active) {
      return null;
    }
    
    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      return null;
    }
    
    return admin;
  } catch (error) {
    console.error("Error authenticating admin:", error);
    return null;
  }
}

export function generateAdminToken(admin: AdminUser): string {
  const payload: AdminJwtPayload = {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
  } catch (error) {
    return null;
  }
}

export function isAdminAuthenticated(req: any): AdminJwtPayload | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyAdminToken(token);
}