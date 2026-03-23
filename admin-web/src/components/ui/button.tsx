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
          "inline-flex items-center justify-center font-bold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]",
          // Variants
          variant === 'primary' && "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 hover:-translate-y-0.5",
          variant === 'secondary' && "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100/50 hover:-translate-y-0.5",
          variant === 'danger' && "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-100",
          variant === 'outline' && "border-2 border-slate-200 bg-transparent text-slate-900 hover:bg-slate-50 hover:border-slate-300",
          variant === 'ghost' && "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900",
          // Sizes
          size === 'sm' && "h-9 px-4 text-xs rounded-xl",
          size === 'md' && "h-12 px-7 text-sm rounded-xl",
          size === 'lg' && "h-14 px-10 text-base rounded-2xl",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
