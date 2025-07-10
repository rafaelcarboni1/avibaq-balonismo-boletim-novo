"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

interface AnimatedBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function AnimatedBreadcrumbs({ 
  items, 
  className 
}: AnimatedBreadcrumbsProps) {
  return (
    <nav 
      className={cn("flex items-center space-x-2 text-sm", className)}
      aria-label="Breadcrumb"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center"
      >
        <Link
          href="/admin/dashboard"
          className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <HomeIcon className="h-4 w-4" />
          <span className="sr-only">Dashboard</span>
        </Link>
      </motion.div>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.1 + 0.1 
            }}
            className="flex items-center space-x-2"
          >
            {/* Separator */}
            <ChevronRightIcon className="h-4 w-4 text-gray-300" />
            
            {/* Breadcrumb item */}
            {isLast ? (
              <motion.span
                className="flex items-center space-x-1 text-gray-900 font-medium"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </motion.span>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Link
                  href={item.href || "#"}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </nav>
  );
}