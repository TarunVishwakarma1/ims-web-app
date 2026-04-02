"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

export function DynamicBreadcrumbs() {
  const pathname = usePathname()
  
  // Remove trailing slashes and empty string segments
  const segments = pathname.split("/").filter((segment) => segment !== "")

  return (
    <nav aria-label="breadcrumb" className="flex items-center text-sm text-muted-foreground whitespace-nowrap overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 min-w-max px-1">
        
        {/* Base Home Link */}
        <Link 
          href="/dashboard" 
          className="flex items-center hover:text-foreground transition-colors"
          title="Home"
        >
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />

        {segments.map((segment, index) => {
          // Construct the accumulating href up to this segment
          const href = "/" + segments.slice(0, index + 1).join("/")
          
          // Format label: capitalize first letter and replace hyphens with spaces
          const label = segment
            .replaceAll("-", " ")
            .replaceAll(/\b\w/g, (char) => char.toUpperCase())
            
          const isLast = index === segments.length - 1

          return (
            <React.Fragment key={href}>
              {isLast ? (
                <span className="font-medium text-foreground cursor-default" aria-current="page">
                  {label}
                </span>
              ) : (
                <>
                  <Link 
                    href={href} 
                    className="hover:text-foreground transition-colors max-w-[150px] truncate"
                  >
                    {label}
                  </Link>
                  <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />
                </>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </nav>
  )
}
