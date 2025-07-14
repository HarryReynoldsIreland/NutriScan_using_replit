import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronRight, Package, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/ui/mobile-header";
import { type Bookmark, type Product, type Ingredient } from "@shared/schema";

interface BookmarksProps {
  currentUser?: any;
}

export default function Bookmarks({ currentUser }: BookmarksProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'products' | 'ingredients'>('products');

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['/api/users', currentUser?.id, 'bookmarks'],
    queryFn: async () => {
      if (!currentUser) return [];
      const response = await fetch(`/api/users/${currentUser.id}/bookmarks`);
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      return response.json() as Promise<Bookmark[]>;
    },
    enabled: !!currentUser,
  });

  const productBookmarks = bookmarks.filter(b => b.productId);
  const ingredientBookmarks = bookmarks.filter(b => b.ingredientId);

  const handleProductClick = (productId: number) => {
    setLocation(`/product/${productId}`);
  };

  const handleIngredientClick = (ingredientId: number) => {
    setLocation(`/ingredient/${ingredientId}`);
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Bookmarks" />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Sign in to view bookmarks</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Create an account to save your favorite products and ingredients
                </p>
                <Button onClick={() => setLocation("/profile")} className="w-full">
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Bookmarks" />
      
      <main className="pb-20">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'products'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Products ({productBookmarks.length})
            </button>
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'ingredients'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <BookOpen className="h-4 w-4 inline mr-2" />
              Ingredients ({ingredientBookmarks.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="space-y-3">
                  {productBookmarks.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center text-gray-500">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">No bookmarked products</p>
                        <p className="text-sm">
                          Bookmark products while browsing to save them for later
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    productBookmarks.map((bookmark) => (
                      <Card 
                        key={bookmark.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleProductClick(bookmark.productId!)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral">Product #{bookmark.productId}</h4>
                              <p className="text-sm text-gray-600">
                                Saved on {formatDate(bookmark.createdAt)}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Ingredients Tab */}
              {activeTab === 'ingredients' && (
                <div className="space-y-3">
                  {ingredientBookmarks.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center text-gray-500">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">No bookmarked ingredients</p>
                        <p className="text-sm">
                          Bookmark ingredients while exploring to save them for later
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    ingredientBookmarks.map((bookmark) => (
                      <Card 
                        key={bookmark.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleIngredientClick(bookmark.ingredientId!)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral">Ingredient #{bookmark.ingredientId}</h4>
                              <p className="text-sm text-gray-600">
                                Saved on {formatDate(bookmark.createdAt)}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
