import { 
  users, products, ingredients, discussions, comments, votes, bookmarks, 
  researchStudies, newsArticles, moderationFlags, userActivity,
  type User, type InsertUser, type Product, type InsertProduct,
  type Ingredient, type InsertIngredient, type Discussion, type InsertDiscussion,
  type Comment, type InsertComment, type Vote, type InsertVote,
  type Bookmark, type InsertBookmark, type ResearchStudy, type NewsArticle,
  type ModerationFlag, type InsertModerationFlag, type UserActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, sql, count } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserReputation(userId: number, change: number): Promise<void>;

  // Product management
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;

  // Ingredient management
  getIngredient(id: number): Promise<Ingredient | undefined>;
  getIngredientByName(name: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient>;
  getTrendingIngredients(limit: number): Promise<Ingredient[]>;

  // Discussion management
  getDiscussion(id: number): Promise<Discussion | undefined>;
  getDiscussionsByIngredient(ingredientId: number): Promise<Discussion[]>;
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  updateDiscussion(id: number, discussion: Partial<InsertDiscussion>): Promise<Discussion>;
  voteOnDiscussion(discussionId: number, userId: number, voteType: 'upvote' | 'downvote'): Promise<void>;

  // Comment management
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByDiscussion(discussionId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment>;
  voteOnComment(commentId: number, userId: number, voteType: 'upvote' | 'downvote'): Promise<void>;

  // Bookmark management
  getBookmarksByUser(userId: number): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: number, ingredientId?: number, productId?: number): Promise<void>;

  // Research and news
  getResearchStudiesByIngredient(ingredientId: number): Promise<ResearchStudy[]>;
  getNewsArticlesByIngredient(ingredientId: number): Promise<NewsArticle[]>;
  createResearchStudy(study: Omit<ResearchStudy, 'id' | 'createdAt'>): Promise<ResearchStudy>;
  createNewsArticle(article: Omit<NewsArticle, 'id' | 'createdAt'>): Promise<NewsArticle>;

  // Moderation
  createModerationFlag(flag: InsertModerationFlag): Promise<ModerationFlag>;
  getModerationFlags(): Promise<ModerationFlag[]>;
  getUserActivity(userId: number): Promise<UserActivity[]>;
  createUserActivity(activity: Omit<UserActivity, 'id' | 'createdAt'>): Promise<UserActivity>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserReputation(userId: number, change: number): Promise<void> {
    await db
      .update(users)
      .set({ reputation: sql`${users.reputation} + ${change}` })
      .where(eq(users.id, userId));
  }

  // Product management
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product || undefined;
  }

  async createProduct(insertProduct: any): Promise<Product> {
    const [product] = await db.insert(products).values([insertProduct]).returning();
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set(productUpdate as any)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  // Ingredient management
  async getIngredient(id: number): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, id));
    return ingredient || undefined;
  }

  async getIngredientByName(name: string): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.name, name));
    return ingredient || undefined;
  }

  async createIngredient(insertIngredient: InsertIngredient): Promise<Ingredient> {
    const [ingredient] = await db.insert(ingredients).values(insertIngredient).returning();
    return ingredient;
  }

  async updateIngredient(id: number, ingredientUpdate: Partial<InsertIngredient>): Promise<Ingredient> {
    const [ingredient] = await db
      .update(ingredients)
      .set(ingredientUpdate)
      .where(eq(ingredients.id, id))
      .returning();
    return ingredient;
  }

  async getTrendingIngredients(limit: number): Promise<Ingredient[]> {
    return await db
      .select()
      .from(ingredients)
      .orderBy(desc(ingredients.discussionCount))
      .limit(limit);
  }

  // Discussion management
  async getDiscussion(id: number): Promise<Discussion | undefined> {
    const [discussion] = await db.select().from(discussions).where(eq(discussions.id, id));
    return discussion || undefined;
  }

  async getDiscussionsByIngredient(ingredientId: number): Promise<Discussion[]> {
    return await db
      .select()
      .from(discussions)
      .where(eq(discussions.ingredientId, ingredientId))
      .orderBy(desc(discussions.createdAt));
  }

  async createDiscussion(insertDiscussion: InsertDiscussion): Promise<Discussion> {
    const [discussion] = await db.insert(discussions).values(insertDiscussion).returning();
    return discussion;
  }

  async updateDiscussion(id: number, discussionUpdate: Partial<InsertDiscussion>): Promise<Discussion> {
    const [discussion] = await db
      .update(discussions)
      .set(discussionUpdate)
      .where(eq(discussions.id, id))
      .returning();
    return discussion;
  }

  async voteOnDiscussion(discussionId: number, userId: number, voteType: 'upvote' | 'downvote'): Promise<void> {
    // Check if user already voted
    const [existingVote] = await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.discussionId, discussionId),
        eq(votes.userId, userId)
      ));

    if (existingVote) {
      // Update existing vote
      await db
        .update(votes)
        .set({ voteType })
        .where(eq(votes.id, existingVote.id));
    } else {
      // Create new vote
      await db.insert(votes).values({
        userId,
        discussionId,
        voteType
      });
    }

    // Update discussion vote counts
    const upvoteCount = await db
      .select({ count: count() })
      .from(votes)
      .where(and(eq(votes.discussionId, discussionId), eq(votes.voteType, 'upvote')));
    
    const downvoteCount = await db
      .select({ count: count() })
      .from(votes)
      .where(and(eq(votes.discussionId, discussionId), eq(votes.voteType, 'downvote')));

    await db
      .update(discussions)
      .set({
        upvotes: upvoteCount[0].count,
        downvotes: downvoteCount[0].count
      })
      .where(eq(discussions.id, discussionId));
  }

  // Comment management
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment || undefined;
  }

  async getCommentsByDiscussion(discussionId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.discussionId, discussionId))
      .orderBy(asc(comments.createdAt));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async updateComment(id: number, commentUpdate: Partial<InsertComment>): Promise<Comment> {
    const [comment] = await db
      .update(comments)
      .set(commentUpdate)
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }

  async voteOnComment(commentId: number, userId: number, voteType: 'upvote' | 'downvote'): Promise<void> {
    // Check if user already voted
    const [existingVote] = await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.commentId, commentId),
        eq(votes.userId, userId)
      ));

    if (existingVote) {
      // Update existing vote
      await db
        .update(votes)
        .set({ voteType })
        .where(eq(votes.id, existingVote.id));
    } else {
      // Create new vote
      await db.insert(votes).values({
        userId,
        commentId,
        voteType
      });
    }

    // Update comment vote counts
    const upvoteCount = await db
      .select({ count: count() })
      .from(votes)
      .where(and(eq(votes.commentId, commentId), eq(votes.voteType, 'upvote')));
    
    const downvoteCount = await db
      .select({ count: count() })
      .from(votes)
      .where(and(eq(votes.commentId, commentId), eq(votes.voteType, 'downvote')));

    await db
      .update(comments)
      .set({
        upvotes: upvoteCount[0].count,
        downvotes: downvoteCount[0].count
      })
      .where(eq(comments.id, commentId));
  }

  // Bookmark management
  async getBookmarksByUser(userId: number): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const [bookmark] = await db.insert(bookmarks).values(insertBookmark).returning();
    return bookmark;
  }

  async deleteBookmark(userId: number, ingredientId?: number, productId?: number): Promise<void> {
    const conditions = [eq(bookmarks.userId, userId)];
    
    if (ingredientId) {
      conditions.push(eq(bookmarks.ingredientId, ingredientId));
    }
    
    if (productId) {
      conditions.push(eq(bookmarks.productId, productId));
    }

    await db.delete(bookmarks).where(and(...conditions));
  }

  // Research and news
  async getResearchStudiesByIngredient(ingredientId: number): Promise<ResearchStudy[]> {
    return await db
      .select()
      .from(researchStudies)
      .where(eq(researchStudies.ingredientId, ingredientId))
      .orderBy(desc(researchStudies.createdAt));
  }

  async getNewsArticlesByIngredient(ingredientId: number): Promise<NewsArticle[]> {
    return await db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.ingredientId, ingredientId))
      .orderBy(desc(newsArticles.createdAt));
  }

  async createResearchStudy(study: Omit<ResearchStudy, 'id' | 'createdAt'>): Promise<ResearchStudy> {
    const [researchStudy] = await db.insert(researchStudies).values(study).returning();
    return researchStudy;
  }

  async createNewsArticle(article: Omit<NewsArticle, 'id' | 'createdAt'>): Promise<NewsArticle> {
    const [newsArticle] = await db.insert(newsArticles).values(article).returning();
    return newsArticle;
  }

  // Moderation
  async createModerationFlag(insertFlag: InsertModerationFlag): Promise<ModerationFlag> {
    const [flag] = await db.insert(moderationFlags).values(insertFlag).returning();
    return flag;
  }

  async getModerationFlags(): Promise<ModerationFlag[]> {
    return await db
      .select()
      .from(moderationFlags)
      .orderBy(desc(moderationFlags.createdAt));
  }

  async getUserActivity(userId: number): Promise<UserActivity[]> {
    return await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.createdAt));
  }

  async createUserActivity(activity: Omit<UserActivity, 'id' | 'createdAt'>): Promise<UserActivity> {
    const [userActivityRecord] = await db.insert(userActivity).values(activity).returning();
    return userActivityRecord;
  }
}

export const storage = new DatabaseStorage();