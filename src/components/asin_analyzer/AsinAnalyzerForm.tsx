import { useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Eye, EyeOff } from "lucide-react";
import { useASINAnalysis } from "@/lib/hooks/queries/use-asin-analysis";
import { getErrorDetails } from "@/lib/utils/error-handler";
import { ASINAnalysisResponse, ASINAnalysisFile } from "@/lib/api/types";
import { asinService } from "@/lib/api/services/asin.service";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ErrorMessage } from "@/components/ui/error-message";
import { Spinner } from "@/components/shared/Spinner";

// Reusable component for file download
interface FileDownloadProps {
  file: ASINAnalysisFile;
  onDownload: (file: ASINAnalysisFile) => void;
}

function FileDownload({ file, onDownload }: FileDownloadProps) {
  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
      <div className="flex-1 min-w-0">
        <p className="text-blue-600 font-medium truncate">
          {file.filename || "Analysis Document"}
        </p>
        <p className="text-blue-500 text-sm">DOCX Format</p>
      </div>
      <Button
        onClick={() => onDownload(file)}
        className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400 flex-shrink-0 flex items-center gap-2 w-full sm:w-auto"
      >
        <ArrowDownTrayIcon className="h-5 w-5" />
        Download Report
      </Button>
    </div>
  );
}

// Success banner component
interface SuccessBannerProps {
  asin: string;
  analysisFile?: ASINAnalysisFile;
  summary: {
    text_length: number;
    image_length: number;
    generated_at?: string;
  };
  warning?: string;
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  onDownloadFile: (file: ASINAnalysisFile) => void;
}

