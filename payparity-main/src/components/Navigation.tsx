
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          {!isHomePage && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>
          )}
          <h1 className="text-xl font-bold gradient-text">PayParity</h1>
        </div>
        
        <div className="text-sm text-gray-600">
          AI-Powered Salary Analysis
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
