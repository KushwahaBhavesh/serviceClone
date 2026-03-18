import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          // Variants
          variant === 'primary' && "bg-[#0ea5e9] text-white hover:bg-[#0284c7] shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] hover:-translate-y-0.5",
          variant === 'secondary' && "bg-[#1e293b] text-white hover:bg-[#0f172a] shadow-sm",
          variant === 'danger' && "bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-[0_4px_14px_0_rgba(239,68,68,0.39)]",
          variant === 'outline' && "border border-[#e2e8f0] bg-transparent text-[#0f172a] hover:bg-[#f8fafc]",
          variant === 'ghost' && "bg-transparent text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]",
          // Sizes
          size === 'sm' && "h-8 px-3 text-xs rounded-sm",
          size === 'md' && "h-11 px-6 text-sm rounded-md",
          size === 'lg' && "h-14 px-8 text-base rounded-md",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
