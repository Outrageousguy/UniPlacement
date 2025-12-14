import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Sparkles, AlertCircle, CheckCircle2, Loader2, RefreshCw, Target, Lightbulb } from "lucide-react";

interface AnalysisResult {
  matchScore: number;
  missingKeywords: string[];
  suggestions: string[];
}

interface AIAnalysisProps {
  companyName: string;
  jobRole: string;
  analysisResult?: AnalysisResult;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
  hasResume?: boolean;
}

export default function AIAnalysis({
  companyName,
  jobRole,
  analysisResult,
  onAnalyze,
  isAnalyzing = false,
  hasResume = true,
}: AIAnalysisProps) {
  const [showDialog, setShowDialog] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Strong Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Needs Improvement";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasResume}
          data-testid="button-analyze-resume"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analyze Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Resume Analysis - {companyName}
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis of your resume against the {jobRole} position
          </DialogDescription>
        </DialogHeader>

        {!analysisResult && !isAnalyzing ? (
          <div className="py-8 text-center">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Ready to Analyze</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to analyze your resume against this job description
            </p>
            <Button onClick={onAnalyze} data-testid="button-start-analysis">
              <Sparkles className="w-4 h-4 mr-2" />
              Start Analysis
            </Button>
          </div>
        ) : isAnalyzing ? (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
            <h3 className="font-semibold mb-2">Analyzing Your Resume</h3>
            <p className="text-sm text-muted-foreground">
              Our AI is comparing your resume with the job requirements...
            </p>
          </div>
        ) : analysisResult ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Match Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getProgressColor(analysisResult.matchScore)}`}
                        style={{ width: `${analysisResult.matchScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <span className={`text-3xl font-bold ${getScoreColor(analysisResult.matchScore)}`}>
                      {analysisResult.matchScore}%
                    </span>
                  </div>
                </div>
                <p className={`text-sm font-medium mt-2 ${getScoreColor(analysisResult.matchScore)}`}>
                  {getScoreLabel(analysisResult.matchScore)}
                </p>
              </CardContent>
            </Card>

            {analysisResult.missingKeywords.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    Missing Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.missingKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Consider adding these keywords to improve your match score
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Suggestions to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Close
          </Button>
          {analysisResult && (
            <Button
              variant="outline"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              data-testid="button-analyze-again"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Analyze Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AIAnalysisResultCard({
  result,
  companyName,
}: {
  result: AnalysisResult;
  companyName: string;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">AI Analysis</span>
          </div>
          <span className={`text-2xl font-bold ${getScoreColor(result.matchScore)}`}>
            {result.matchScore}%
          </span>
        </div>
        <Progress value={result.matchScore} className="h-2 mb-3" />
        {result.missingKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {result.missingKeywords.slice(0, 3).map((keyword, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {result.missingKeywords.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{result.missingKeywords.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
