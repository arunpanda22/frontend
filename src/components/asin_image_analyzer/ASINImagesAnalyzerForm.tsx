import { useState } from "react";
import { ArrowDownTrayIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import { getErrorDetails } from "@/lib/utils/error-handler";
import { ASINImagesResponse, ASINImagesFile } from "@/lib/api/types";
import { asinImagesService } from "@/lib/api/services/asin-images.service";

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
import { useASINImagesAnalysis } from "@/lib/hooks/queries/use-asin-image-analysis";
import GroupedImageViewer from "./GroupedImageViewer";

// Types for ASIN Images Analysis
interface ASINVariants {
  MAIN: string;
  [key: string]: string; // PT01, PT02, etc.
}

interface ASINAnalysisResult {
  success: boolean;
  error: string | null;
  variants: ASINVariants;
  total_variants: number;
}

// Image viewer component
interface ImageViewerProps {
  variants: ASINVariants;
  asin: string;
}

function ImageViewer({ variants, asin }: ImageViewerProps) {
  const [selectedImage, setSelectedImage] = useState<string>(variants.MAIN);
  const [imageError, setImageError] = useState<Set<string>>(new Set());

  const handleImageError = (imageUrl: string) => {
    setImageError((prev) => new Set([...prev, imageUrl]));
  };

  const sortedVariants = Object.entries(variants).sort(([a], [b]) => {
    if (a === "MAIN") return -1;
    if (b === "MAIN") return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center">
          <PhotoIcon className="h-5 w-5 mr-2" />
          ASIN: {asin} ({Object.keys(variants).length} variants)
        </h4>
      </div>

      <div className="p-4">
        {/* Main Image Display */}
        <div className="mb-4">
          <div
            className="relative bg-gray-100 rounded-lg overflow-hidden"
            style={{ aspectRatio: "1/1", maxHeight: "400px" }}
          >
            {!imageError.has(selectedImage) ? (
              <img
                src={selectedImage}
                alt={`Product variant for ${asin}`}
                className="w-full h-full object-contain"
                onError={() => handleImageError(selectedImage)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-center text-gray-500">
                  <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Image not available</p>
                </div>
              </div>
            )}

            {/* View Full Size Button */}
            {!imageError.has(selectedImage) && (
              <Button
                onClick={() => window.open(selectedImage, "_blank")}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 p-2"
                size="sm"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {sortedVariants.map(([variantKey, imageUrl]) => (
            <button
              key={variantKey}
              onClick={() => setSelectedImage(imageUrl)}
              className={`relative bg-gray-100 rounded border-2 transition-all duration-200 ${
                selectedImage === imageUrl
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ aspectRatio: "1/1" }}
            >
              {!imageError.has(imageUrl) ? (
                <img
                  src={imageUrl}
                  alt={`${variantKey} variant`}
                  className="w-full h-full object-contain rounded"
                  onError={() => handleImageError(imageUrl)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PhotoIcon className="h-4 w-4 text-gray-400" />
                </div>
              )}

              {/* Variant Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded-b">
                {variantKey}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// File download component
interface FileDownloadProps {
  file: ASINImagesFile;
  onDownload: (file: ASINImagesFile) => void;
}

function FileDownload({ file, onDownload }: FileDownloadProps) {
  return (
    <div className="p-6 bg-green-100 rounded-lg border border-green-700/50 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
      <div className="flex-1 min-w-0">
        <p className="text-green-500 text-lg font-semibold flex items-center">
          {file.filename || "ASIN Images Analysis Report"}
        </p>
        <p className="text-green-700 text-sm">PDF Format</p>
      </div>
      <Button
        onClick={() => onDownload(file)}
        className="bg-green-600 text-white hover:bg-green-500 focus:ring-green-400 flex items-center gap-2"
      >
        <ArrowDownTrayIcon className="h-5 w-5" />
        Download PDF Report
      </Button>
    </div>
  );
}

// Success banner component
interface SuccessBannerProps {
  response: ASINImagesResponse;
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  onDownloadFile: (file: ASINImagesFile) => void;
}

function SuccessBanner({
  response,
  previewOpen,
  setPreviewOpen,
  onDownloadFile,
}: SuccessBannerProps) {
  const hasFailures = response.failed_asins > 0;

  return (
    <div
      className={`p-6 rounded-lg border ${
        hasFailures
          ? "bg-yellow-50 border-yellow-300"
          : "bg-green-50 border-green-300"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3
          className={`text-lg font-semibold flex items-center ${
            hasFailures ? "text-yellow-600" : "text-green-600"
          }`}
        >
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
              d={
                hasFailures
                  ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  : "M5 13l4 4L19 7"
              }
            />
          </svg>
          {hasFailures
            ? "Analysis Complete (with some failures)"
            : "Analysis Complete!"}
        </h3>

        <div className="flex flex-wrap gap-3">
          {/* Preview Toggle Button */}
          <Button
            onClick={() => setPreviewOpen(!previewOpen)}
            className="bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-400 flex items-center gap-2"
          >
            {previewOpen ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
            {previewOpen ? "Hide Images" : "Show Images"}
          </Button>

          {/* Download Button */}
          {response.download_file && (
            <Button
              onClick={() => onDownloadFile(response.download_file)}
              className="bg-green-600 text-white hover:bg-green-500 focus:ring-green-400 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download PDF Report
            </Button>
          )}
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div className="text-gray-700">
          <strong>Total ASINs:</strong> {response.total_asins}
        </div>
        <div className="text-gray-700">
          <strong>Successful:</strong> {response.successful_asins}
        </div>
        <div className="text-gray-700">
          <strong>Failed:</strong> {response.failed_asins}
        </div>
        <div className="text-gray-700">
          <strong>Total Images:</strong> {response.summary.total_variants}
        </div>
      </div>

      {/* ASIN List */}
      <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-md">
        <p className="text-gray-800 text-sm">
          <strong>Analyzed ASINs:</strong> {response.asins.join(", ")}
        </p>
      </div>
    </div>
  );
}

export default function ASINImagesAnalyzerForm() {
  const [asins, setAsins] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [analysisData, setAnalysisData] = useState<ASINImagesResponse | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = useState<boolean>(true);

  const {
    mutate: analyzeASINImages,
    isPending: isProcessing,
    error: mutationError,
    reset: resetMutation,
  } = useASINImagesAnalysis();

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    const asinList = asins
      .trim()
      .split(/[\s,]+/)
      .filter((asin) => asin.length > 0);
    if (asinList.length === 0) return;

    // Validate ASINs
    const invalidAsins = asinList.filter((asin) => !validateASIN(asin));
    if (invalidAsins.length > 0) {
      return;
    }

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
      await analyzeASINImages(
        { asins: asinList },
        {
          onSuccess: (response) => {
            clearInterval(progressInterval);
            setProgress(100);

            console.log("ASIN Images Analysis response:", response);
            setAnalysisData(response);
          },
          onError: (error) => {
            clearInterval(progressInterval);
            setProgress(0);
            console.error("ASIN Images Analysis Error:", error);
          },
        }
      );
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      console.error("Unexpected error during ASIN Images analysis:", error);
    }
  };

  const handleReset = () => {
    setAsins("");
    setProgress(0);
    setAnalysisData(null);
    setPreviewOpen(true);
    resetMutation();
  };

  const handleDownloadFile = (file: ASINImagesFile) => {
    try {
      console.log("Downloading file:", file);

      // Check if we have a direct URL first
      if (
        file.url &&
        (file.url.startsWith("http://") || file.url.startsWith("https://"))
      ) {
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
      const serviceUrl = asinImagesService.downloadASINImagesFile(
        file.file_id,
        file.url
      );
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

  const parseAsins = (input: string): string[] => {
    return input
      .trim()
      .split(/[\s,]+/)
      .filter((asin) => asin.length > 0);
  };

  const asinList = parseAsins(asins);
  const validAsins = asinList.filter(validateASIN);
  const invalidAsins = asinList.filter((asin) => !validateASIN(asin));

  return (
    <main className="flex-1">
      <div className="min-h-screen bg-gradient-to-b p-6 flex flex-col items-center justify-center pt-16">
        <Card className="w-full max-w-7xl mt-0 border border-gray-300 shadow-xl bg-white backdrop-blur-sm">
          <CardHeader className="border-b border-gray-200 pb-6">
            <CardTitle className="text-3xl font-bold text-center text-black">
              ASIN Images Analyzer Tool
            </CardTitle>
            <CardDescription className="text-center text-gray-700 mt-2">
              Analyze Amazon product images by ASIN to get detailed image
              variants and generate PDF reports
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-8">
              {/* ASIN Input */}
              <div className="space-y-4 p-4">
                <Label
                  htmlFor="asins"
                  className="text-black text-lg font-medium"
                >
                  Amazon ASINs
                </Label>
                <div className="flex flex-col space-y-2">
                  <textarea
                    id="asins"
                    value={asins}
                    onChange={(e) => {
                      const value = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9\s,]/g, "");
                      setAsins(value);
                    }}
                    placeholder="B08N5WRWNW, B07XYZ1234, B09ABC5678
Or enter one ASIN per line"
                    rows={4}
                    className={`w-full text-black border ${
                      invalidAsins.length > 0
                        ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                        : "border-gray-300 focus:ring-blue-400 focus:border-blue-400"
                    } focus:ring-1 rounded-md p-3 outline-none text-lg font-mono tracking-wider resize-none`}
                  />
                  <div className="flex flex-col space-y-2 text-sm">
                    <p className="text-gray-600">
                      Enter Amazon ASINs separated by commas or new lines (e.g.,
                      B08N5WRWNW, B07XYZ1234)
                    </p>
                    {asinList.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {validAsins.length > 0 && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            {validAsins.length} Valid ASIN
                            {validAsins.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {invalidAsins.length > 0 && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            {invalidAsins.length} Invalid ASIN
                            {invalidAsins.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-4 pt-4 justify-center">
                <Button
                  disabled={isProcessing || validAsins.length === 0}
                  className="w-1/4 bg-sky-400 text-white hover:bg-sky-500 focus:ring-sky-400 flex items-center justify-center transition-all duration-200 transform hover:translate-y-[-2px] shadow-lg"
                  onClick={handleSubmit}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <Spinner size="sm" />
                      <span className="ml-2">Analyzing...</span>
                    </div>
                  ) : (
                    `Analyze ${validAsins.length} ASIN${
                      validAsins.length !== 1 ? "s" : ""
                    }`
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
                  Analyzing {validAsins.length} ASIN
                  {validAsins.length !== 1 ? "s" : ""}: {validAsins.join(", ")}
                </Label>
                <Progress value={progress} className="w-full h-3 bg-blue-100" />
                <p className="text-blue-700 text-sm">
                  This process may take 2-5 minutes to complete. We are
                  analyzing product images and generating a comprehensive PDF
                  report.
                </p>
              </div>
            )}

            {/* Results Section */}
            {analysisData && (
              <div className="mt-8 space-y-6">
                {/* Success Banner */}
                <SuccessBanner
                  response={analysisData}
                  previewOpen={previewOpen}
                  setPreviewOpen={setPreviewOpen}
                  onDownloadFile={handleDownloadFile}
                />

                {/* File Download Section */}
                {/* {analysisData.download_file && (
                  <FileDownload
                    file={analysisData.download_file}
                    onDownload={handleDownloadFile}
                  />
                )} */}

                {/* Images Preview */}
                {previewOpen && (
                  <div className="space-y-6">
                    {/* Check if we have any successful results */}
                    {Object.values(analysisData.analysis_results).some(
                      (result) => result.success
                    ) ? (
                      <GroupedImageViewer
                        analysisResults={analysisData.analysis_results}
                      />
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                          No Images Available
                        </h3>
                        <p className="text-yellow-600">
                          None of the analyzed ASINs returned successful image
                          results.
                        </p>
                      </div>
                    )}

                    {/* Show failed ASINs separately */}
                    {Object.entries(analysisData.analysis_results).some(
                      ([, result]) => !result.success
                    ) && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-red-800">
                          Failed ASINs:
                        </h4>
                        {Object.entries(analysisData.analysis_results).map(
                          ([asin, result]) =>
                            !result.success && (
                              <div
                                key={asin}
                                className="bg-red-50 border border-red-200 rounded-lg p-4"
                              >
                                <h5 className="text-md font-semibold text-red-800 mb-2">
                                  ASIN: {asin} - Analysis Failed
                                </h5>
                                <p className="text-red-600">
                                  {result.error ||
                                    "Unknown error occurred during analysis"}
                                </p>
                              </div>
                            )
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* {previewOpen && (
                  <div className="space-y-6">
                    {Object.entries(analysisData.analysis_results).map(([asin, result]) => (
                      <div key={asin}>
                        {result.success ? (
                          <ImageViewer variants={result.variants} asin={asin} />
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="text-lg font-semibold text-red-800 mb-2">
                              ASIN: {asin} - Analysis Failed
                            </h4>
                            <p className="text-red-600">
                              {result.error || 'Unknown error occurred during analysis'}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )} */}
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
