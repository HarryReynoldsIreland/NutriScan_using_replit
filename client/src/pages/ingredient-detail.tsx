import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/ui/mobile-header";
import { IngredientTabs } from "@/components/ui/ingredient-tabs";
import { DiscussionThread } from "@/components/ui/discussion-thread";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { wsClient } from "@/lib/websocket";
import { type Ingredient, type Discussion, type Comment, type ResearchStudy, type NewsArticle } from "@shared/schema";

interface IngredientDetailProps {
  currentUser?: any;
}

export default function IngredientDetail({ currentUser }: IngredientDetailProps) {
  const { id, name } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: ingredient, isLoading } = useQuery({
    queryKey: id ? ['/api/ingredients', id] : ['/api/ingredients/name', name],
    queryFn: async () => {
      const url = id ? `/api/ingredients/${id}` : `/api/ingredients/name/${name}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Ingredient not found');
      return response.json() as Promise<Ingredient>;
    },
  });

  const { data: discussions = [] } = useQuery({
    queryKey: ['/api/ingredients', ingredient?.id, 'discussions'],
    queryFn: async () => {
      const response = await fetch(`/api/ingredients/${ingredient?.id}/discussions`);
      if (!response.ok) throw new Error('Failed to fetch discussions');
      return response.json() as Promise<Discussion[]>;
    },
    enabled: !!ingredient?.id,
  });

  const { data: researchStudies = [] } = useQuery({
    queryKey: ['/api/ingredients', ingredient?.id, 'research'],
    queryFn: async () => {
      const response = await fetch(`/api/ingredients/${ingredient?.id}/research`);
      if (!response.ok) throw new Error('Failed to fetch research');
      return response.json() as Promise<ResearchStudy[]>;
    },
    enabled: !!ingredient?.id,
  });

  const { data: newsArticles = [] } = useQuery({
    queryKey: ['/api/ingredients', ingredient?.id, 'news'],
    queryFn: async () => {
      const response = await fetch(`/api/ingredients/${ingredient?.id}/news`);
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json() as Promise<NewsArticle[]>;
    },
    enabled: !!ingredient?.id,
  });

  const createDiscussionMutation = useMutation({
    mutationFn: async (data: { ingredientId: number; userId: number; title: string; content: string }) => {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create discussion');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients', ingredient?.id, 'discussions'] });
      setNewPostTitle("");
      setNewPostContent("");
      setIsModalOpen(false);
      toast({
        title: "Success",
        description: "Discussion created successfully",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { discussionId: number; userId: number; content: string; parentId?: number }) => {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients', ingredient?.id, 'discussions'] });
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (data: { discussionId?: number; commentId?: number; userId: number; voteType: 'upvote' | 'downvote' }) => {
      const url = data.discussionId ? `/api/discussions/${data.discussionId}/vote` : `/api/comments/${data.commentId}/vote`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.userId, voteType: data.voteType }),
      });
      if (!response.ok) throw new Error('Failed to vote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients', ingredient?.id, 'discussions'] });
    },
  });

  const flagMutation = useMutation({
    mutationFn: async (data: { discussionId?: number; commentId?: number; userId: number; reason: string }) => {
      const response = await fetch('/api/moderation/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to flag content');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Content flagged for moderation",
      });
    },
  });

  useEffect(() => {
    if (currentUser) {
      wsClient.authenticate(currentUser.id);
    }

    const handleNewDiscussion = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients', ingredient?.id, 'discussions'] });
    };

    const handleNewComment = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients', ingredient?.id, 'discussions'] });
    };

    wsClient.on('new_discussion', handleNewDiscussion);
    wsClient.on('new_comment', handleNewComment);

    return () => {
      wsClient.off('new_discussion', handleNewDiscussion);
      wsClient.off('new_comment', handleNewComment);
    };
  }, [currentUser, ingredient?.id, queryClient]);

  const handleBack = () => {
    setLocation("/");
  };

  const handleBookmark = () => {
    if (!currentUser || !ingredient) return;
    
    // TODO: Implement bookmark functionality
    console.log("Bookmark clicked");
  };

  const handleCreatePost = () => {
    if (!currentUser || !ingredient || !newPostTitle.trim() || !newPostContent.trim()) return;
    
    createDiscussionMutation.mutate({
      ingredientId: ingredient.id,
      userId: currentUser.id,
      title: newPostTitle,
      content: newPostContent,
    });
  };

  const handleVote = (discussionId: number, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) return;
    
    voteMutation.mutate({
      discussionId,
      userId: currentUser.id,
      voteType,
    });
  };

  const handleComment = (discussionId: number, content: string, parentId?: number) => {
    if (!currentUser) return;
    
    createCommentMutation.mutate({
      discussionId,
      userId: currentUser.id,
      content,
      parentId,
    });
  };

  const handleVoteComment = (commentId: number, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) return;
    
    voteMutation.mutate({
      commentId,
      userId: currentUser.id,
      voteType,
    });
  };

  const handleFlag = (discussionId?: number, commentId?: number, reason?: string) => {
    if (!currentUser) return;
    
    flagMutation.mutate({
      discussionId,
      commentId,
      userId: currentUser.id,
      reason: reason || "inappropriate",
    });
  };

  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelText = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return 'Safe';
      case 'medium': return 'Moderate';
      case 'high': return 'Controversial';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Loading..." showBackButton onBack={handleBack} />
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!ingredient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Ingredient Not Found" showBackButton onBack={handleBack} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600 mb-4">
                Ingredient not found or failed to load.
              </p>
              <Button onClick={handleBack} className="w-full">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Research Tab Content
  const researchContent = (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral mb-2">Recent Studies</h3>
        <p className="text-sm text-gray-600">Latest research from PubMed and Semantic Scholar</p>
      </div>
      
      <div className="space-y-4">
        {researchStudies.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>No research studies available for this ingredient yet.</p>
            </CardContent>
          </Card>
        ) : (
          researchStudies.map((study) => (
            <Card key={study.id} className="shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-medium text-neutral mb-2">{study.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{study.authors}</p>
                <p className="text-sm text-gray-700 mb-3">{study.abstract}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{study.publishedDate}</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => window.open(study.url, '_blank')}
                    className="text-secondary hover:underline p-0 h-auto"
                  >
                    Read Full Study
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  // News Tab Content
  const newsContent = (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral mb-2">Latest News</h3>
        <p className="text-sm text-gray-600">Current articles and updates</p>
      </div>
      
      <div className="space-y-4">
        {newsArticles.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>No news articles available for this ingredient yet.</p>
            </CardContent>
          </Card>
        ) : (
          newsArticles.map((article) => (
            <Card key={article.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <img 
                    src={article.imageUrl || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"} 
                    alt={article.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral mb-1">{article.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{article.source}</p>
                    <p className="text-sm text-gray-700 mb-2">{article.summary}</p>
                    <span className="text-xs text-gray-500">{article.publishedDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  // Discussion Tab Content
  const discussionContent = (
    <div>
      {/* Discussion Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-neutral">Community Discussion</h3>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-white hover:bg-green-600">
                <Plus className="h-4 w-4 mr-1" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>New Discussion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="What's your question or topic?"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Share your thoughts, questions, or experiences..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPostTitle.trim() || !newPostContent.trim() || createDiscussionMutation.isPending}
                    className="flex-1"
                  >
                    {createDiscussionMutation.isPending ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Sort Options */}
        <div className="flex space-x-4 text-sm">
          <button className="text-primary font-medium">Hot</button>
          <button className="text-gray-600 hover:text-primary">New</button>
          <button className="text-gray-600 hover:text-primary">Top</button>
        </div>
      </div>

      {/* Discussion Posts */}
      <div className="space-y-4 p-4">
        {discussions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p>No discussions yet. Be the first to start a conversation!</p>
            </CardContent>
          </Card>
        ) : (
          discussions.map((discussion) => (
            <DiscussionThread
              key={discussion.id}
              discussion={discussion}
              comments={[]} // TODO: Fetch comments for each discussion
              currentUserId={currentUser?.id}
              onVote={handleVote}
              onComment={handleComment}
              onVoteComment={handleVoteComment}
              onFlag={handleFlag}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader 
        title={ingredient.name} 
        showBackButton 
        showBookmark
        onBack={handleBack}
        onBookmark={handleBookmark}
      />
      
      <main className="pb-20">
        {/* Ingredient Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {ingredient.category || 'Unknown'}
            </span>
            <Badge 
              variant="secondary" 
              className={`text-xs ${getRiskLevelColor(ingredient.riskLevel)}`}
            >
              {getRiskLevelText(ingredient.riskLevel)}
            </Badge>
          </div>
          
          <p className="text-gray-600 text-sm">
            {ingredient.description || `Information about ${ingredient.name}`}
          </p>
        </div>

        {/* Tabs */}
        <IngredientTabs
          ingredientId={ingredient.id}
          researchContent={researchContent}
          newsContent={newsContent}
          discussionContent={discussionContent}
        />
      </main>
    </div>
  );
}
