import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const clinicId = req.headers['x-clinic-id'] as string
    const userRole = (req as any).user?.role
    const targetRole = req.query.role as string | undefined
    
    if (!clinicId) {
      return res.status(400).json({ message: 'Clinic ID is required' })
    }

    // SUPER_ADMIN & ADMIN see all notifications (no filter)
    // Other roles see: their own targetRole + broadcast (targetRole: null)
    const isAdminRole = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'

    const where: any = isAdminRole
      ? { clinicId }
      : { clinicId, OR: [{ targetRole: targetRole || userRole }, { targetRole: null }] }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json(notifications)
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    })

    res.json(notification)
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const clinicId = req.headers['x-clinic-id'] as string
    const targetRole = req.query.role as string || (req as any).user?.role

    if (!clinicId) {
      return res.status(400).json({ message: 'Clinic ID is required' })
    }

    const where: any = { clinicId, isRead: false }
    if (targetRole) {
      where.targetRole = targetRole
    }

    await prisma.notification.updateMany({
      where,
      data: { isRead: true }
    })

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}
