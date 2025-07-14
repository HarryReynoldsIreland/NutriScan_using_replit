import { Router } from "express";
import { createServer, type Server } from "http";
import type { Express } from "express";
import { 
  insertUserSchema, insertProductSchema, insertIngredientSchema, 
  insertDiscussionSchema, insertCommentSchema, insertBookmarkSchema,
  insertModerationFlagSchema 
} from "@shared/schema";
import { storage } from "./storage";
import { newsService } from "./newsService";

// Simple user tracking for now (in production use proper sessions)
const users = new Map<string, number>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  (app as any).server = httpServer;

  // Helper to get current user (simplified for now)
  const getCurrentUserId = (req: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return token ? users.get(token) : undefined;
  };

  // Authentication routes
  app.post('/api/auth/anonymous', async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }
      
      const user = await storage.createUser({
        username,
        isAnonymous: true,
        reputation: 0,
        email: null,
        firebaseUid: null
      });
      
      // Generate simple token
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      users.set(token, user.id);
      
      res.json({ user, token });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Product routes
  app.get('/api/products/barcode/:barcode', async (req, res) => {
    try {
      let product = await storage.getProductByBarcode(req.params.barcode);
      
      if (!product) {
        // Create a basic product for testing
        const productData = {
          barcode: req.params.barcode,
          name: 'Sample Product',
          brand: 'Sample Brand',
          imageUrl: null,
          nutriScore: null,
          ingredients: [
            { name: 'Water', percentage: 50, category: 'liquid', allergens: [] },
            { name: 'Sugar', percentage: 30, category: 'sweetener', allergens: [] },
            { name: 'Natural Flavoring', percentage: 20, category: 'flavoring', allergens: [] }
          ],
          nutritionData: null
        };
        
        product = await storage.createProduct(productData);
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Ingredient routes
  app.post('/api/ingredients', async (req, res) => {
    try {
      const ingredientData = insertIngredientSchema.parse(req.body);
      const ingredient = await storage.createIngredient(ingredientData);
      res.json(ingredient);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/ingredients/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const ingredients = await storage.getTrendingIngredients(limit);
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/ingredients/name/:name', async (req, res) => {
    try {
      const ingredient = await storage.getIngredientByName(req.params.name);
      if (!ingredient) {
        return res.status(404).json({ error: 'Ingredient not found' });
      }
      res.json(ingredient);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/ingredients/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ingredient = await storage.getIngredient(id);
      if (!ingredient) {
        return res.status(404).json({ error: 'Ingredient not found' });
      }
      res.json(ingredient);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Discussion routes
  app.post('/api/discussions', async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const discussionData = insertDiscussionSchema.parse({
        ...req.body,
        userId
      });
      
      const discussion = await storage.createDiscussion(discussionData);
      res.json(discussion);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/discussions/ingredient/:ingredientId', async (req, res) => {
    try {
      const discussions = await storage.getDiscussionsByIngredient(parseInt(req.params.ingredientId));
      res.json(discussions);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Comment routes
  app.post('/api/comments', async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId
      });
      
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/comments/discussion/:discussionId', async (req, res) => {
    try {
      const comments = await storage.getCommentsByDiscussion(parseInt(req.params.discussionId));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Bookmark routes
  app.get('/api/bookmarks', async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const bookmarks = await storage.getBookmarksByUser(userId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Research and news routes
  app.get('/api/research/ingredient/:ingredientId', async (req, res) => {
    try {
      const studies = await storage.getResearchStudiesByIngredient(parseInt(req.params.ingredientId));
      res.json(studies);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/news/ingredient/:ingredientId', async (req, res) => {
    try {
      const ingredientId = parseInt(req.params.ingredientId);
      
      // Get ingredient details to fetch news
      const ingredient = await storage.getIngredient(ingredientId);
      if (!ingredient) {
        return res.status(404).json({ error: 'Ingredient not found' });
      }

      // Fetch real news articles from Google News via News API
      const articles = await newsService.fetchNewsForIngredient(ingredient.name, ingredientId, 20);
      
      // Convert to our news article format
      const formattedArticles = articles.map(article => ({
        id: Math.floor(Math.random() * 1000000), // Temporary ID for client
        ingredientId: article.ingredientId,
        title: article.title,
        summary: article.summary,
        url: article.url,
        source: article.source,
        imageUrl: article.imageUrl,
        publishedDate: article.publishedDate,
        createdAt: new Date().toISOString()
      }));

      res.json(formattedArticles);
    } catch (error) {
      console.error('Error fetching news:', error);
      
      // Fallback to database articles if News API fails
      try {
        const articles = await storage.getNewsArticlesByIngredient(parseInt(req.params.ingredientId));
        res.json(articles);
      } catch (fallbackError) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Failed to fetch news articles' 
        });
      }
    }
  });

  return httpServer;
}