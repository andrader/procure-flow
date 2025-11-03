import { Button } from "@/components/ui/button";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { useNavigate } from "react-router-dom";

export default function CheckoutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          ← Back to Chat
        </Button>
        <CheckoutPanel onSuccess={() => navigate("/")} />
      </div>
    </div>
  );
}
