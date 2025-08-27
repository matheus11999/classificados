import {
  users,
  ads,
  categories,
  favorites,
  adImages,
  adminUsers,
  siteSettings,
  notifications,
  boostPromotions,
  boostedAds,
  type User,
  type UpsertUser,
  type RegisterUser,
  type Ad,
  type InsertAd,
  type AdWithDetails,
  type Category,
  type InsertCategory,
  type Favorite,
  type InsertFavorite,
  type AdminUser,
  type InsertAdminUser,
  type SiteSetting,
  type InsertSiteSetting,
  type Notification,
  type InsertNotification,
  type BoostPromotion,
  type InsertBoostPromotion,
  type BoostedAd,
  type InsertBoostedAd,
  type BoostedAdWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, or, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: RegisterUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Ad operations
  getAds(options?: {
    categoryId?: string;
    location?: string;
    search?: string;
    featured?: boolean;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdWithDetails[]>;
  getAdById(id: string): Promise<AdWithDetails | undefined>;
  createAd(ad: InsertAd & { images?: string[] }): Promise<Ad>;
  updateAd(id: string, ad: Partial<InsertAd> & { images?: string[] }, userId: string): Promise<Ad | undefined>;
  deleteAd(id: string, userId: string): Promise<boolean>;
  incrementAdViews(id: string): Promise<void>;
  getUserAds(userId: string): Promise<AdWithDetails[]>;
  
  // Favorites operations
  getFavorites(userId: string): Promise<AdWithDetails[]>;
  addToFavorites(adId: string, userId: string): Promise<Favorite>;
  removeFromFavorites(adId: string, userId: string): Promise<boolean>;
  isAdFavorited(adId: string, userId: string): Promise<boolean>;
  
  // Notifications operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string, userId: string): Promise<boolean>;
  deleteNotification(id: string, userId: string): Promise<boolean>;
  
  // Admin operations
  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  getAllUsers(): Promise<User[]>;
  getAllAds(): Promise<AdWithDetails[]>;
  toggleUserStatus(userId: string, active: boolean): Promise<boolean>;
  toggleAdStatus(adId: string, active: boolean): Promise<boolean>;
  deleteUser(userId: string): Promise<boolean>;
  deleteAdPermanently(adId: string): Promise<boolean>;
  
  // Site settings operations
  getSetting(key: string): Promise<SiteSetting | undefined>;
  setSetting(key: string, value: string, type?: string): Promise<SiteSetting>;
  getAllSettings(): Promise<SiteSetting[]>;
  
  // Expired ads cleanup
  getExpiredAds(): Promise<Ad[]>;
  decrementUserAdsCount(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: RegisterUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const [category] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    return !!category;
  }

  // Ad operations
  async getAds(options: {
    categoryId?: string;
    location?: string;
    search?: string;
    featured?: boolean;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AdWithDetails[]> {
    const {
      categoryId,
      location,
      search,
      featured,
      userId,
      limit = 50,
      offset = 0,
    } = options;

    const conditions = [eq(ads.active, true)];

    if (categoryId) {
      conditions.push(eq(ads.categoryId, categoryId));
    }

    if (location) {
      conditions.push(ilike(ads.location, `%${location}%`));
    }

    if (search) {
      const searchCondition = or(
        ilike(ads.title, `%${search}%`),
        ilike(ads.description, `%${search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (featured !== undefined) {
      conditions.push(eq(ads.featured, featured));
    }

    if (userId) {
      conditions.push(eq(ads.userId, userId));
    }

    console.log(`Getting ads with ${conditions.length} conditions, limit: ${limit}, offset: ${offset}`);

    const result = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        price: ads.price,
        imageUrl: ads.imageUrl,
        categoryId: ads.categoryId,
        location: ads.location,
        whatsapp: ads.whatsapp,
        userId: ads.userId,
        featured: ads.featured,
        active: ads.active,
        createdAt: ads.createdAt,
        updatedAt: ads.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          whatsapp: users.whatsapp,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          createdAt: categories.createdAt,
        },
      })
      .from(ads)
      .leftJoin(users, eq(ads.userId, users.id))
      .leftJoin(categories, eq(ads.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(ads.createdAt))
      .limit(limit)
      .offset(offset);

    console.log(`Found ${result.length} ads`);

    // TEMPORARY FIX: Skip images query to debug main issue
    console.log("Returning ads without images query for debugging");
    return result.map(ad => ({
      ...ad,
      images: []
    })) as AdWithDetails[];
  }

  async getAdById(id: string): Promise<AdWithDetails | undefined> {
    const [result] = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        price: ads.price,
        imageUrl: ads.imageUrl,
        categoryId: ads.categoryId,
        location: ads.location,
        whatsapp: ads.whatsapp,
        userId: ads.userId,
        featured: ads.featured,
        active: ads.active,
        createdAt: ads.createdAt,
        updatedAt: ads.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          whatsapp: users.whatsapp,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          createdAt: categories.createdAt,
        },
      })
      .from(ads)
      .leftJoin(users, eq(ads.userId, users.id))
      .leftJoin(categories, eq(ads.categoryId, categories.id))
      .where(and(eq(ads.id, id), eq(ads.active, true)));

    if (!result) return undefined;

    // Get images for this ad
    const adImagesList = await db
      .select()
      .from(adImages)
      .where(eq(adImages.adId, result.id))
      .orderBy(desc(adImages.isPrimary), adImages.order);

    return {
      ...result,
      images: adImagesList
    } as AdWithDetails;
  }

  async createAd(ad: InsertAd & { images?: string[] }): Promise<Ad> {
    // Get ad duration setting
    const durationSetting = await this.getSetting("ad_duration_days");
    const durationDays = parseInt(durationSetting?.value || "30");
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    
    const [newAd] = await db
      .insert(ads)
      .values({
        ...ad,
        price: ad.price.toString(),
        expiresAt,
      })
      .returning();
    
    // If additional images provided, save them to adImages table
    if (ad.images && ad.images.length > 0) {
      const imageRecords = ad.images.map((imageUrl, index) => ({
        adId: newAd.id,
        imageUrl,
        isPrimary: index === 0, // First image is primary
        order: index,
      }));
      
      await db.insert(adImages).values(imageRecords);
    }
    
    // Update user's active ads count
    await db
      .update(users)
      .set({ 
        activeAdsCount: sql`${users.activeAdsCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, ad.userId!));
    
    return newAd;
  }

  async getUserAds(userId: string): Promise<AdWithDetails[]> {
    const result = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        price: ads.price,
        imageUrl: ads.imageUrl,
        categoryId: ads.categoryId,
        location: ads.location,
        whatsapp: ads.whatsapp,
        userId: ads.userId,
        featured: ads.featured,
        active: ads.active,
        views: ads.views,
        expiresAt: ads.expiresAt,
        createdAt: ads.createdAt,
        updatedAt: ads.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          whatsapp: users.whatsapp,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          createdAt: categories.createdAt,
        },
      })
      .from(ads)
      .leftJoin(users, eq(ads.userId, users.id))
      .leftJoin(categories, eq(ads.categoryId, categories.id))
      .where(eq(ads.userId, userId))
      .orderBy(desc(ads.createdAt));

    return result as AdWithDetails[];
  }

  async incrementAdViews(id: string): Promise<void> {
    await db
      .update(ads)
      .set({ 
        views: sql`${ads.views} + 1`,
        updatedAt: new Date()
      })
      .where(eq(ads.id, id));
  }

  async updateAd(id: string, ad: Partial<InsertAd> & { images?: string[] }, userId: string): Promise<Ad | undefined> {
    // Separate images from ad data
    const { images, ...adData } = ad;
    
    const [updatedAd] = await db
      .update(ads)
      .set({
        ...adData,
        updatedAt: new Date(),
      })
      .where(and(eq(ads.id, id), eq(ads.userId, userId)))
      .returning();

    // If images array is provided, update the images
    if (images && updatedAd) {
      // Delete existing images
      await db.delete(adImages).where(eq(adImages.adId, updatedAd.id));
      
      // Insert new images
      if (images.length > 0) {
        const imageRecords = images.map((imageUrl, index) => ({
          adId: updatedAd.id,
          imageUrl,
          isPrimary: index === 0, // First image is primary
          order: index,
        }));
        
        await db.insert(adImages).values(imageRecords);
      }
    }
    
    return updatedAd;
  }

  async deleteAd(id: string, userId: string): Promise<boolean> {
    // First delete related notifications
    await db
      .delete(notifications)
      .where(eq(notifications.adId, id));
    
    // Then delete the ad
    const [deletedAd] = await db
      .delete(ads)
      .where(and(eq(ads.id, id), eq(ads.userId, userId)))
      .returning();
    
    if (deletedAd) {
      // Update user's active ads count
      await db
        .update(users)
        .set({ 
          activeAdsCount: sql`${users.activeAdsCount} - 1`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    }
    
    return !!deletedAd;
  }

  // Favorites operations
  async getFavorites(userId: string): Promise<AdWithDetails[]> {
    const result = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        price: ads.price,
        imageUrl: ads.imageUrl,
        categoryId: ads.categoryId,
        location: ads.location,
        whatsapp: ads.whatsapp,
        userId: ads.userId,
        featured: ads.featured,
        active: ads.active,
        createdAt: ads.createdAt,
        updatedAt: ads.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          whatsapp: users.whatsapp,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          createdAt: categories.createdAt,
        },
      })
      .from(favorites)
      .leftJoin(ads, eq(favorites.adId, ads.id))
      .leftJoin(users, eq(ads.userId, users.id))
      .leftJoin(categories, eq(ads.categoryId, categories.id))
      .where(and(eq(favorites.userId, userId), eq(ads.active, true)))
      .orderBy(desc(favorites.createdAt));

    return result as AdWithDetails[];
  }

  async addToFavorites(adId: string, userId: string): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values({ adId, userId })
      .onConflictDoNothing()
      .returning();
    return favorite;
  }

  async removeFromFavorites(adId: string, userId: string): Promise<boolean> {
    const [removed] = await db
      .delete(favorites)
      .where(and(eq(favorites.adId, adId), eq(favorites.userId, userId)))
      .returning();
    return !!removed;
  }

  async isAdFavorited(adId: string, userId: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.adId, adId), eq(favorites.userId, userId)));
    return !!favorite;
  }

  // Admin operations
  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email));
    return admin;
  }

  async createAdmin(adminData: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db
      .insert(adminUsers)
      .values(adminData)
      .returning();
    return admin;
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAllAds(): Promise<AdWithDetails[]> {
    const result = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        price: ads.price,
        imageUrl: ads.imageUrl,
        categoryId: ads.categoryId,
        location: ads.location,
        whatsapp: ads.whatsapp,
        userId: ads.userId,
        featured: ads.featured,
        active: ads.active,
        createdAt: ads.createdAt,
        updatedAt: ads.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          whatsapp: users.whatsapp,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          createdAt: categories.createdAt,
        },
      })
      .from(ads)
      .leftJoin(users, eq(ads.userId, users.id))
      .leftJoin(categories, eq(ads.categoryId, categories.id))
      .orderBy(desc(ads.createdAt));

    return result as AdWithDetails[];
  }

  async toggleUserStatus(userId: string, active: boolean): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return !!user;
  }

  async toggleAdStatus(adId: string, active: boolean): Promise<boolean> {
    const [ad] = await db
      .update(ads)
      .set({ active, updatedAt: new Date() })
      .where(eq(ads.id, adId))
      .returning();
    return !!ad;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const [user] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    return !!user;
  }

  async deleteAdPermanently(adId: string): Promise<boolean> {
    // First delete related notifications
    await db
      .delete(notifications)
      .where(eq(notifications.adId, adId));
    
    // Delete from favorites if any
    await db
      .delete(favorites)
      .where(eq(favorites.adId, adId));
    
    // Then delete the ad
    const [ad] = await db
      .delete(ads)
      .where(eq(ads.id, adId))
      .returning();
    
    // Update user's active ads count if the ad had a user
    if (ad && ad.userId) {
      await db
        .update(users)
        .set({ 
          activeAdsCount: sql`${users.activeAdsCount} - 1`,
          updatedAt: new Date()
        })
        .where(eq(users.id, ad.userId));
    }
    
    return !!ad;
  }

  // Site settings operations
  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string, type: string = "text"): Promise<SiteSetting> {
    const [setting] = await db
      .insert(siteSettings)
      .values({ key, value, type })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value,
          type,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return await db
      .select()
      .from(siteSettings)
      .orderBy(siteSettings.key);
  }

  // Notifications operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: string, userId: string): Promise<boolean> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return !!notification;
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const [notification] = await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return !!notification;
  }

  // Expired ads cleanup methods
  async getExpiredAds(): Promise<Ad[]> {
    return await db
      .select()
      .from(ads)
      .where(and(
        eq(ads.active, true),
        sql`${ads.expiresAt} < NOW()`
      ));
  }

  async decrementUserAdsCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        activeAdsCount: sql`GREATEST(0, ${users.activeAdsCount} - 1)`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Boost promotion operations
  async getBoostPromotions(): Promise<BoostPromotion[]> {
    return await db
      .select()
      .from(boostPromotions)
      .where(eq(boostPromotions.active, true))
      .orderBy(boostPromotions.price);
  }

  async getBoostPromotion(id: string): Promise<BoostPromotion | undefined> {
    const [promotion] = await db
      .select()
      .from(boostPromotions)
      .where(eq(boostPromotions.id, id));
    return promotion;
  }

  async createBoostPromotion(promotionData: InsertBoostPromotion): Promise<BoostPromotion> {
    const [promotion] = await db
      .insert(boostPromotions)
      .values(promotionData)
      .returning();
    return promotion;
  }

  async updateBoostPromotion(id: string, promotionData: Partial<InsertBoostPromotion>): Promise<BoostPromotion | undefined> {
    const [promotion] = await db
      .update(boostPromotions)
      .set({ ...promotionData, updatedAt: new Date() })
      .where(eq(boostPromotions.id, id))
      .returning();
    return promotion;
  }

  async deleteBoostPromotion(id: string): Promise<boolean> {
    const [promotion] = await db
      .delete(boostPromotions)
      .where(eq(boostPromotions.id, id))
      .returning();
    return !!promotion;
  }

  // Boosted ads operations
  async createBoostedAd(boostedAdData: InsertBoostedAd): Promise<BoostedAd> {
    const [boostedAd] = await db
      .insert(boostedAds)
      .values(boostedAdData)
      .returning();
    return boostedAd;
  }

  async getBoostedAd(id: string): Promise<BoostedAdWithDetails | undefined> {
    const [result] = await db
      .select({
        id: boostedAds.id,
        adId: boostedAds.adId,
        promotionId: boostedAds.promotionId,
        paymentId: boostedAds.paymentId,
        paymentStatus: boostedAds.paymentStatus,
        paymentMethod: boostedAds.paymentMethod,
        amount: boostedAds.amount,
        payerName: boostedAds.payerName,
        payerLastName: boostedAds.payerLastName,
        payerCpf: boostedAds.payerCpf,
        payerEmail: boostedAds.payerEmail,
        payerPhone: boostedAds.payerPhone,
        startDate: boostedAds.startDate,
        endDate: boostedAds.endDate,
        active: boostedAds.active,
        createdAt: boostedAds.createdAt,
        updatedAt: boostedAds.updatedAt,
        promotion: {
          id: boostPromotions.id,
          name: boostPromotions.name,
          price: boostPromotions.price,
          durationDays: boostPromotions.durationDays,
          description: boostPromotions.description,
          active: boostPromotions.active,
          createdAt: boostPromotions.createdAt,
          updatedAt: boostPromotions.updatedAt,
        },
        ad: {
          id: ads.id,
          title: ads.title,
          description: ads.description,
          price: ads.price,
          imageUrl: ads.imageUrl,
          categoryId: ads.categoryId,
          location: ads.location,
          whatsapp: ads.whatsapp,
          userId: ads.userId,
          featured: ads.featured,
          active: ads.active,
          views: ads.views,
          expiresAt: ads.expiresAt,
          createdAt: ads.createdAt,
          updatedAt: ads.updatedAt,
          user: {
            id: users.id,
            username: users.username,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            whatsapp: users.whatsapp,
            active: users.active,
            activeAdsCount: users.activeAdsCount,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          },
          category: {
            id: categories.id,
            name: categories.name,
            icon: categories.icon,
            createdAt: categories.createdAt,
          },
        },
      })
      .from(boostedAds)
      .leftJoin(boostPromotions, eq(boostedAds.promotionId, boostPromotions.id))
      .leftJoin(ads, eq(boostedAds.adId, ads.id))
      .leftJoin(users, eq(ads.userId, users.id))
      .leftJoin(categories, eq(ads.categoryId, categories.id))
      .where(eq(boostedAds.id, id));

    return result as BoostedAdWithDetails | undefined;
  }

  async updateBoostedAd(id: string, updateData: Partial<BoostedAd>): Promise<BoostedAd | undefined> {
    const [boostedAd] = await db
      .update(boostedAds)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(boostedAds.id, id))
      .returning();
    return boostedAd;
  }

  async updateBoostedAdPaymentStatus(paymentId: string, status: string, startDate?: Date): Promise<BoostedAd | undefined> {
    const updateData: any = { 
      paymentStatus: status, 
      updatedAt: new Date() 
    };
    
    if (status === 'paid' && startDate) {
      updateData.active = true;
      updateData.startDate = startDate;
      
      // Calculate end date based on promotion duration
      const [boostedAd] = await db
        .select({ promotionId: boostedAds.promotionId })
        .from(boostedAds)
        .where(eq(boostedAds.paymentId, paymentId));
      
      if (boostedAd) {
        const [promotion] = await db
          .select({ durationDays: boostPromotions.durationDays })
          .from(boostPromotions)
          .where(eq(boostPromotions.id, boostedAd.promotionId));
        
        if (promotion) {
          const durationMs = parseInt(promotion.durationDays) * 24 * 60 * 60 * 1000;
          updateData.endDate = new Date(startDate.getTime() + durationMs);
        }
      }
    }
    
    const [updatedBoostedAd] = await db
      .update(boostedAds)
      .set(updateData)
      .where(eq(boostedAds.paymentId, paymentId))
      .returning();
    
    return updatedBoostedAd;
  }

  async getActiveBoostedAds(): Promise<AdWithDetails[]> {
    const result = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        price: ads.price,
        imageUrl: ads.imageUrl,
        categoryId: ads.categoryId,
        location: ads.location,
        whatsapp: ads.whatsapp,
        userId: ads.userId,
        featured: ads.featured,
        active: ads.active,
        views: ads.views,
        expiresAt: ads.expiresAt,
        createdAt: ads.createdAt,
        updatedAt: ads.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          whatsapp: users.whatsapp,
          active: users.active,
          activeAdsCount: users.activeAdsCount,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          createdAt: categories.createdAt,
        },
        isPromoted: sql<boolean>`TRUE`,
        promotionEndDate: boostedAds.endDate,
      })
      .from(boostedAds)
      .innerJoin(ads, eq(boostedAds.adId, ads.id))
      .leftJoin(users, eq(ads.userId, users.id))
      .leftJoin(categories, eq(ads.categoryId, categories.id))
      .where(and(
        eq(boostedAds.active, true),
        eq(boostedAds.paymentStatus, 'paid'),
        sql`${boostedAds.endDate} > NOW()`
      ))
      .orderBy(desc(boostedAds.startDate));

    return result as AdWithDetails[];
  }

  async getAllBoostedAds(): Promise<BoostedAdWithDetails[]> {
    const result = await db
      .select({
        id: boostedAds.id,
        adId: boostedAds.adId,
        promotionId: boostedAds.promotionId,
        paymentId: boostedAds.paymentId,
        paymentStatus: boostedAds.paymentStatus,
        paymentMethod: boostedAds.paymentMethod,
        amount: boostedAds.amount,
        payerName: boostedAds.payerName,
        payerLastName: boostedAds.payerLastName,
        payerCpf: boostedAds.payerCpf,
        payerEmail: boostedAds.payerEmail,
        payerPhone: boostedAds.payerPhone,
        startDate: boostedAds.startDate,
        endDate: boostedAds.endDate,
        active: boostedAds.active,
        createdAt: boostedAds.createdAt,
        updatedAt: boostedAds.updatedAt,
        promotion: {
          id: boostPromotions.id,
          name: boostPromotions.name,
          price: boostPromotions.price,
          durationDays: boostPromotions.durationDays,
          description: boostPromotions.description,
          active: boostPromotions.active,
          createdAt: boostPromotions.createdAt,
          updatedAt: boostPromotions.updatedAt,
        },
        ad: {
          id: ads.id,
          title: ads.title,
          description: ads.description,
          price: ads.price,
          imageUrl: ads.imageUrl,
          categoryId: ads.categoryId,
          location: ads.location,
          whatsapp: ads.whatsapp,
          userId: ads.userId,
          featured: ads.featured,
          active: ads.active,
          views: ads.views,
          expiresAt: ads.expiresAt,
          createdAt: ads.createdAt,
          updatedAt: ads.updatedAt,
          user: {
            id: users.id,
            username: users.username,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            whatsapp: users.whatsapp,
            active: users.active,
            activeAdsCount: users.activeAdsCount,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          },
          category: {
            id: categories.id,
            name: categories.name,
            icon: categories.icon,
            createdAt: categories.createdAt,
          },
        },
      })
      .from(boostedAds)
      .leftJoin(boostPromotions, eq(boostedAds.promotionId, boostPromotions.id))
      .leftJoin(ads, eq(boostedAds.adId, ads.id))
      .leftJoin(users, eq(ads.userId, users.id))
      .leftJoin(categories, eq(ads.categoryId, categories.id))
      .orderBy(desc(boostedAds.createdAt));

    return result as BoostedAdWithDetails[];
  }

  async expireOldBoostedAds(): Promise<void> {
    await db
      .update(boostedAds)
      .set({ 
        active: false, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(boostedAds.active, true),
        sql`${boostedAds.endDate} < NOW()`
      ));
  }
}

export const storage = new DatabaseStorage();
