// 'use client'

// import { useState } from 'react'
// import { usePermissions } from '@/lib/hooks/usePermissions'
// import { Agency } from '@/lib/context/AuthContext'

// interface AgencySwitcherProps {
//   onSwitchComplete?: () => void
// }

// /**
//  * Component for switching between user's agencies
//  * Note: This is a base implementation - UI will be implemented later
//  */
// export function AgencySwitcher({ onSwitchComplete }: AgencySwitcherProps) {
//   const { 
//     agencies, 
//     currentAgency, 
//     isAgencyAdmin, 
//     switchToManagedUser,
//     managedUsers 
//   } = usePermissions()
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
  
//   const currentAgencyId = currentAgency?.id || null
  
//   // Get the switchAgency function directly from the hook
//   const { switchAgency } = useAuth()
  
//   const handleAgencySwitch = async (agencyId: string) => {
//     if (agencyId === currentAgencyId) return
    
//     try {
//       setIsLoading(true)
//       setError(null)
//       await switchAgency(agencyId)
//       onSwitchComplete?.()
//     } catch (error) {
//       console.error('Failed to switch agency:', error)
//       setError('Failed to switch agency. Please try again.')
//     } finally {
//       setIsLoading(false)
//     }
//   }
  
//   // If user has no agencies or only one, don't render the switcher
//   if (agencies.length <= 1) {
//     return null
//   }
  
//   return (
//     <div className="agency-switcher">
//       {/* 
//         This is a placeholder implementation
//         The actual UI will be implemented later as per requirements
//       */}
      
//       <div className="agency-list">
//         <p className="agency-title">Your Agencies:</p>
//         {agencies.map((agency) => (
//           <button
//             key={agency.id}
//             onClick={() => handleAgencySwitch(agency.id)}
//             disabled={isLoading || agency.id === currentAgencyId}
//             className={`agency-item ${agency.id === currentAgencyId ? 'active' : ''}`}
//           >
//             {agency.name}
//             {isAgencyAdmin() && agency.id === currentAgencyId && <span className="admin-badge">Admin</span>}
//           </button>
//         ))}
//       </div>
      
//       {error && <div className="error">{error}</div>}
//     </div>
//   )
// }

// // Need to import useAuth after the component definition to avoid circular dependency
// import { useAuth } from '@/lib/context/AuthContext'

// export default AgencySwitcher