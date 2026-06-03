import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const clinicId = req.headers['x-clinic-id'] as string
    // Get target role from query, or fallback to user role
    const targetRole = req.query.role as string || (req as any).user?.role
    
    if (!clinicId) {
      return res.status(400).json({ message: 'Clinic ID is required' })
    }

    const where: any = { clinicId }
    
    if (targetRole) {
      where.targetRole = targetRole
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to latest 50 notifications
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
