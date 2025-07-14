import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/ui/mobile-header";
import { type Product } from "@shared/schema";

export default function ProductDetail() {
  const { id, barcode } = useParams();
  const [, setLocation] = useLocation();

  const { data: product, isLoading, error } = useQuery({
    queryKey: barcode ? ['/api/products/barcode', barcode] : ['/api/products', id],
    queryFn: async () => {
      const url = barcode ? `/api/products/barcode/${barcode}` : `/api/products/${id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Product not found');
      return response.json() as Promise<Product>;
    },
  });

  const handleBack = () => {
    setLocation("/");
  };

  const handleBookmark = () => {
    // TODO: Implement bookmark functionality
    console.log("Bookmark clicked");
  };

  const handleIngredientClick = (ingredientName: string) => {
    setLocation(`/ingredient/name/${encodeURIComponent(ingredientName)}`);
  };

  const getNutriScoreColor = (score?: string) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    
    switch (score.toLowerCase()) {
      case 'a': return 'bg-green-100 text-green-800';
      case 'b': return 'bg-lime-100 text-lime-800';
      case 'c': return 'bg-yellow-100 text-yellow-800';
      case 'd': return 'bg-orange-100 text-orange-800';
      case 'e': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIngredientRiskColor = (ingredient: any) => {
    // Simple risk assessment based on ingredient name
    const highRisk = ['high fructose corn syrup', 'artificial colors', 'sodium benzoate'];
    const mediumRisk = ['sugar', 'salt', 'palm oil'];
    
    const name = ingredient.name.toLowerCase();
    if (highRisk.some(risk => name.includes(risk))) return 'bg-red-100 text-red-800';
    if (mediumRisk.some(risk => name.includes(risk))) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getIngredientRiskText = (ingredient: any) => {
    const name = ingredient.name.toLowerCase();
    const highRisk = ['high fructose corn syrup', 'artificial colors', 'sodium benzoate'];
    const mediumRisk = ['sugar', 'salt', 'palm oil'];
    
    if (highRisk.some(risk => name.includes(risk))) return 'High Risk';
    if (mediumRisk.some(risk => name.includes(risk))) return 'Moderate';
    return 'Natural';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Loading..." showBackButton onBack={handleBack} />
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Product Not Found" showBackButton onBack={handleBack} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600 mb-4">
                Product not found or failed to load.
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

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader 
        title={product.name} 
        showBackButton 
        showBookmark
        onBack={handleBack}
        onBookmark={handleBookmark}
      />
      
      <main className="pb-20">
        {/* Product Image */}
        <div className="relative">
          <img 
            src={product.imageUrl || "https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300"} 
            alt={product.name}
            className="w-full h-48 object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h2 className="text-xl font-bold text-neutral mb-2">{product.name}</h2>
          {product.brand && (
            <p className="text-gray-600 mb-4">{product.brand}</p>
          )}
          
          {/* Nutrition Score */}
          {product.nutriScore && (
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm font-medium text-neutral">Nutri-Score:</span>
              <Badge className={`${getNutriScoreColor(product.nutriScore)} font-medium`}>
                {product.nutriScore.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>

        {/* Ingredients List */}
        <div className="px-4 pb-4">
          <h3 className="text-lg font-semibold text-neutral mb-3">Ingredients</h3>
          {product.ingredients && product.ingredients.length > 0 ? (
            <div className="space-y-2">
              {product.ingredients.map((ingredient, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleIngredientClick(ingredient.name)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral">{ingredient.name}</h4>
                        {ingredient.percentage && (
                          <p className="text-sm text-gray-600">{ingredient.percentage}%</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getIngredientRiskColor(ingredient)}`}
                        >
                          {getIngredientRiskText(ingredient)}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <p>No ingredient information available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
