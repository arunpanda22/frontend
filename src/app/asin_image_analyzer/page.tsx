//src/apps/asin_image_analyzer/page.tsx

"use client"
import ASINImagesAnalyzerForm from '@/components/asin_image_analyzer/ASINImagesAnalyzerForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
export default function CerebroPage() {
  return (
    <ProtectedRoute>
       <ASINImagesAnalyzerForm />
    </ProtectedRoute>
  );
} 