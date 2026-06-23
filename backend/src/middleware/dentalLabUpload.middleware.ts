import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads/dental-lab')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'dental-lab-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.stl', '.obj']
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
    'application/pdf', 'application/x-pdf',
    // MIME for 3D files can vary, often application/octet-stream or specific ones
    'application/octet-stream', 'model/stl', 'model/obj'
  ]
  
  const extension = path.extname(file.originalname).toLowerCase()
  const mimetype = file.mimetype
  
  console.log(`[Upload Filter] File: ${file.originalname}, Ext: ${extension}, MIME: ${mimetype}`)

  if (allowedExtensions.includes(extension) || allowedMimeTypes.includes(mimetype)) {
    return cb(null, true)
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, WEBP), PDF, atau 3D (STL, OBJ) yang diizinkan!'))
  }
}

export const dentalLabUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit to accommodate 3D scanner files
  fileFilter
})
