import { Router } from "express";
import { createServer, type Server } from "http";
import type { Express } from "express";
import { 
  insertUserSchema, insertProductSchema, insertIngredientSchema, 
  insertDiscussionSchema, insertCommentSchema, insertBookmarkSchema,
  insertModerationFlagSchema 
} from "@shared/schema";
import { storage } from "./storage";

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

  app.get('/api/ingredients/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Return sample data for testing
      const sampleIngredients = [
        { id: 1, name: 'High Fructose Corn Syrup', category: 'sweetener', riskLevel: 'high', description: 'Artificial sweetener linked to health concerns' },
        { id: 2, name: 'Sodium Benzoate', category: 'preservative', riskLevel: 'medium', description: 'Common preservative with some safety concerns' },
        { id: 3, name: 'Natural Vanilla Extract', category: 'flavoring', riskLevel: 'low', description: 'Natural flavoring generally recognized as safe' }
      ];
      
      const ingredient = sampleIngredients.find(ing => ing.id === id);
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

  app.get('/api/ingredients/trending/:limit', async (req, res) => {
    try {
      const limit = parseInt(req.params.limit) || 10;
      // Return sample data for now
      const sampleIngredients = [
        { id: 1, name: 'High Fructose Corn Syrup', category: 'sweetener', riskLevel: 'high', description: 'Artificial sweetener linked to health concerns' },
        { id: 2, name: 'Sodium Benzoate', category: 'preservative', riskLevel: 'medium', description: 'Common preservative with some safety concerns' },
        { id: 3, name: 'Natural Vanilla Extract', category: 'flavoring', riskLevel: 'low', description: 'Natural flavoring generally recognized as safe' }
      ];
      res.json(sampleIngredients.slice(0, limit));
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
      const articles = await storage.getNewsArticlesByIngredient(parseInt(req.params.ingredientId));
      res.json(articles);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  return httpServer;
}