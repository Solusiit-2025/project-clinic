import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`px-6 py-4 border-b border-gray-50 bg-gray-50/30 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', ...props }: CardProps) {
  return (
    <h3 
      className={`text-lg font-bold text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`px-6 py-4 border-t border-gray-50 bg-gray-50/30 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
