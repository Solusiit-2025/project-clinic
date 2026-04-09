'use client'

import { motion } from 'framer-motion'
import { FiUsers, FiCalendar, FiActivity, FiArrowUpRight, FiClock, FiPlus } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'

const stats = [
  { label: 'Total Patients', value: '1,248', icon: FiUsers, color: 'bg-blue-500', trend: '+12.5%' },
  { label: 'Appointments', value: '42', icon: FiCalendar, color: 'bg-purple-500', trend: '+8.2%' },
  { label: 'Avg. Treatment', value: '15m', icon: FiClock, color: 'bg-emerald-500', trend: '-2.4%' },
  { label: 'Patient Satisfaction', value: '98%', icon: FiActivity, color: 'bg-orange-500', trend: '+1.1%' },
]

export default function AdminDashboard() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-extrabold text-gray-900 tracking-tight"
          >
            Dashboard <span className="text-primary">Overview</span>
          </motion.h1>
          <p className="text-gray-500 font-medium">Welcome back, {user?.name || 'Administrator'}. Here's what's happening today.</p>
        </div>
        
        <button className="btn-primary px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-1 transition-all">
          <FiPlus className="w-5 h-5" />
          Quick Registration
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 rounded-3xl border border-gray-50 shadow-sm shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 ${stat.color} bg-opacity-10 rounded-2xl flex items-center justify-center`}>
                <stat.icon className={`w-7 h-7 text-white ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">
                {stat.trend}
                <FiArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activities Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm"
        >
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900">Recent Appointments</h3>
            <button className="text-sm font-bold text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-8">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Patient" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">Patient Name {i+1}</p>
                    <p className="text-xs font-semibold text-gray-400">Scheduled for Dr. Practitioner</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">10:30 AM</p>
                  <p className="text-xs font-semibold text-primary/60">Outpatient</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col justify-center items-center text-center space-y-6"
        >
          <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center animate-pulse">
            <FiActivity className="w-16 h-16 text-primary/20" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">Activity Monitoring</h3>
            <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed font-medium">Real-time monitoring of all clinic modules. Updates will appear here shortly.</p>
          </div>
          <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-gray-200">
            Explore Logs
          </button>
        </motion.div>
      </div>
    </div>
  )
}
