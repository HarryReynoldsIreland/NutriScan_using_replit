import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/ui/mobile-header";
import { useLocation } from "wouter";
import { type Ingredient, type Product } from "@shared/schema";

interface HomeProps {
  currentUser?: any;
}

export default function Home({ currentUser }: HomeProps) {
  const [, setLocation] = useLocation();
  
  const { data: trendingIngredients, isLoading: loadingIngredients } = useQuery({
    queryKey: ['/api/ingredients/trending'],
    queryFn: async () => {
      const response = await fetch('/api/ingredients/trending?limit=4');
      if (!response.ok) throw new Error('Failed to fetch trending ingredients');
      return response.json() as Promise<Ingredient[]>;
    },
  });

  const recentScans = [
    {
      id: 1,
      productName: "Coca-Cola Classic",
      ingredients: 12,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    },
    {
      id: 2,
      productName: "Nutella",
      ingredients: 8,
      imageUrl: "https://images.unsplash.com/photo-1572103728116-f4a11b5b5eb3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    }
  ];

  const handleScan = () => {
    setLocation("/scanner");
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="NutriScan" />
      
      <main className="pb-20 p-4">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral mb-2">
            Welcome back{currentUser?.username ? `, ${currentUser.username}` : ''}!
          </h2>
          <p className="text-gray-600">Scan products to discover ingredient insights</p>
        </div>

        {/* Scan Button */}
        <div className="mb-8">
          <Button
            onClick={handleScan}
            className="w-full bg-primary text-white py-4 px-6 rounded-xl font-medium text-lg hover:bg-green-600 transition-colors"
            size="lg"
          >
            <Camera className="h-6 w-6 mr-3" />
            Scan Product Barcode
          </Button>
        </div>

        {/* Recent Scans */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral mb-3">Recent Scans</h3>
          {recentScans.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <p>No recent scans yet. Start by scanning your first product!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <Card key={scan.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={scan.imageUrl} 
                        alt={scan.productName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral">{scan.productName}</h4>
                        <p className="text-sm text-gray-600">{scan.ingredients} ingredients</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Trending Ingredients */}
        <div>
          <h3 className="text-lg font-semibold text-neutral mb-3">Trending Ingredients</h3>
          {loadingIngredients ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-3">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {trendingIngredients?.map((ingredient) => (
                <Card 
                  key={ingredient.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleIngredientClick(ingredient.id)}
                >
                  <CardContent className="p-3">
                    <h4 className="font-medium text-neutral mb-1 text-sm leading-tight">
                      {ingredient.name}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      {ingredient.discussionCount || 0} discussions
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getRiskLevelColor(ingredient.riskLevel)}`}
                    >
                      {getRiskLevelText(ingredient.riskLevel)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
