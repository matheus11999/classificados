import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { createDefaultAdmin, authenticateAdmin, generateAdminToken, isAdminAuthenticated } from "./admin-auth";
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

  // Create default admin user
  await createDefaultAdmin();

  // Initialize default settings
  try {
    await storage.setSetting("site_name", "PWA Marketplace");
    await storage.setSetting("site_description", "Marketplace de produtos e serviços");
    await storage.setSetting("site_keywords", "marketplace, produtos, serviços, compra, venda");
    await storage.setSetting("site_logo", "");
    await storage.setSetting("contact_email", "contato@marketplace.com");
    await storage.setSetting("contact_phone", "");
    await storage.setSetting("allow_registrations", "true", "boolean");
  } catch (error) {
    console.log("Default settings initialization error:", error);
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

  // Admin authentication routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      const admin = await authenticateAdmin(email, password);
      
      if (!admin) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      const token = generateAdminToken(admin);
      
      res.json({
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Admin protected routes
  app.use('/api/admin', (req: any, res, next) => {
    if (req.path === '/login') {
      return next();
    }
    
    const adminPayload = isAdminAuthenticated(req);
    if (!adminPayload) {
      return res.status(401).json({ message: "Acesso negado - Admin requerido" });
    }
    
    req.admin = adminPayload;
    next();
  });

  // Admin dashboard routes
  app.get('/api/admin/stats', async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const ads = await storage.getAllAds();
      
      const stats = {
        totalUsers: users.length,
        totalAds: ads.length,
        activeAds: ads.filter(ad => ad.active).length,
        inactiveAds: ads.filter(ad => !ad.active).length,
        recentUsers: users.slice(0, 5),
        recentAds: ads.slice(0, 5),
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // User management routes
  app.get('/api/admin/users', async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.delete('/api/admin/users/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({ message: "Usuário deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Erro ao deletar usuário" });
    }
  });

  // Ad management routes
  app.get('/api/admin/ads', async (req: any, res) => {
    try {
      const ads = await storage.getAllAds();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ message: "Erro ao buscar anúncios" });
    }
  });

  app.patch('/api/admin/ads/:id/toggle', async (req: any, res) => {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      const updated = await storage.toggleAdStatus(id, active);
      
      if (!updated) {
        return res.status(404).json({ message: "Anúncio não encontrado" });
      }
      
      res.json({ message: active ? "Anúncio ativado" : "Anúncio desativado" });
    } catch (error) {
      console.error("Error toggling ad status:", error);
      res.status(500).json({ message: "Erro ao alterar status do anúncio" });
    }
  });

  app.delete('/api/admin/ads/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAdPermanently(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Anúncio não encontrado" });
      }
      
      res.json({ message: "Anúncio deletado permanentemente" });
    } catch (error) {
      console.error("Error deleting ad:", error);
      res.status(500).json({ message: "Erro ao deletar anúncio" });
    }
  });

  // Settings management routes
  app.get('/api/admin/settings', async (req: any, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });

  app.put('/api/admin/settings', async (req: any, res) => {
    try {
      const settings = req.body;
      
      for (const [key, value] of Object.entries(settings)) {
        await storage.setSetting(key, value as string);
      }
      
      res.json({ message: "Configurações atualizadas com sucesso" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });

  // Public settings endpoint
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      const publicSettings = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      
      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching public settings:", error);
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
