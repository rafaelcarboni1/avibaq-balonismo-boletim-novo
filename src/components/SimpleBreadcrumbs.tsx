"use client";

import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { cn } from "../lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

interface SimpleBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function SimpleBreadcrumbs({ 
  items, 
  className 
}: SimpleBreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav 
      className={cn(
        "flex items-center space-x-2 text-sm text-gray-600",
        className
      )}
      aria-label="Breadcrumb"
    >
      {/* Home icon */}
      <Link 
        href="/admin/dashboard" 
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <HomeIcon className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <div key={index} className="flex items-center space-x-2">
            {/* Separator */}
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            
            {/* Breadcrumb item */}
            {item.href && !isLast ? (
              <Link 
                href={item.href}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <div className="flex items-center space-x-1">
                {Icon && (
                  <Icon className={cn(
                    "h-4 w-4",
                    isLast ? "text-gray-900" : "text-gray-500"
                  )} />
                )}
                <span className={cn(
                  "font-medium",
                  isLast ? "text-gray-900" : "text-gray-500"
                )}>
                  {item.label}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export { SimpleBreadcrumbs };