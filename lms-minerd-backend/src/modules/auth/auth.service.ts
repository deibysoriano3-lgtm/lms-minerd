import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.usuario.findUnique({ where: { email } });
        if (user) {
            // bcrypt.compare evalua el hash guardado vs el password enviado por el Frontend
            const isMatch = await bcrypt.compare(pass, user.password_hash);
            if (isMatch) {
                const { password_hash, ...result } = user;
                return result;
            }
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, rol: user.rol, nombre: user.nombre_completo };
        return {
            access_token: this.jwtService.sign(payload),
            user: payload
        };
    }
}
