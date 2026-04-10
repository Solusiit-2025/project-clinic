import { Router } from 'express';
import { BackupController } from '../controllers/backup.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const controller = new BackupController();

// Configure storage for SQL files
const backupDir = path.join(__dirname, '../../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, backupDir);
  },
  filename: (req, file, cb) => {
    cb(null, `restore-${Date.now()}.sql`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.sql') {
      cb(null, true);
    } else {
      cb(new Error('Hanya file .sql yang diizinkan!'));
    }
  }
});

// All backup/restore routes are restricted to SUPER_ADMIN
router.get('/list', authMiddleware, roleMiddleware(['SUPER_ADMIN']), controller.getBackupList);
router.get('/download', authMiddleware, roleMiddleware(['SUPER_ADMIN']), controller.exportBackup);
router.post('/restore', authMiddleware, roleMiddleware(['SUPER_ADMIN']), upload.single('file'), controller.importBackup);

export default router;
