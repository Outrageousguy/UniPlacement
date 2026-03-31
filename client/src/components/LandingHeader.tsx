import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

interface LandingHeaderProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export default function LandingHeader({ onSignIn, onGetStarted }: LandingHeaderProps) {
  return (
    <header className="bg-landing-primary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-landing-accent text-landing-primary-dark rounded flex items-center justify-center font-bold text-sm">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold">UniPlacement</h1>
              <p className="text-xs text-gray-400">MITS GWALIOR - T&P CELL</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#portals" className="text-gray-300 hover:text-white transition-colors">
              Portals
            </a>
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
              How it works
            </a>
            <a href="#mits-website" className="text-gray-300 hover:text-white transition-colors">
              MITS Website
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white hover:bg-landing-primary-dark/50"
              onClick={onSignIn}
            >
              Sign In
            </Button>
            <Button 
              className="bg-landing-accent text-landing-primary-dark hover:bg-landing-accent/90"
              onClick={onGetStarted}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
