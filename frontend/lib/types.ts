// Clinic
export interface Clinic {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// User & Auth
export interface User {
  id: string
  email: string
  username: string
  name: string
  phone?: string
  role: 'admin' | 'doctor' | 'staff' | 'receptionist'
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  clinics?: Clinic[]
}

// Patient
export interface Patient {
  id: string
  medicalRecordNo: string
  name: string
  email?: string
  phone: string
  address?: string
  city?: string
  province?: string
  zipCode?: string
  dateOfBirth?: Date
  gender?: 'M' | 'F'
  bloodType?: string
  identityType?: string
  identityNumber?: string
  emergencyContact?: string
  emergencyPhone?: string
  allergies?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Doctor
export interface Doctor {
  id: string
  userId: string
  licenseNumber: string
  name: string
  email?: string
  phone: string
  specialization: string
  department?: string
  bio?: string
  profilePicture?: string
  yearsOfExperience?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Appointment
export interface Appointment {
  id: string
  appointmentNo: string
  patientId: string
  doctorId: string
  appointmentDate: Date
  appDurationMin: number
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  notes?: string
  cancelReason?: string
  createdAt: Date
  updatedAt: Date
}

// Queue
export interface QueueNumber {
  id: string
  queueNo: string
  patientId: string
  appointmentId?: string
  queueDate: Date
  estimatedTime?: Date
  actualCallTime?: Date
  status: 'waiting' | 'called' | 'ongoing' | 'completed' | 'no-show'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Product
export interface ProductMaster {
  id: string
  masterCode: string
  masterName: string
  description?: string
  category: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  masterProductId: string
  productCode: string
  sku: string
  productName: string
  description?: string
  unit: string
  purchaseUnit: string
  storageUnit: string
  usedUnit: string
  quantity: number
  minimumStock: number
  reorderQuantity: number
  purchasePrice: number
  sellingPrice: number
  supplier?: string
  lastPurchaseDate?: Date
  expiryDate?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Invoice
export interface Invoice {
  id: string
  invoiceNo: string
  appointmentId?: string
  patientId: string
  invoiceDate: Date
  dueDate?: Date
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Login Request/Response
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}
