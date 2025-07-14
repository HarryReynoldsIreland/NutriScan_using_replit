import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Badge } from "./badge";
import { Button } from "./button";
import { MessageSquare, BookOpen, Newspaper, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { setAuthHeader } from "@/lib/auth";

interface IngredientTabsProps {
  ingredient: {
    id: number;
    name: string;
    category?: string;
    riskLevel?: string;
    allergens?: string[];
    description?: string;
  };
  currentUser?: any;
}

export function IngredientTabs({ ingredient, currentUser }: IngredientTabsProps) {
  const [newDiscussion, setNewDiscussion] = useState("");
  const [newComment, setNewComment] = useState("");
  const [selectedDiscussion, setSelectedDiscussion] = useState<number | null>(null);

  // Don't render if ingredient is not available
  if (!ingredient || !ingredient.id) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">Loading ingredient data...</div>
        </CardContent>
      </Card>
    );
  }

  // Fetch research studies
  const { data: studies = [], isLoading: studiesLoading } = useQuery({
    queryKey: ['/api/ingredients', ingredient.id, 'research'],
    queryFn: async () => {
      const response = await fetch(`/api/research/ingredient/${ingredient.id}`);
      if (!response.ok) throw new Error('Failed to fetch research');
      return response.json();
    },
  });

  // Fetch news articles
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['/api/ingredients', ingredient.id, 'news'],
    queryFn: async () => {
      const response = await fetch(`/api/news/ingredient/${ingredient.id}`);
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    },
  });

  // Fetch discussions
  const { data: discussions = [], isLoading: discussionsLoading } = useQuery({
    queryKey: ['/api/ingredients', ingredient.id, 'discussions'],
    queryFn: async () => {
      const response = await fetch(`/api/discussions/ingredient/${ingredient.id}`);
      if (!response.ok) throw new Error('Failed to fetch discussions');
      return response.json();
    },
  });

  // Fetch comments for selected discussion
  const { data: comments = [] } = useQuery({
    queryKey: ['/api/comments/discussion', selectedDiscussion],
    queryFn: () => selectedDiscussion ? 
      apiRequest(`/api/comments/discussion/${selectedDiscussion}`).then(r => r.json()) : 
      Promise.resolve([]),
    enabled: !!selectedDiscussion,
  });

  // Create discussion mutation
  const createDiscussion = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: setAuthHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          ingredientId: ingredient.id,
          title: content.substring(0, 100),
          content,
        }),
      });
      if (!response.ok) throw new Error('Failed to create discussion');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients', ingredient.id, 'discussions'] });
      setNewDiscussion("");
    },
  });

  // Create comment mutation
  const createComment = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: setAuthHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          discussionId: selectedDiscussion,
          content,
        }),
      });
      if (!response.ok) throw new Error('Failed to create comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments/discussion', selectedDiscussion] });
      setNewComment("");
    },
  });

  const getRiskColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{ingredient.name}</h2>
            {ingredient.category && (
              <Badge variant="secondary" className="mt-2">{ingredient.category}</Badge>
            )}
          </div>
          {ingredient.riskLevel && (
            <Badge variant={getRiskColor(ingredient.riskLevel)}>
              Risk: {ingredient.riskLevel}
            </Badge>
          )}
        </CardTitle>
        {ingredient.description && (
          <p className="text-muted-foreground">{ingredient.description}</p>
        )}
        {ingredient.allergens && ingredient.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {ingredient.allergens.map((allergen, idx) => (
              <Badge key={idx} variant="destructive" className="text-xs">
                {allergen}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="research" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="research" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Research
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              News
            </TabsTrigger>
            <TabsTrigger value="discussion" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Discussion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="research" className="space-y-4 mt-4">
            <div className="space-y-4">
              {studiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : studies.length > 0 ? (
                studies.map((study: any, idx: number) => (
                  <Card key={idx}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{study.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {study.authors} • {study.source} • {new Date(study.publishedDate).getFullYear()}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-2">{study.abstract}</p>
                      {study.url && (
                        <a 
                          href={study.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline"
                        >
                          Read full study →
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No research studies available for this ingredient yet.</p>
                  <p className="text-sm mt-2">Scientific research data will appear here as it becomes available.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-4 mt-4">
            <div className="space-y-4">
              {articlesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : articles.length > 0 ? (
                articles.map((article: any, idx: number) => (
                  <Card key={idx}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {article.source} • {new Date(article.publishedDate).toLocaleDateString()}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-2">{article.summary}</p>
                      {article.url && (
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline"
                        >
                          Read full article →
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent news about this ingredient.</p>
                  <p className="text-sm mt-2">News articles and updates will appear here.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="discussion" className="space-y-4 mt-4">
            {!selectedDiscussion ? (
              <div className="space-y-4">
                {/* Create new discussion */}
                {currentUser && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Start a Discussion</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <textarea
                        value={newDiscussion}
                        onChange={(e) => setNewDiscussion(e.target.value)}
                        placeholder="Share your thoughts about this ingredient..."
                        className="w-full p-3 border rounded-md resize-none"
                        rows={3}
                      />
                      <Button 
                        onClick={() => createDiscussion.mutate(newDiscussion)}
                        disabled={!newDiscussion.trim() || createDiscussion.isPending}
                        className="w-full"
                      >
                        {createDiscussion.isPending ? 'Posting...' : 'Start Discussion'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Existing discussions */}
                {discussionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : discussions.length > 0 ? (
                  discussions.map((discussion: any) => (
                    <Card key={discussion.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedDiscussion(discussion.id)}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{discussion.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          by {discussion.username || 'Anonymous'} • {new Date(discussion.createdAt).toLocaleDateString()}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3">{discussion.content}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {discussion.upvotes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="h-4 w-4" />
                            {discussion.downvotes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {discussion.commentCount || 0} replies
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No discussions yet.</p>
                    <p className="text-sm mt-2">Be the first to start a conversation about this ingredient!</p>
                  </div>
                )}
              </div>
            ) : (
              /* Discussion detail view */
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedDiscussion(null)}
                  className="mb-4"
                >
                  ← Back to Discussions
                </Button>
                
                {/* Discussion content */}
                {discussions.find((d: any) => d.id === selectedDiscussion) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{discussions.find((d: any) => d.id === selectedDiscussion)?.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        by {discussions.find((d: any) => d.id === selectedDiscussion)?.username || 'Anonymous'}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p>{discussions.find((d: any) => d.id === selectedDiscussion)?.content}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Comments */}
                <div className="space-y-3">
                  {comments.map((comment: any) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <p className="text-sm mb-2">{comment.content}</p>
                        <p className="text-xs text-muted-foreground">
                          by {comment.username || 'Anonymous'} • {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add comment */}
                {currentUser && (
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add your comment..."
                        className="w-full p-3 border rounded-md resize-none"
                        rows={3}
                      />
                      <Button 
                        onClick={() => createComment.mutate(newComment)}
                        disabled={!newComment.trim() || createComment.isPending}
                        className="w-full"
                      >
                        {createComment.isPending ? 'Posting...' : 'Add Comment'}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}