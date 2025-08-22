import * as React from "react"

// Neutralized tooltip components - render children only
const TooltipProvider = ({ children, ...props }: any) => <>{children}</>
const Tooltip = ({ children, ...props }: any) => <>{children}</>
const TooltipTrigger = React.forwardRef<HTMLDivElement, any>(
  ({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>
)
const TooltipContent = ({ children, ...props }: any) => null

TooltipTrigger.displayName = "TooltipTrigger"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
