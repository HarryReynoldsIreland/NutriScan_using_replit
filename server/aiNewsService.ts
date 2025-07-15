import { NewsArticle } from '@shared/schema';
import OpenAI from 'openai';

interface GeneratedArticle {
  title: string;
  summary: string;
  category: string;
  source: string;
  date: string;
}

export class AINewsService {
  private openai: OpenAI;
  private cache: Map<string, {articles: Omit<NewsArticle, 'id' | 'createdAt'>[], timestamp: number}> = new Map();

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateNewsForIngredient(ingredientName: string, ingredientId: number, limit: number = 10): Promise<Omit<NewsArticle, 'id' | 'createdAt'>[]> {
    try {
      console.log(`Generating AI news articles for ingredient: ${ingredientName} (ID: ${ingredientId})`);
      
      // Check cache first
      const cacheKey = `${ingredientName}-${ingredientId}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 7200000) { // Cache for 2 hours
        console.log(`Using cached AI articles for ${ingredientName}`);
        return cached.articles.slice(0, limit);
      }

      const prompt = `You are a research assistant helping users find real, factual information about "${ingredientName}" as a food ingredient. Based on your knowledge of actual published research, FDA guidance, and legitimate health studies, provide ${limit} summaries of real findings about this ingredient.

Focus on citing actual:
1. Published scientific studies with real research findings
2. FDA statements and regulatory guidance that actually exists
3. Established nutritional facts from credible sources
4. Real industry developments and regulatory changes
5. Legitimate health organization recommendations

For each real finding, provide:
- A factual title describing the actual research/finding
- A summary of the real study results or regulatory guidance
- The actual source or type of organization that published it
- A realistic category

Format as JSON array:
[
  {
    "title": "Actual research finding or regulatory update",
    "summary": "Real summary of published findings...",
    "category": "Research",
    "source": "Journal/Organization name",
    "date": "2025-07-14"
  }
]

Only include information that reflects real, published research or official guidance about ${ingredientName}. If real research is limited, include fewer entries rather than fictional content.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a research librarian who summarizes only real, published research and official regulatory guidance. Never create fictional studies or fake news articles. Only provide information based on actual published research, FDA statements, or legitimate health organization guidelines that exist in your training data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      let generatedData;
      try {
        generatedData = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }

      // Handle both array and object responses
      const articles: GeneratedArticle[] = Array.isArray(generatedData) ? generatedData : generatedData.articles || [];

      const newsArticles: Omit<NewsArticle, 'id' | 'createdAt'>[] = articles.map(article => ({
        ingredientId,
        title: article.title,
        summary: article.summary,
        url: this.generateSearchUrl(article.title, ingredientName),
        source: article.source,
        imageUrl: null,
        publishedDate: article.date || new Date().toISOString().split('T')[0]
      }));

      // Cache the results
      this.cache.set(cacheKey, {articles: newsArticles, timestamp: Date.now()});
      
      console.log(`Generated ${newsArticles.length} AI articles for ${ingredientName}`);
      return newsArticles.slice(0, limit);

    } catch (error) {
      console.error(`Error generating AI news for ${ingredientName}:`, error);
      // Return fallback articles
      return this.generateFallbackArticles(ingredientName, ingredientId, limit);
    }
  }

  private generateSearchUrl(title: string, ingredientName: string): string {
    // Create search URL for finding the actual research or FDA guidance mentioned
    const searchQuery = `"${ingredientName}" ${title.split(' ').slice(0, 4).join(' ')} site:nih.gov OR site:fda.gov OR site:who.int OR site:pubmed.ncbi.nlm.nih.gov`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  }

  private generateFallbackArticles(ingredientName: string, ingredientId: number, limit: number): Omit<NewsArticle, 'id' | 'createdAt'>[] {
    const today = new Date().toISOString().split('T')[0];
    // Only provide links to search for real research, don't create fake articles
    const fallbackArticles = [
      {
        ingredientId,
        title: `Search for Current ${ingredientName} Research`,
        summary: `Find the latest peer-reviewed research studies about ${ingredientName} from medical and nutrition journals, including safety assessments and health impact studies.`,
        url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(ingredientName + ' safety health effects')}`,
        source: 'PubMed Database',
        imageUrl: null,
        publishedDate: today
      },
      {
        ingredientId,
        title: `FDA Guidance on ${ingredientName}`,
        summary: `Access official FDA regulatory information, safety assessments, and approved usage guidelines for ${ingredientName} in food products.`,
        url: `https://www.fda.gov/search/?query=${encodeURIComponent(ingredientName)}`,
        source: 'FDA Official Website',
        imageUrl: null,
        publishedDate: today
      },
      {
        ingredientId,
        title: `WHO Guidelines for ${ingredientName}`,
        summary: `Review World Health Organization recommendations and international safety standards for ${ingredientName} consumption and usage.`,
        url: `https://www.who.int/search?query=${encodeURIComponent(ingredientName)}`,
        source: 'World Health Organization',
        imageUrl: null,
        publishedDate: today
      }
    ];

    // Repeat and shuffle to meet limit
    const result = [];
    for (let i = 0; i < limit; i++) {
      result.push({...fallbackArticles[i % fallbackArticles.length]});
    }
    
    return result;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 5
      });
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenAI API test failed:', error);
      return false;
    }
  }
}

export const aiNewsService = new AINewsService();