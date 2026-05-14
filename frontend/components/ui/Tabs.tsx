import * as React from "react"
import { motion } from "framer-motion"

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex space-x-1 rounded-xl bg-gray-100 p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex items-center justify-center space-x-2 w-full rounded-lg py-2.5 text-xs font-black uppercase tracking-widest transition-all focus:outline-none ${
            activeTab === tab.id
              ? "text-primary"
              : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 rounded-lg bg-white shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