function SuccessBanner({
  asin,
  analysisFile,
  summary,
  warning,
  previewOpen,
  setPreviewOpen,
  onDownloadFile,
}: SuccessBannerProps) {
  return (
    <div className={`p-6 rounded-lg border ${warning ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className={`text-lg font-semibold flex items-center ${warning ? 'text-yellow-600' : 'text-green-600'}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={warning ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" : "M5 13l4 4L19 7"}
            />
          </svg>
          {warning ? "Analysis Complete (with warnings)" : "Analysis Complete!"}
        </h3>

        <div className="flex flex-wrap gap-3">
          {/* Preview Toggle Button */}
          <Button
            onClick={() => setPreviewOpen(!previewOpen)}
            className="bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-400 flex items-center gap-2"
          >
            {previewOpen ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            {previewOpen ? "Hide Analysis" : "Show Analysis"}
          </Button>

          {/* Download Button */}
          {analysisFile && (
            <Button
              onClick={() => onDownloadFile(analysisFile)}
              className="bg-green-600 text-white hover:bg-green-500 focus:ring-green-400 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download Document
            </Button>
          )}
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="text-gray-700">
          <strong>ASIN:</strong> {asin}
        </div>
        <div className="text-gray-700">
          <strong>Text Analysis:</strong> {summary.text_length} characters
        </div>
        <div className="text-gray-700">
          <strong>Image Analysis:</strong> {summary.image_length} characters
        </div>
      </div>

      {/* Warning Message */}
      {warning && (
        <div className="mt-3 p-3 bg-yellow-100 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong>Warning:</strong> {warning}
          </p>
        </div>
      )}
    </div>
  );
}

// Analysis display component
interface AnalysisDisplayProps {
  textAnalysis: string;
  imageAnalysis: string;
}

function AnalysisDisplay({ textAnalysis, imageAnalysis }: AnalysisDisplayProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Text Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">Text Analysis</h4>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="prose prose-sm max-w-none text-gray-700">
            {textAnalysis.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="mb-3">
                  {paragraph}
                </p>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Image Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">Image Analysis</h4>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="prose prose-sm max-w-none text-gray-700">
            {imageAnalysis.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="mb-3">
                  {paragraph}
                </p>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ASINAnalyzerForm() {
  const [asin, setAsin] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [analysisData, setAnalysisData] = useState<ASINAnalysisResponse | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(true);

  const {
    mutate: analyzeASIN,
    isPending: isProcessing,
    error: mutationError,
    reset: resetMutation,
  } = useASINAnalysis();

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!asin.trim() || !validateASIN(asin)) return;

    setProgress(0);

    // Setup progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 20) return prev + 2;
        if (prev < 40) return prev + 1.5;
        if (prev < 60) return prev + 1;
        if (prev < 80) return prev + 0.5;
        if (prev < 90) return prev + 0.2;
        return prev;
      });
    }, 1000);

    try {
      await analyzeASIN(
        { asin: asin.trim() },
        {
          onSuccess: (response) => {
            clearInterval(progressInterval);
            setProgress(100);

            console.log("ASIN Analysis response:", response);
            setAnalysisData(response);
          },
          onError: (error) => {
            clearInterval(progressInterval);
            setProgress(0);
            console.error("ASIN Analysis Error:", error);
          },
        }
      );
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      console.error("Unexpected error during ASIN analysis:", error);
    }
  };

  const handleReset = () => {
    setAsin("");
    setProgress(0);
    setAnalysisData(null);
    setPreviewOpen(true);
    resetMutation();
  };

  const handleDownloadFile = (file: ASINAnalysisFile) => {
    try {
      console.log("Downloading file:", file);

      // Check if we have a direct URL first
      if (file.url && (file.url.startsWith("http://") || file.url.startsWith("https://"))) {
        console.log("Using direct URL for download:", file.url);
        window.open(file.url, "_blank");
        return;
      }

      if (!file.file_id) {
        console.error("Missing file_id in file object:", file);
        alert("Error: File ID is missing. Cannot download the file.");
        return;
      }

      // Use the service function with both file_id and url
      const serviceUrl = asinService.downloadASINFile(file.file_id, file.url);
      console.log("Generated download URL:", serviceUrl);

      // Open in new tab for reliable downloading
      window.open(serviceUrl, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("There was an error downloading the file. Please try again.");
    }
  };

  const validateASIN = (value: string): boolean => {
    // ASIN validation: 10 characters, alphanumeric
    const asinRegex = /^[A-Z0-9]{10}$/i;
    return asinRegex.test(value);
  };

  return (
    <main className="flex-1">
      <div className="min-h-screen bg-gradient-to-b p-6 flex flex-col items-center justify-center pt-8">
        <Card className="w-full max-w-8xl mt-0 border border-gray-300 shadow-xl bg-white backdrop-blur-sm">
          <CardHeader className="border-b border-gray-200 pb-6">
            <CardTitle className="text-3xl font-bold text-center text-black">
              ASIN Analyzer Tool
            </CardTitle>
            <CardDescription className="text-center text-gray-700 mt-2">
              Analyze Amazon products by ASIN to get detailed text and image insights
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-8">
              {/* ASIN Input */}
              <div className="space-y-4 p-4">
                <Label htmlFor="asin" className="text-black text-lg font-medium">
                  Amazon ASIN
                </Label>
                <div className="flex flex-col space-y-2">
                  <input
                    id="asin"
                    type="text"
                    value={asin}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length <= 10) {
                        setAsin(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isProcessing && asin.trim() && validateASIN(asin)) {
                        handleSubmit(e);
                      }
                    }}
                    placeholder="B08N5WRWNW"
                    maxLength={10}
                    className={`w-full max-w-md text-black border ${
                      asin && !validateASIN(asin) 
                        ? 'border-red-400 focus:ring-red-400 focus:border-red-400' 
                        : 'border-gray-300 focus:ring-blue-400 focus:border-blue-400'
                    } focus:ring-1 rounded-md p-3 outline-none text-lg font-mono tracking-wider`}
                  />
                  <div className="flex items-center space-x-4 text-sm">
                    <p className="text-gray-600">
                      Enter a 10-character Amazon ASIN (e.g., B08N5WRWNW)
                    </p>
                    {asin && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        validateASIN(asin) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {validateASIN(asin) ? 'Valid ASIN' : 'Invalid ASIN'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-4 pt-4 justify-center">
                <Button
                  disabled={isProcessing || !asin.trim() || !validateASIN(asin)}
                  className="w-1/4 bg-sky-400 text-white hover:bg-sky-500 focus:ring-sky-400 flex items-center justify-center transition-all duration-200 transform hover:translate-y-[-2px] shadow-lg"
                  onClick={handleSubmit}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <Spinner size="sm" />
                      <span className="ml-2">Analyzing...</span>
                    </div>
                  ) : (
                    "Analyze ASIN"
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="w-1/4 bg-gray-600 text-white hover:bg-gray-700 transition-all duration-200 border border-gray-500"
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="mt-8 p-4 bg-sky-50 rounded-lg border border-blue-200 space-y-4">
                <Label className="text-blue-800 font-medium">
                  Analyzing ASIN: {asin}
                </Label>
                <Progress value={progress} className="w-full h-3 bg-blue-100" />
                <p className="text-blue-700 text-sm">
                  This process may take 2-3 minutes to complete. We are analyzing the product text and images to provide comprehensive insights.
                </p>
              </div>
            )}

            {/* Results Section */}
            {analysisData && (
              <div className="mt-8 space-y-6">
                {/* Success Banner */}
                <SuccessBanner
                  asin={analysisData.asin}
                  analysisFile={analysisData.download_file}
                  summary={analysisData.analysis_summary}
                  warning={analysisData.warning}
                  previewOpen={previewOpen}
                  setPreviewOpen={setPreviewOpen}
                  onDownloadFile={handleDownloadFile}
                />

                {/* File Download Section */}
                {analysisData.download_file && (
                  <FileDownload
                    file={analysisData.download_file}
                    onDownload={handleDownloadFile}
                  />
                )}

                {/* Analysis Preview */}
                {previewOpen && (
                  <AnalysisDisplay
                    textAnalysis={analysisData.text_analysis}
                    imageAnalysis={analysisData.image_analysis}
                  />
                )}
              </div>
            )}

            {/* Error Message */}
            {mutationError && (
              <ErrorMessage
                message={getErrorDetails(mutationError).message}
                onRetry={resetMutation}
                className="mt-8"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}