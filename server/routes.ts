import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
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

  app.post('/api/ads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertAdSchema.parse(req.body);
      
      const ad = await storage.createAd(validatedData, userId);
      res.status(201).json(ad);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating ad:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  app.patch('/api/ads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const validatedData = insertAdSchema.partial().parse(req.body);
      
      const ad = await storage.updateAd(id, validatedData, userId);
      
      if (!ad) {
        return res.status(404).json({ message: "Ad not found or unauthorized" });
      }

      res.json(ad);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating ad:", error);
      res.status(500).json({ message: "Failed to update ad" });
    }
  });

  app.delete('/api/ads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const deleted = await storage.deleteAd(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Ad not found or unauthorized" });
      }

      res.json({ message: "Ad deleted successfully" });
    } catch (error) {
      console.error("Error deleting ad:", error);
      res.status(500).json({ message: "Failed to delete ad" });
    }
  });

  // User ads route
  app.get('/api/user/ads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ads = await storage.getAds({ userId });
      res.json(ads);
    } catch (error) {
      console.error("Error fetching user ads:", error);
      res.status(500).json({ message: "Failed to fetch user ads" });
    }
  });

  // Favorites routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { adId } = insertFavoriteSchema.parse(req.body);
      
      const favorite = await storage.addToFavorites(adId, userId);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding to favorites:", error);
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });

  app.delete('/api/favorites/:adId', isAuthenticated, async (req: any, res) => {
    try {
      const { adId } = req.params;
      const userId = req.user.claims.sub;
      
      const removed = await storage.removeFromFavorites(adId, userId);
      
      if (!removed) {
        return res.status(404).json({ message: "Favorite not found" });
      }

      res.json({ message: "Removed from favorites" });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get('/api/favorites/:adId/check', isAuthenticated, async (req: any, res) => {
    try {
      const { adId } = req.params;
      const userId = req.user.claims.sub;
      
      const isFavorited = await storage.isAdFavorited(adId, userId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
