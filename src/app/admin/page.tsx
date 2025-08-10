// Redirect root /admin to /admin/reports for consistent layout routing
export default function AdminIndexRedirect() {
  if (typeof window !== 'undefined') {
    window.location.replace('/admin/reports')
  }
  return null
}

