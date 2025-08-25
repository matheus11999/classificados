import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { createDefaultAdmin, authenticateAdmin, generateAdminToken, isAdminAuthenticated } from "./admin-auth";
import { authenticateUser, registerUser, generateUserToken, requireAuth } from "./user-auth";
import { insertAdSchema, insertFavoriteSchema, loginUserSchema, registerUserSchema } from "@shared/schema";
import { z } from "zod";

// Expired ads cleanup service
function startExpiredAdsCleanup() {
  const cleanupExpiredAds = async () => {
    try {
      console.log("Running expired ads cleanup...");
      
      // Get all expired ads that are still active
      const expiredAds = await storage.getExpiredAds();
      
      for (const ad of expiredAds) {
        // Mark ad as inactive
        await storage.toggleAdStatus(ad.id, false);
        
        // Create notification for the user
        if (ad.userId) {
          await storage.createNotification({
            userId: ad.userId,
            title: "Anúncio expirou",
            message: `Seu anúncio "${ad.title}" expirou e foi pausado automaticamente.`,
            type: "warning",
            adId: ad.id
          });
          
          // Update user's active ads count
          await storage.decrementUserAdsCount(ad.userId);
        }
      }
      
      if (expiredAds.length > 0) {
        console.log(`Cleaned up ${expiredAds.length} expired ads`);
      }
    } catch (error) {
      console.error("Error in expired ads cleanup:", error);
    }
  };

  // Run cleanup immediately
  cleanupExpiredAds();

  // Run cleanup every hour
  setInterval(cleanupExpiredAds, 60 * 60 * 1000);
  
  console.log("Expired ads cleanup service started");
}

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

  // Start expired ads cleanup service
  startExpiredAdsCleanup();

  // Initialize default settings
  try {
    await storage.setSetting("site_name", "PWA Marketplace");
    await storage.setSetting("site_description", "Marketplace de produtos e serviços");
    await storage.setSetting("site_keywords", "marketplace, produtos, serviços, compra, venda");
    await storage.setSetting("site_logo", "");
    await storage.setSetting("contact_email", "contato@marketplace.com");
    await storage.setSetting("contact_phone", "");
    await storage.setSetting("allow_registrations", "true", "boolean");
    await storage.setSetting("max_ads_per_user", "10", "number");
    await storage.setSetting("ad_duration_days", "30", "number");
  } catch (error) {
    console.log("Default settings initialization error:", error);
  }

  // User authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      const user = await authenticateUser(validatedData.username, validatedData.password);
      
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      const token = generateUserToken(user);
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const allowRegistrations = await storage.getSetting("allow_registrations");
      if (allowRegistrations?.value !== "true") {
        return res.status(403).json({ message: "Registros não permitidos" });
      }

      const validatedData = registerUserSchema.parse(req.body);
      const user = await registerUser(validatedData);
      
      if (!user) {
        return res.status(400).json({ message: "Erro ao criar usuário" });
      }
      
      const token = generateUserToken(user);
      const { password, ...userWithoutPassword } = user;
      
      // Create welcome notification
      await storage.createNotification({
        userId: user.id,
        title: "Bem-vindo!",
        message: "Sua conta foi criada com sucesso. Você já pode começar a anunciar!",
        type: "success"
      });
      
      res.status(201).json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
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
        return res.status(404).json({ message: "Anúncio não encontrado" });
      }

      // Increment view count
      await storage.incrementAdViews(id);

      res.json(ad);
    } catch (error) {
      console.error("Error fetching ad:", error);
      res.status(500).json({ message: "Erro ao buscar anúncio" });
    }
  });

  app.post('/api/ads', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertAdSchema.parse({
        ...req.body,
        userId
      });
      
      // Check user limits
      const user = await storage.getUser(userId);
      const maxAdsPerUser = await storage.getSetting("max_ads_per_user");
      const maxAds = parseInt(maxAdsPerUser?.value || "10");
      
      if (user && parseInt(user.activeAdsCount) >= maxAds) {
        return res.status(403).json({ 
          message: `Limite de ${maxAds} anúncios ativos atingido` 
        });
      }
      
      const ad = await storage.createAd(validatedData);
      
      // Create notification
      await storage.createNotification({
        userId,
        title: "Anúncio criado!",
        message: `Seu anúncio "${ad.title}" foi criado com sucesso`,
        type: "success",
        adId: ad.id
      });
      
      res.status(201).json(ad);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating ad:", error);
      res.status(500).json({ message: "Erro ao criar anúncio" });
    }
  });

  // User ad management routes
  app.get('/api/user/ads', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ads = await storage.getUserAds(userId);
      res.json(ads);
    } catch (error) {
      console.error("Error fetching user ads:", error);
      res.status(500).json({ message: "Erro ao buscar seus anúncios" });
    }
  });

  app.patch('/api/ads/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;
      
      const ad = await storage.updateAd(id, updateData, userId);
      
      if (!ad) {
        return res.status(404).json({ message: "Anúncio não encontrado ou sem permissão" });
      }
      
      res.json(ad);
    } catch (error) {
      console.error("Error updating ad:", error);
      res.status(500).json({ message: "Erro ao atualizar anúncio" });
    }
  });

  app.delete('/api/ads/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const deleted = await storage.deleteAd(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Anúncio não encontrado ou sem permissão" });
      }
      
      // Create notification
      await storage.createNotification({
        userId,
        title: "Anúncio pausado",
        message: "Seu anúncio foi pausado com sucesso",
        type: "info",
        adId: id
      });
      
      res.json({ message: "Anúncio pausado com sucesso" });
    } catch (error) {
      console.error("Error deleting ad:", error);
      res.status(500).json({ message: "Erro ao pausar anúncio" });
    }
  });

  // User management routes
  app.put('/api/user/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      // Remove sensitive fields that shouldn't be updated via this route
      delete updateData.password;
      delete updateData.activeAdsCount;
      delete updateData.active;
      
      const user = await storage.updateUser(userId, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // Notifications routes
  app.get('/api/notifications', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Erro ao buscar notificações" });
    }
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const updated = await storage.markNotificationAsRead(id, userId);
      
      if (!updated) {
        return res.status(404).json({ message: "Notificação não encontrada" });
      }
      
      res.json({ message: "Notificação marcada como lida" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Erro ao marcar notificação como lida" });
    }
  });

  // Favorites routes
  app.get('/api/favorites', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Erro ao buscar favoritos" });
    }
  });

  app.post('/api/favorites', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { adId } = req.body;
      
      const favorite = await storage.addToFavorites(adId, userId);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding to favorites:", error);
      res.status(500).json({ message: "Erro ao adicionar aos favoritos" });
    }
  });

  app.delete('/api/favorites/:adId', requireAuth, async (req: any, res) => {
    try {
      const { adId } = req.params;
      const userId = req.user.id;
      
      const removed = await storage.removeFromFavorites(adId, userId);
      
      if (!removed) {
        return res.status(404).json({ message: "Favorito não encontrado" });
      }
      
      res.json({ message: "Removido dos favoritos" });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      res.status(500).json({ message: "Erro ao remover dos favoritos" });
    }
  });

  app.get('/api/favorites/:adId/check', requireAuth, async (req: any, res) => {
    try {
      const { adId } = req.params;
      const userId = req.user.id;
      
      const isFavorited = await storage.isAdFavorited(adId, userId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: "Erro ao verificar favorito" });
    }
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

  // Category management routes
  app.post('/api/admin/categories', async (req: any, res) => {
    try {
      const { name, icon } = req.body;
      
      if (!name || !icon) {
        return res.status(400).json({ message: "Nome e ícone são obrigatórios" });
      }
      
      const category = await storage.createCategory({ name, icon });
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Erro ao criar categoria" });
    }
  });

  app.put('/api/admin/categories/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, icon } = req.body;
      
      const category = await storage.updateCategory(id, { name, icon });
      
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Erro ao atualizar categoria" });
    }
  });

  app.delete('/api/admin/categories/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      res.json({ message: "Categoria deletada com sucesso" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Erro ao deletar categoria" });
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
