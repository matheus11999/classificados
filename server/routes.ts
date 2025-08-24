import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertAdSchema, insertFavoriteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default categories
  const defaultCategories = [
    { name: "Eletrônicos", icon: "fas fa-laptop" },
    { name: "Veículos", icon: "fas fa-car" },
    { name: "Imóveis", icon: "fas fa-home" },
    { name: "Móveis", icon: "fas fa-couch" },
    { name: "Roupas", icon: "fas fa-tshirt" },
    { name: "Esportes", icon: "fas fa-dumbbell" },
    { name: "Livros", icon: "fas fa-book" },
    { name: "Outros", icon: "fas fa-tag" },
  ];

  // Create default categories if they don't exist
  try {
    const existingCategories = await storage.getCategories();
    if (existingCategories.length === 0) {
      for (const category of defaultCategories) {
        await storage.createCategory(category);
      }
    }
  } catch (error) {
    console.log("Categories already exist or error creating them:", error);
  }

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json(null);
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Ad routes
  app.get('/api/ads', async (req, res) => {
    try {
      const {
        categoryId,
        location,
        search,
        featured,
        limit = 50,
        offset = 0,
      } = req.query;

      const options = {
        categoryId: categoryId as string,
        location: location as string,
        search: search as string,
        featured: featured === 'true' ? true : undefined,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
      };

      const ads = await storage.getAds(options);
      res.json(ads);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  app.get('/api/ads/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await storage.getAdById(id);
      
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      res.json(ad);
    } catch (error) {
      console.error("Error fetching ad:", error);
      res.status(500).json({ message: "Failed to fetch ad" });
    }
  });

  app.post('/api/ads', async (req: any, res) => {
    try {
      const validatedData = insertAdSchema.parse(req.body);
      
      // Create ad without user authentication (anonymous posting)
      const ad = await storage.createAd(validatedData, null);
      res.status(201).json(ad);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating ad:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  // Admin routes - disabled since no auth
  app.patch('/api/ads/:id', (req: any, res) => {
    res.status(501).json({ message: "Editing ads disabled - authentication required" });
  });

  app.delete('/api/ads/:id', (req: any, res) => {
    res.status(501).json({ message: "Deleting ads disabled - authentication required" });
  });

  // User ads route - disabled since no auth
  app.get('/api/user/ads', (req: any, res) => {
    res.status(501).json({ message: "User ads disabled - authentication required" });
  });

  // Favorites routes - disabled since no auth
  app.get('/api/favorites', (req: any, res) => {
    res.json([]);
  });

  app.post('/api/favorites', (req: any, res) => {
    res.status(501).json({ message: "Favorites disabled - authentication required" });
  });

  app.delete('/api/favorites/:adId', (req: any, res) => {
    res.status(501).json({ message: "Favorites disabled - authentication required" });
  });

  app.get('/api/favorites/:adId/check', (req: any, res) => {
    res.json({ isFavorited: false });
  });

  const httpServer = createServer(app);
  return httpServer;
}
