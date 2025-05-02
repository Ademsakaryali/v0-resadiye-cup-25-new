import * as React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} role="alert" className={className} {...props}>
      {children}
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className="mb-1 font-medium leading-none tracking-tight" {...props} />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className="text-sm" {...props} />,
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
