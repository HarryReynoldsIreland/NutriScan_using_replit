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
      console.log(`Starting news fetch for ingredient: ${ingredientName} (ID: ${ingredientId})`);
      
      // Create simpler search queries that are more likely to return results
      const queries = [
        `${ingredientName} food health`,
        `${ingredientName} nutrition`,
        `${ingredientName} FDA`,
        `${ingredientName} study research`
      ];

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
      
      // If filtering left us with very few articles, fall back to less strict filtering
      let finalArticles = filteredArticles;
      if (filteredArticles.length < 5 && allArticles.length > 0) {
        console.log(`Only ${filteredArticles.length} filtered articles for ${ingredientName}, using broader results`);
        finalArticles = allArticles; // Use all articles if filtering is too strict
      }
      
      // Remove duplicates and limit to requested amount
      const uniqueArticles = this.removeDuplicates(finalArticles);
      return uniqueArticles.slice(0, limit);

    } catch (error) {
      console.error(`Error fetching news for ${ingredientName}:`, error);
      return [];
    }
  }

  private async fetchArticlesByQuery(query: string, ingredientId: number, limit: number): Promise<Omit<NewsArticle, 'id' | 'createdAt'>[]> {
    const url = `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&apiKey=${this.apiKey}`;
    
    console.log(`Fetching news for query: "${query}"`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`News API error: ${response.status} ${response.statusText}`);
      throw new Error(`News API error: ${response.status} ${response.statusText}`);
    }

    const data: NewsApiResponse = await response.json();
    console.log(`Got ${data.articles?.length || 0} articles for query: "${query}"`);
    
    if (data.status !== 'ok') {
      console.error('News API returned error:', data);
      return [];
    }
    
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
    const keywords = ingredientLower.split(' ').filter(word => word.length > 2); // Filter out small words
    
    return articles.filter(article => {
      const titleLower = article.title.toLowerCase();
      const summaryLower = article.summary.toLowerCase();
      const fullText = `${titleLower} ${summaryLower}`;
      
      // More lenient ingredient matching - at least one keyword must appear
      const hasIngredientMention = keywords.some(keyword => 
        fullText.includes(keyword)
      );
      
      // If the ingredient name is quoted in the search, it should appear
      if (!hasIngredientMention) {
        return false;
      }
      
      // Very broad food/health relevance check - at least one food-related term
      const foodHealthTerms = [
        'food', 'health', 'nutrition', 'diet', 'eating', 'ingredient', 'additive',
        'fda', 'study', 'research', 'safety', 'consumption', 'beverage', 'drink',
        'product', 'label', 'regulatory', 'medical', 'wellness', 'disease',
        'obesity', 'diabetes', 'heart', 'brain', 'body', 'effect', 'risk'
      ];
      
      const isFoodHealthRelated = foodHealthTerms.some(term => 
        fullText.includes(term)
      );
      
      return isFoodHealthRelated;
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