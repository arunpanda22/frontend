import { useState } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

// Types
interface ASINVariants {
  MAIN: string;
  [key: string]: string;
}

interface ASINAnalysisResult {
  success: boolean;
  error: string | null;
  variants: ASINVariants;
  total_variants: number;
}

interface GroupedImageViewerProps {
  analysisResults: Record<string, ASINAnalysisResult>;
}

interface GroupedImage {
  asin: string;
  imageUrl: string;
  variantType: string;
}

function GroupedImageViewer({ analysisResults }: GroupedImageViewerProps) {
  const [selectedVariantType, setSelectedVariantType] = useState<string>("MAIN");
  const [imageError, setImageError] = useState<Set<string>>(new Set());

  const handleImageError = (imageUrl: string) => {
    setImageError(prev => new Set([...prev, imageUrl]));
  };

  const groupImagesByVariant = (): Record<string, GroupedImage[]> => {
    const grouped: Record<string, GroupedImage[]> = {};
    Object.entries(analysisResults).forEach(([asin, result]) => {
      if (result.success && result.variants) {
        Object.entries(result.variants).forEach(([variantType, imageUrl]) => {
          if (!grouped[variantType]) {
            grouped[variantType] = [];
          }
          grouped[variantType].push({ asin, imageUrl, variantType });
        });
      }
    });
    return grouped;
  };

  const groupedImages = groupImagesByVariant();
  const variantTypes = Object.keys(groupedImages).sort((a, b) => {
    if (a === "MAIN") return -1;
    if (b === "MAIN") return 1;
    return a.localeCompare(b);
  });

  const currentImages = groupedImages[selectedVariantType] || [];
  const totalSuccessfulASINs = Object.values(analysisResults).filter(r => r.success).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <PhotoIcon className="h-5 w-5 mr-2" />
            Product Images Analysis
          </div>
          <div className="text-sm font-normal text-gray-600">
            {totalSuccessfulASINs} ASINs • {variantTypes.length} Variant Types
          </div>
        </h4>
      </div>

      <div className="p-4">
        {/* Variant Type Selector */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {variantTypes.map((variantType) => (
              <button
                key={variantType}
                onClick={() => setSelectedVariantType(variantType)}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                  selectedVariantType === variantType
                    ? "bg-blue-500 text-white border-blue-500 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">{variantType}</span>
                <span className="ml-2 text-sm opacity-75">
                  ({groupedImages[variantType]?.length || 0})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Images */}
        <div className="mb-4">
          <h5 className="text-lg font-semibold text-gray-800 mb-3">
            {selectedVariantType} Images ({currentImages.length} ASINs)
          </h5>
        </div>

        {currentImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {currentImages.map((image) => (
              <div
                key={`${image.asin}-${image.variantType}`}
                className="relative bg-gray-100 rounded-lg border overflow-hidden"
                style={{ aspectRatio: "1/1" }}
              >
                {!imageError.has(image.imageUrl) ? (
                  <>
                    <img
                      src={image.imageUrl}
                      alt={`${image.variantType} for ${image.asin}`}
                      className="w-full h-full object-contain"
                      onError={() => handleImageError(image.imageUrl)}
                    />
                    <Button
                      onClick={() => window.open(image.imageUrl, "_blank")}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 p-1"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <PhotoIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs px-2 py-1 text-center">
                  {image.asin}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
            <p>No images available for {selectedVariantType} variant</p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Total ASINs:</span> {totalSuccessfulASINs}
            </div>
            <div>
              <span className="font-medium">Variant Types:</span> {variantTypes.length}
            </div>
            <div>
              <span className="font-medium">Current Type:</span> {selectedVariantType}
            </div>
            <div>
              <span className="font-medium">Images in Type:</span> {currentImages.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupedImageViewer;
