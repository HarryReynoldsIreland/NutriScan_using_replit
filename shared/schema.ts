import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  firebaseUid: text("firebase_uid").unique(),
  reputation: integer("reputation").default(0),
  isAnonymous: boolean("is_anonymous").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  barcode: text("barcode").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand"),
  imageUrl: text("image_url"),
  nutriScore: text("nutri_score"),
  ingredients: jsonb("ingredients").$type<Array<{
    name: string;
    percentage?: number;
    category?: string;
    allergens?: string[];
  }>>(),
  nutritionData: jsonb("nutrition_data").$type<Record<string, any>>(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category"),
  riskLevel: text("risk_level"), // low, medium, high
  allergenInfo: text("allergen_info"),
  commonUses: text("common_uses").array(),
  aliases: text("aliases").array(),
  lastResearchUpdate: timestamp("last_research_update"),
  discussionCount: integer("discussion_count").default(0),
});

export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  commentCount: integer("comment_count").default(0),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").references(() => discussions.id),
  userId: integer("user_id").references(() => users.id),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  discussionId: integer("discussion_id").references(() => discussions.id),
  commentId: integer("comment_id").references(() => comments.id),
  voteType: text("vote_type").notNull(), // upvote, downvote
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  productId: integer("product_id").references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const researchStudies = pgTable("research_studies", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  title: text("title").notNull(),
  authors: text("authors"),
  abstract: text("abstract"),
  url: text("url"),
  publishedDate: text("published_date"),
  source: text("source"), // pubmed, semantic_scholar
  citationCount: integer("citation_count"),
  aiSummary: text("ai_summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  title: text("title").notNull(),
  summary: text("summary"),
  url: text("url"),
  source: text("source"),
  imageUrl: text("image_url"),
  publishedDate: text("published_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moderationFlags = pgTable("moderation_flags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  discussionId: integer("discussion_id").references(() => discussions.id),
  commentId: integer("comment_id").references(() => comments.id),
  reason: text("reason").notNull(),
  status: text("status").default("pending"), // pending, resolved, dismissed
  createdAt: timestamp("created_at").defaultNow(),
});

export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // post_created, comment_created, vote_cast
  targetId: integer("target_id"),
  targetType: text("target_type"), // discussion, comment
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  firebaseUid: true,
  isAnonymous: true,
  reputation: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  barcode: true,
  name: true,
  brand: true,
  imageUrl: true,
  nutriScore: true,
  ingredients: true,
  nutritionData: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).pick({
  name: true,
  description: true,
  category: true,
  riskLevel: true,
  allergenInfo: true,
  commonUses: true,
  aliases: true,
});

export const insertDiscussionSchema = createInsertSchema(discussions).pick({
  ingredientId: true,
  userId: true,
  title: true,
  content: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  discussionId: true,
  userId: true,
  parentId: true,
  content: true,
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  userId: true,
  discussionId: true,
  commentId: true,
  voteType: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  userId: true,
  ingredientId: true,
  productId: true,
});

export const insertModerationFlagSchema = createInsertSchema(moderationFlags).pick({
  userId: true,
  discussionId: true,
  commentId: true,
  reason: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Discussion = typeof discussions.$inferSelect;
export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type ResearchStudy = typeof researchStudies.$inferSelect;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type ModerationFlag = typeof moderationFlags.$inferSelect;
export type InsertModerationFlag = z.infer<typeof insertModerationFlagSchema>;
export type UserActivity = typeof userActivity.$inferSelect;
