import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ShoppingCart, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  status: string;
  images: string[];
};

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        {/* Image Carousel */}
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {product.images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    <img 
                      src={image} 
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {product.images.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
          <Badge className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm">
            {product.status}
          </Badge>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-base line-clamp-1">{product.name}</h3>
            <p className="text-xs text-muted-foreground">{product.category}</p>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xl font-bold text-primary">${product.price.toFixed(2)}</span>
          </div>

          {/* Action Buttons - Show on hover or always on mobile */}
          <div className={`flex gap-2 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Details
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onAddToCart(product)}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
