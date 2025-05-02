import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
})
Badge.displayName = "Badge"

export { Badge }
