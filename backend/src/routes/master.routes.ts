import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import {
  getUsers, createUser, updateUser, deleteUser, getUnlinkedDoctorUsers,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getDoctors, createDoctor, updateDoctor, deleteDoctor,
  getSchedules, createSchedule, updateSchedule, deleteSchedule,
  getServices, createService, updateService, deleteService, getNextServiceCode,
  getServiceCategories, createServiceCategory, updateServiceCategory, deleteServiceCategory,
  getMedicines, createMedicine, updateMedicine, deleteMedicine,
  getExpenseCategories, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
  getProductMasters, createProductMaster, updateProductMaster, deleteProductMaster,
  getClinics, createClinic, updateClinic, deleteClinic,
  getAssets, createAsset, updateAsset, deleteAsset,
  getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory,
  getInventoryProducts, createInventoryProduct, updateInventoryProduct, deleteInventoryProduct,
  getPatients, getPatientById, getNextMRNo, createPatient, updatePatient, deletePatient
} from '../controllers/master.controller'

import { upload } from '../middleware/upload.middleware'

const masterRoutes = Router()

// All master routes require authentication
masterRoutes.use(authMiddleware)

// Users
masterRoutes.get('/users', getUsers)
masterRoutes.post('/users', createUser)
masterRoutes.put('/users/:id', updateUser)
masterRoutes.delete('/users/:id', deleteUser)
masterRoutes.get('/users/unlinked-doctors', getUnlinkedDoctorUsers)

// Departments
masterRoutes.get('/departments', getDepartments)
masterRoutes.post('/departments', createDepartment)
masterRoutes.put('/departments/:id', updateDepartment)
masterRoutes.delete('/departments/:id', deleteDepartment)

// Doctors
masterRoutes.get('/doctors', getDoctors)
masterRoutes.post('/doctors', upload.single('photo'), createDoctor)
masterRoutes.put('/doctors/:id', upload.single('photo'), updateDoctor)
masterRoutes.delete('/doctors/:id', deleteDoctor)

// Doctor Schedules
masterRoutes.get('/schedules', getSchedules)
masterRoutes.post('/schedules', createSchedule)
masterRoutes.put('/schedules/:id', updateSchedule)
masterRoutes.delete('/schedules/:id', deleteSchedule)

// Services
masterRoutes.get('/services', getServices)
masterRoutes.get('/services/next-code', getNextServiceCode)
masterRoutes.post('/services', createService)
masterRoutes.put('/services/:id', updateService)
masterRoutes.delete('/services/:id', deleteService)

// Service Categories
masterRoutes.get('/service-categories', getServiceCategories)
masterRoutes.post('/service-categories', createServiceCategory)
masterRoutes.put('/service-categories/:id', updateServiceCategory)
masterRoutes.delete('/service-categories/:id', deleteServiceCategory)

// Medicines
masterRoutes.get('/medicines', getMedicines)
masterRoutes.post('/medicines', upload.single('image'), createMedicine)
masterRoutes.put('/medicines/:id', upload.single('image'), updateMedicine)
masterRoutes.delete('/medicines/:id', deleteMedicine)

// Expense Categories
masterRoutes.get('/expense-categories', getExpenseCategories)
masterRoutes.post('/expense-categories', createExpenseCategory)
masterRoutes.put('/expense-categories/:id', updateExpenseCategory)
masterRoutes.delete('/expense-categories/:id', deleteExpenseCategory)

// Product Master
masterRoutes.get('/products', getProductMasters)
masterRoutes.post('/products', createProductMaster)
masterRoutes.put('/products/:id', updateProductMaster)
masterRoutes.delete('/products/:id', deleteProductMaster)

// Clinics (Branches)
masterRoutes.get('/clinics', getClinics)
masterRoutes.post('/clinics', createClinic)
masterRoutes.put('/clinics/:id', updateClinic)
masterRoutes.delete('/clinics/:id', deleteClinic)

// Product Categories
masterRoutes.get('/product-categories', getProductCategories)
masterRoutes.post('/product-categories', createProductCategory)
masterRoutes.put('/product-categories/:id', updateProductCategory)
masterRoutes.delete('/product-categories/:id', deleteProductCategory)

// Assets
masterRoutes.get('/assets', getAssets)
masterRoutes.post('/assets', upload.single('image'), createAsset)
masterRoutes.put('/assets/:id', upload.single('image'), updateAsset)
masterRoutes.delete('/assets/:id', deleteAsset)

// Inventory (Products)
masterRoutes.get('/inventory', getInventoryProducts)
masterRoutes.post('/inventory', upload.single('image'), createInventoryProduct)
masterRoutes.put('/inventory/:id', upload.single('image'), updateInventoryProduct)
masterRoutes.delete('/inventory/:id', deleteInventoryProduct)

// Patients
masterRoutes.get('/patients', getPatients)
masterRoutes.get('/patients/next-mr', getNextMRNo)
masterRoutes.get('/patients/:id', getPatientById)
masterRoutes.post('/patients', createPatient)
masterRoutes.put('/patients/:id', updatePatient)
masterRoutes.delete('/patients/:id', deletePatient)

export default masterRoutes
