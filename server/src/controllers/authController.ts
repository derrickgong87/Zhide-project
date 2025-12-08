import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['B_SIDE', 'C_SIDE']),
  name: z.string().optional(),
});

export const AuthController = {
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, role, name } = registerSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(400).json({ error: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          name,
        },
      });

      const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });

    } catch (error) {
      res.status(400).json({ error: 'Validation failed or database error' });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });

    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};