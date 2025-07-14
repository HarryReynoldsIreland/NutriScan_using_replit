import { NewsArticle } from "@shared/schema";

interface NewsApiArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

export class NewsService {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';

  constructor() {
    this.apiKey = process.env.NEWS_API_KEY!;
    if (!this.apiKey) {
      throw new Error('NEWS_API_KEY environment variable is required');
    }
  }

  async fetchNewsForIngredient(ingredientName: string, ingredientId: number, limit: number = 20): Promise<Omit<NewsArticle, 'id' | 'createdAt'>[]> {
    try {
      // Create very specific search queries for the ingredient
      const baseQueries = [
        `"${ingredientName}" food ingredient health effects`,
        `"${ingredientName}" FDA food additive`,
        `"${ingredientName}" nutrition label ingredient`,
        `"${ingredientName}" food safety study research`
      ];

      // Add ingredient-specific terms for better targeting
      const specificTerms = this.getIngredientSpecificTerms(ingredientName);
      const queries = specificTerms.length > 0 
        ? [...baseQueries, ...specificTerms.map(term => `"${ingredientName}" ${term}`)]
        : baseQueries;

      const allArticles: Omit<NewsArticle, 'id' | 'createdAt'>[] = [];

      // Fetch articles for each query to get diverse content
      for (const query of queries) {
        const articlesPerQuery = Math.ceil(limit / queries.length);
        const articles = await this.fetchArticlesByQuery(query, ingredientId, articlesPerQuery);
        allArticles.push(...articles);
        
        if (allArticles.length >= limit) break;
      }

      // Filter out generic articles and keep only ingredient-specific ones
      const filteredArticles = this.filterRelevantArticles(allArticles, ingredientName);
      
      // Remove duplicates and limit to requested amount
      const uniqueArticles = this.removeDuplicates(filteredArticles);
      return uniqueArticles.slice(0, limit);

    } catch (error) {
      console.error(`Error fetching news for ${ingredientName}:`, error);
      return [];
    }
  }

  private async fetchArticlesByQuery(query: string, ingredientId: number, limit: number): Promise<Omit<NewsArticle, 'id' | 'createdAt'>[]> {
    const url = `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&apiKey=${this.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`News API error: ${response.status} ${response.statusText}`);
    }

    const data: NewsApiResponse = await response.json();
    
    return data.articles
      .filter(article => article.title && article.description && article.url)
      .map(article => ({
        ingredientId,
        title: article.title,
        summary: article.description,
        url: article.url,
        source: article.source.name,
        imageUrl: article.urlToImage,
        publishedDate: article.publishedAt.split('T')[0], // Convert to YYYY-MM-DD
      }));
  }

  private filterRelevantArticles(articles: Omit<NewsArticle, 'id' | 'createdAt'>[], ingredientName: string): Omit<NewsArticle, 'id' | 'createdAt'>[] {
    const ingredientLower = ingredientName.toLowerCase();
    const keywords = ingredientLower.split(' ');
    
    return articles.filter(article => {
      const titleLower = article.title.toLowerCase();
      const summaryLower = article.summary.toLowerCase();
      
      // Article must mention the ingredient name or its key words
      return keywords.some(keyword => 
        titleLower.includes(keyword) || summaryLower.includes(keyword)
      ) && (
        // And must be food/health related
        titleLower.includes('food') || 
        titleLower.includes('health') || 
        titleLower.includes('nutrition') || 
        titleLower.includes('ingredient') || 
        titleLower.includes('fda') || 
        titleLower.includes('study') ||
        summaryLower.includes('food') || 
        summaryLower.includes('health') || 
        summaryLower.includes('nutrition') || 
        summaryLower.includes('ingredient') || 
        summaryLower.includes('fda') || 
        summaryLower.includes('study')
      );
    });
  }

  private getIngredientSpecificTerms(ingredientName: string): string[] {
    const name = ingredientName.toLowerCase();
    
    // Add specific search terms based on ingredient type
    if (name.includes('sugar') || name.includes('sweetener')) {
      return ['diabetes risk', 'obesity study', 'metabolic health'];
    }
    if (name.includes('caffeine')) {
      return ['sleep effects', 'heart health', 'energy drinks'];
    }
    if (name.includes('corn syrup') || name.includes('fructose')) {
      return ['obesity epidemic', 'beverage industry', 'sugar substitute'];
    }
    if (name.includes('preservative') || name.includes('benzoate')) {
      return ['food shelf life', 'chemical safety', 'natural alternatives'];
    }
    if (name.includes('artificial') || name.includes('synthetic')) {
      return ['natural vs artificial', 'chemical additives', 'clean label'];
    }
    
    return ['food processing', 'consumer health', 'dietary impact'];
  }

  private removeDuplicates(articles: Omit<NewsArticle, 'id' | 'createdAt'>[]): Omit<NewsArticle, 'id' | 'createdAt'>[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/top-headlines?country=us&pageSize=1&apiKey=${this.apiKey}`;
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      console.error('News API connection test failed:', error);
      return false;
    }
  }
}

export const newsService = new NewsService();