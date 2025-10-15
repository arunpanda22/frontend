"use client"
import { ASINAnalyzerForm } from '@/components/asin_analyzer/AsinAnalyzerForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CerebroPage() {
  return (
    <ProtectedRoute>
          <ASINAnalyzerForm />
    </ProtectedRoute>
  );
} 