import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      clinicId?: string | null;
      isAdminView?: boolean;
    }
  }
}
