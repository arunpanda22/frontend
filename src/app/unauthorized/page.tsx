'use client' 

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/context/AuthContext"
import usePermissions from "@/lib/hooks/usePermissions"
import { useSearchParams, useRouter } from "next/navigation"

export default function UnauthorizedPage() {
  const searchParams = useSearchParams()
  const route = searchParams.get('route')
  const { permissions } = usePermissions()
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
      <p className="mb-2 text-gray-600">
        You don’t have permission to access: <strong>{route}</strong>
      </p>
      <p className="mb-4 text-gray-600">
        Your role: <strong>{userProfile?.current_role_name || 'Unknown'}</strong>
      </p>
      <Button onClick={() => router.back()}>Go Back</Button>
    </div>
  )
}
