import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads/lab')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'lab-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'application/x-pdf']
  
  const extension = path.extname(file.originalname).toLowerCase()
  const mimetype = file.mimetype
  
  console.log(`[Upload Filter] File: ${file.originalname}, Ext: ${extension}, MIME: ${mimetype}`)

  if (allowedExtensions.includes(extension) || allowedMimeTypes.includes(mimetype)) {
    return cb(null, true)
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, WEBP) dan PDF yang diizinkan!'))
  }
}

export const labUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
})
