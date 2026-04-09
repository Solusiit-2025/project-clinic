import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password harus diisi' })
      }

      const result = await AuthService.login(email, password)
      res.status(200).json(result)
    } catch (error) {
      res.status(401).json({ message: (error as Error).message })
    }
  }

  static async me(req: any, res: Response) {
    try {
      const user = req.user
      res.status(200).json(user)
    } catch (error) {
      res.status(401).json({ message: (error as Error).message })
    }
  }
}
