import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "./card";

function ExpandableCard({
  className,
  title,
  children,
  defaultExpanded = false,
  ...props
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <Card
      className={cn("overflow-hidden transition-all duration-200", className)}
      {...props}
    >
      <div
        className="flex items-center justify-between px-6 cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="py-4">{title}</div>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </div>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </Card>
  );
}

function ExpandableCardContent({
  className,
  ...props
}) {
  return (
    <CardContent
      className={cn("px-6 py-4", className)}
      {...props}
    />
  );
}

function ExpandableCardFooter({
  className,
  ...props
}) {
  return (
    <CardFooter
      className={cn("px-6 py-4 border-t", className)}
      {...props}
    />
  );
}

export { ExpandableCard, ExpandableCardContent, ExpandableCardFooter };