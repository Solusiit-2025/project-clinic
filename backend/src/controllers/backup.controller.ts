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

  private getPgCommand(cmd: 'pg_dump' | 'psql'): string {
    // 1. Check if it's in PATH
    try {
      // Use 'where' on Windows or 'which' on Linux
      const checkCmd = process.platform === 'win32' ? 'where' : 'which';
      // This is a bit slow to do every time, but safe. 
      // For now, let's try common Windows paths if it's not in PATH
    } catch (e) {}

    if (process.platform === 'win32') {
      const commonPaths = [
        'C:\\Program Files\\PostgreSQL\\18\\bin',
        'C:\\Program Files\\PostgreSQL\\17\\bin',
        'C:\\Program Files\\PostgreSQL\\16\\bin',
        'C:\\Program Files\\PostgreSQL\\15\\bin',
        'C:\\Program Files\\PostgreSQL\\14\\bin',
        'C:\\Program Files\\PostgreSQL\\13\\bin',
      ];
      for (const p of commonPaths) {
        const fullPath = path.join(p, `${cmd}.exe`);
        if (fs.existsSync(fullPath)) return `"${fullPath}"`;
      }
    }
    return cmd; // Fallback to PATH
  }

  exportBackup = async (req: Request, res: Response) => {
    try {
      const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
      const filePath = path.join(this.backupDir, fileName);

      // Extract password from DB URL for PGPASSWORD env var
      // Format: postgresql://user:password@host:port/db
      let password = '';
      try {
        const urlMatch = this.dbUrl.match(/:([^:@]+)@/);
        if (urlMatch) password = urlMatch[1];
      } catch (e) {}

      const cmd = this.getPgCommand('pg_dump');
      console.log(`Executing backup using: ${cmd}`);

      // Use spawn with PGPASSWORD environment variable
      const env = { ...process.env, PGPASSWORD: password };
      
      // Wrap filePath in quotes to handle spaces in Windows paths
      const quotedFilePath = `"${filePath}"`;
      
      const pgDump = spawn(cmd, [
        `--dbname=${this.dbUrl}`, 
        '-f', quotedFilePath,
        '--clean', // Drop database objects before recreating
        '--if-exists', // Don't error if objects don't exist
        '--no-owner', // Skip restoration of object ownership
        '--no-privileges' // Skip restoration of access privileges
      ], { 
        env,
        shell: true 
      });

      let errorMsg = '';

      pgDump.stdout.on('data', (data) => {
        console.log(`pg_dump-stdout: ${data}`);
      });

      pgDump.stderr.on('data', (data) => {
        errorMsg += data.toString();
        console.error(`pg_dump-stderr: ${data}`);
      });

      pgDump.on('close', (code) => {
        if (code === 0) {
          if (!fs.existsSync(filePath)) {
            return res.status(500).json({ error: 'Backup file was not created successfully' });
          }
          res.download(filePath, fileName, (err) => {
            if (err) {
              console.error('Download error:', err);
              if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to download backup file' });
              }
            }
          });
        } else {
          console.error(`Backup failed with code ${code}: ${errorMsg}`);
          res.status(500).json({ 
            error: `Gagal membuat backup (Code ${code})`,
            details: errorMsg.includes('not recognized') ? 'pg_dump tidak ditemukan di sistem. Pastikan PostgreSQL bin folder ada di PATH.' : errorMsg
          });
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
      
      // Extract password from DB URL
      let password = '';
      try {
        const urlMatch = this.dbUrl.match(/:([^:@]+)@/);
        if (urlMatch) password = urlMatch[1];
      } catch (e) {}

      const cmd = this.getPgCommand('psql');
      const env = { ...process.env, PGPASSWORD: password };
      
      const quotedFilePath = `"${filePath}"`;

      // 1. First, drop and recreate public schema to ensure a clean slate
      // This prevents "already exists" errors
      const resetCmd = `"${cmd.replace(/"/g, '')}" --dbname="${this.dbUrl}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`;
      
      exec(resetCmd, { env }, (error, stdout, stderr) => {
        if (error) {
          console.warn('Warning during schema reset:', stderr);
          // We continue anyway, maybe it was already clean or has permission issues
        }

        console.log('Schema cleaned, starting data restoration...');

        // 2. Now run the restoration
        const psql = spawn(cmd, [`--dbname=${this.dbUrl}`, '-f', quotedFilePath], { 
          env,
          shell: true 
        });

        let errorMsg = '';

        psql.stdout.on('data', (data) => {
          // console.log(`psql-stdout: ${data}`);
        });

        psql.stderr.on('data', (data) => {
          errorMsg += data.toString();
          // Filter out common notices to avoid flooding logs
          if (!data.toString().includes('NOTICE:')) {
            console.error(`psql-stderr: ${data}`);
          }
        });

        psql.on('close', (code) => {
          // Delete the temporary uploaded file
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

          if (code === 0) {
            console.log('--- DATABASE RESTORE COMPLETED SUCCESSFULLY ---');
            res.json({ message: 'Database restored successfully' });
          } else {
            console.error(`--- DATABASE RESTORE FAILED WITH CODE ${code} ---`);
            res.status(500).json({ 
              error: `Gagal merestore database (Code ${code})`,
              details: errorMsg
            });
          }
        });
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
