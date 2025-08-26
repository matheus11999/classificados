import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for session management
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  whatsapp: varchar("whatsapp"),
  cpf: varchar("cpf", { length: 11 }),
  active: boolean("active").default(true),
  activeAdsCount: decimal("active_ads_count").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ads = pgTable("ads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url"),
  categoryId: uuid("category_id").references(() => categories.id),
  location: varchar("location", { length: 200 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  views: decimal("views").default("0"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  adId: uuid("ad_id").references(() => ads.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: varchar("role").default("admin"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site settings table
export const siteSettings = pgTable("site_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").unique().notNull(),
  value: text("value").notNull(),
  type: varchar("type").default("text"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").default("info"),
  read: boolean("read").default(false),
  adId: uuid("ad_id").references(() => ads.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Boost promotions table - configura preços e duração dos impulsos
export const boostPromotions = pgTable("boost_promotions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Impulso Básico", "Impulso Premium"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  durationDays: decimal("duration_days").default("5"), // 5 dias por padrão
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Boosted ads table - anúncios que foram impulsionados
export const boostedAds = pgTable("boosted_ads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: uuid("ad_id").references(() => ads.id).notNull(),
  promotionId: uuid("promotion_id").references(() => boostPromotions.id).notNull(),
  paymentId: varchar("payment_id"), // ID do pagamento no Mercado Pago
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, failed
  paymentMethod: varchar("payment_method").default("pix"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  
  // Dados do pagador
  payerName: varchar("payer_name").notNull(),
  payerLastName: varchar("payer_last_name").notNull(),
  payerCpf: varchar("payer_cpf").notNull(),
  payerEmail: varchar("payer_email"),
  payerPhone: varchar("payer_phone"),
  
  // Controle de tempo
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  active: boolean("active").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ads: many(ads),
  favorites: many(favorites),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  ads: many(ads),
}));

export const adsRelations = relations(ads, ({ one, many }) => ({
  user: one(users, {
    fields: [ads.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [ads.categoryId],
    references: [categories.id],
  }),
  favorites: many(favorites),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  ad: one(ads, {
    fields: [favorites.adId],
    references: [ads.id],
  }),
}));

export const boostPromotionsRelations = relations(boostPromotions, ({ many }) => ({
  boostedAds: many(boostedAds),
}));

export const boostedAdsRelations = relations(boostedAds, ({ one }) => ({
  ad: one(ads, {
    fields: [boostedAds.adId],
    references: [ads.id],
  }),
  promotion: one(boostPromotions, {
    fields: [boostedAds.promotionId],
    references: [boostPromotions.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  activeAdsCount: true,
  active: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const registerUserSchema = z.object({
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertAdSchema = createInsertSchema(ads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  featured: true,
  active: true,
  views: true,
  expiresAt: true,
}).extend({
  price: z.string().min(1, "Preço é obrigatório"),
  userId: z.string().min(1, "Usuário é obrigatório"),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export const insertBoostPromotionSchema = createInsertSchema(boostPromotions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBoostedAdSchema = createInsertSchema(boostedAds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startDate: true,
  endDate: true,
  active: true,
}).extend({
  payerCpf: z.string().length(11, "CPF deve ter 11 dígitos"),
  payerName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  payerLastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Ad = typeof ads.$inferSelect;
export type InsertAd = z.infer<typeof insertAdSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type BoostPromotion = typeof boostPromotions.$inferSelect;
export type InsertBoostPromotion = z.infer<typeof insertBoostPromotionSchema>;

export type BoostedAd = typeof boostedAds.$inferSelect;
export type InsertBoostedAd = z.infer<typeof insertBoostedAdSchema>;

// Extended types with relations
export type AdWithDetails = Ad & {
  user: User;
  category: Category | null;
  isFavorited?: boolean;
  favoritesCount?: number;
  isPromoted?: boolean;
  promotionEndDate?: Date;
};

export type BoostedAdWithDetails = BoostedAd & {
  ad: AdWithDetails;
  promotion: BoostPromotion;
};
