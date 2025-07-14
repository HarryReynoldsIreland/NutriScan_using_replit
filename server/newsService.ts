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
      // Create search queries for the ingredient
      const queries = [
        `"${ingredientName}" food health`,
        `"${ingredientName}" nutrition study`,
        `"${ingredientName}" FDA approval`,
        `"${ingredientName}" safety research`
      ];

      const allArticles: Omit<NewsArticle, 'id' | 'createdAt'>[] = [];

      // Fetch articles for each query to get diverse content
      for (const query of queries) {
        const articlesPerQuery = Math.ceil(limit / queries.length);
        const articles = await this.fetchArticlesByQuery(query, ingredientId, articlesPerQuery);
        allArticles.push(...articles);
        
        if (allArticles.length >= limit) break;
      }

      // Remove duplicates and limit to requested amount
      const uniqueArticles = this.removeDuplicates(allArticles);
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