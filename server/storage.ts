import {
  users,
  ads,
  categories,
  favorites,
  adminUsers,
  siteSettings,
  type User,
  type UpsertUser,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
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
  createAd(ad: InsertAd, userId: string | null): Promise<Ad>;
  updateAd(id: string, ad: Partial<InsertAd>, userId: string): Promise<Ad | undefined>;
  deleteAd(id: string, userId: string): Promise<boolean>;
  
  // Favorites operations
  getFavorites(userId: string): Promise<AdWithDetails[]>;
  addToFavorites(adId: string, userId: string): Promise<Favorite>;
  removeFromFavorites(adId: string, userId: string): Promise<boolean>;
  isAdFavorited(adId: string, userId: string): Promise<boolean>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
      conditions.push(
        or(
          ilike(ads.title, `%${search}%`),
          ilike(ads.description, `%${search}%`)
        )
      );
    }

    if (featured !== undefined) {
      conditions.push(eq(ads.featured, featured));
    }

    if (userId) {
      conditions.push(eq(ads.userId, userId));
    }

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

    return result as AdWithDetails[];
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

    return result as AdWithDetails | undefined;
  }

  async createAd(ad: InsertAd, userId: string | null): Promise<Ad> {
    const [newAd] = await db
      .insert(ads)
      .values({
        ...ad,
        userId,
        price: ad.price.toString(),
      })
      .returning();
    return newAd;
  }

  async updateAd(id: string, ad: Partial<InsertAd>, userId: string): Promise<Ad | undefined> {
    const [updatedAd] = await db
      .update(ads)
      .set({
        ...ad,
        updatedAt: new Date(),
      })
      .where(and(eq(ads.id, id), eq(ads.userId, userId)))
      .returning();
    return updatedAd;
  }

  async deleteAd(id: string, userId: string): Promise<boolean> {
    const [deletedAd] = await db
      .update(ads)
      .set({ active: false, updatedAt: new Date() })
      .where(and(eq(ads.id, id), eq(ads.userId, userId)))
      .returning();
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
    const [ad] = await db
      .delete(ads)
      .where(eq(ads.id, adId))
      .returning();
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
}

export const storage = new DatabaseStorage();
