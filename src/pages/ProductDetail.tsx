import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useState } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  status: string;
  images: string[];
};

const mockProducts: Product[] = [
  {
    id: "1",
    name: "USB-C Cable 2m",
    category: "Electronics",
    description: "High-speed USB-C charging cable with durable braided design. Supports fast charging up to 100W and data transfer speeds up to 480Mbps. Perfect for charging laptops, tablets, and smartphones.",
    price: 12.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
      "https://images.unsplash.com/photo-1591290619762-c588f3286e8c?w=800&q=80",
    ],
  },
  {
    id: "2",
    name: "USB-C Cable 1m",
    category: "Electronics",
    description: "Compact USB-C cable ideal for desktop use. High-quality construction ensures reliable performance.",
    price: 9.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
    ],
  },
  {
    id: "3",
    name: "USB-C to USB-A Adapter",
    category: "Electronics",
    description: "Seamlessly connect USB-C devices to USB-A ports. Compact and portable design.",
    price: 7.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
    ],
  },
  {
    id: "4",
    name: "USB-C Hub 4-Port",
    category: "Electronics",
    description: "Expand your connectivity with this premium 4-port USB-C hub. Features multiple ports for all your devices.",
    price: 34.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
      "https://images.unsplash.com/photo-1591290619762-c588f3286e8c?w=800&q=80",
    ],
  },
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [addedToCart, setAddedToCart] = useState(false);

  const product = mockProducts.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>

        {/* Product Detail */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Image Carousel */}
          <Card>
            <CardContent className="p-4">
              <Carousel className="w-full">
                <CarouselContent>
                  {product.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
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
            </CardContent>
          </Card>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-3">{product.status}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground">{product.category}</p>
            </div>

            <div className="text-3xl md:text-4xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </div>

            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <div className="space-y-3">
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleAddToCart}
                disabled={addedToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {addedToCart ? "Added to Cart!" : "Add to Cart"}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
