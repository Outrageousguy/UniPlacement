import { useState } from "react";
import AIAnalysis, { AIAnalysisResultCard } from "../AIAnalysis";

export default function AIAnalysisExample() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    matchScore: number;
    missingKeywords: string[];
    suggestions: string[];
  } | undefined>(undefined);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setResult({
        matchScore: 73,
        missingKeywords: ["Docker", "Kubernetes", "System Design", "CI/CD", "AWS"],
        suggestions: [
          "Add Docker containerization experience to your projects section",
          "Highlight any distributed systems experience you have",
          "Include specific cloud platforms you've worked with (AWS, GCP, Azure)",
        ],
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <AIAnalysis
          companyName="Google"
          jobRole="Software Engineer"
          analysisResult={result}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          hasResume={true}
        />
        <span className="text-sm text-muted-foreground">
          Click "Analyze Resume" to see the AI analysis flow
        </span>
      </div>
      
      {result && (
        <AIAnalysisResultCard result={result} companyName="Google" />
      )}
    </div>
  );
}
