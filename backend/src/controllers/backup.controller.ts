import { Request, Response } from 'express';
import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export class BackupController {
  private backupDir = path.join(__dirname, '../../../backups');
  private dbUrl = process.env.DATABASE_URL || '';

  constructor() {
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  exportBackup = async (req: Request, res: Response) => {
    try {
      const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
      const filePath = path.join(this.backupDir, fileName);

      // Using pg_dump to export database
      // Format: pg_dump --dbname=CONNECTION_STRING -f FILE_PATH
      const pgDump = spawn('pg_dump', [`--dbname=${this.dbUrl}`, '-f', filePath]);

      pgDump.stdout.on('data', (data) => {
        console.log(`pg_dump-stdout: ${data}`);
      });

      pgDump.stderr.on('data', (data) => {
        console.error(`pg_dump-stderr: ${data}`);
      });

      pgDump.on('close', (code) => {
        if (code === 0) {
          res.download(filePath, fileName, (err) => {
            if (err) {
              console.error('Download error:', err);
              if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to download backup file' });
              }
            }
            // Optional: delete file after download if you don't want to keep it locally
            // fs.unlinkSync(filePath);
          });
        } else {
          res.status(500).json({ error: `pg_dump failed with code ${code}` });
        }
      });
    } catch (error) {
      console.error('Backup error:', error);
      res.status(500).json({ error: 'Internal server error while creating backup' });
    }
  };

  importBackup = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No backup file uploaded' });
      }

      const filePath = req.file.path;
      
      // Using psql to restore database
      // Format: psql --dbname=CONNECTION_STRING -f FILE_PATH
      // Warning: This will attempt to restore into current database
      
      // Before restoring, we might want to kill active connections or drop/recreate public schema 
      // but psql -f should work for basic SQL dumps.
      
      const psql = spawn('psql', [`--dbname=${this.dbUrl}`, '-f', filePath]);

      psql.stdout.on('data', (data) => {
        console.log(`psql-stdout: ${data}`);
      });

      psql.stderr.on('data', (data) => {
        console.error(`psql-stderr: ${data}`);
      });

      psql.on('close', (code) => {
        // Delete the temporary uploaded file
        fs.unlinkSync(filePath);

        if (code === 0) {
          res.json({ message: 'Database restored successfully' });
        } else {
          res.status(500).json({ error: `psql failed with code ${code}. Check logs for details.` });
        }
      });
    } catch (error) {
      console.error('Restore error:', error);
      res.status(500).json({ error: 'Internal server error while restoring database' });
    }
  };

  getBackupList = async (req: Request, res: Response) => {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.endsWith('.sql'))
        .map(f => {
          const stats = fs.statSync(path.join(this.backupDir, f));
          return {
            filename: f,
            size: stats.size,
            createdAt: stats.birthtime
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      res.json(files);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get backup list' });
    }
  };
}
