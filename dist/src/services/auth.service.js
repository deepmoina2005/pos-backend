import { prisma } from "../lib/prisma.js";
import { hashPassword, comparePassword, generateToken } from "../utils/security.util.js";
import { UserException, ResourceNotFoundError } from "../exceptions/AppError.js";
import { EmailService } from "./email.service.js";
export class AuthService {
    static maskEmail(email) {
        const [local, domain] = email.split("@");
        if (!local || !domain)
            return "***";
        if (local.length <= 2)
            return `***@${domain}`;
        return `${local.slice(0, 2)}***@${domain}`;
    }
    static isUniqueConstraintError(error) {
        return (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002");
    }
    static async signup(data) {
        const email = data.email.trim().toLowerCase();
        const phoneNumber = data.phoneNumber?.trim() || undefined;
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    ...(phoneNumber ? [{ phoneNumber }] : []),
                ],
            },
        });
        if (existingUser) {
            if (existingUser.email === email) {
                throw new UserException("Email already in use");
            }
            throw new UserException("Phone number already in use");
        }
        const hashedPassword = await hashPassword(data.password);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName: data.fullName,
                phoneNumber,
                role: data.role,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true,
            },
        });
        const jwt = generateToken(user.email, user.role, user.id);
        return {
            jwt,
            message: "Signup successful",
            role: user.role,
            user
        };
    }
    static async login(data) {
        const email = data.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            console.log("[AuthService] User not found:", email);
            throw new UserException("Invalid email or password");
        }
        const isPasswordValid = await comparePassword(data.password, user.password);
        if (!isPasswordValid) {
            console.log("[AuthService] Invalid password for:", email);
            throw new UserException("Invalid email or password");
        }
        const jwt = generateToken(user.email, user.role, user.id);
        return {
            jwt,
            message: "Login success",
            role: user.role,
        };
    }
    static async forgotPassword(data) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new ResourceNotFoundError("User", data.email);
        }
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryDate = new Date(Date.now() + 15 * 60000); // 15 minutes
        const updated = await prisma.passwordResetToken.updateMany({
            where: { userId: user.id },
            data: { token, expiryDate },
        });
        if (updated.count === 0) {
            try {
                await prisma.passwordResetToken.create({
                    data: { userId: user.id, token, expiryDate },
                });
            }
            catch (error) {
                if (this.isUniqueConstraintError(error)) {
                    await prisma.passwordResetToken.update({
                        where: { userId: user.id },
                        data: { token, expiryDate },
                    });
                }
                else {
                    throw error;
                }
            }
        }
        // Send OTP email
        await EmailService.sendResetPasswordOTP(user.email, token);
        return { message: "Password reset OTP sent to email" };
    }
    static async resetPassword(data) {
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: { token: data.token },
            include: { user: true },
        });
        if (!resetToken || resetToken.expiryDate < new Date()) {
            throw new UserException("Invalid or expired reset token");
        }
        const hashedPassword = await hashPassword(data.password);
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        });
        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id },
        });
        return { message: "Password updated successfully" };
    }
    static async verifyResetToken(data) {
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: { token: data.token },
        });
        if (!resetToken || resetToken.expiryDate < new Date()) {
            throw new UserException("Invalid or expired reset token");
        }
        return { message: "Token is valid", token: data.token };
    }
    static async sendEmailOTP(data) {
        const email = data.email.trim().toLowerCase();
        const safeEmail = this.maskEmail(email);
        console.log(`[AuthService.sendEmailOTP] request received for ${safeEmail}`);
        const existingOtp = await prisma.emailVerification.findUnique({
            where: { email },
            select: { id: true },
        });
        console.log(`[AuthService.sendEmailOTP] existing otp record: ${existingOtp ? "found" : "not found"}`);
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryDate = new Date(Date.now() + 10 * 60000); // 10 minutes
        console.log(`[AuthService.sendEmailOTP] otp generated for ${safeEmail}`);
        const updated = await prisma.emailVerification.updateMany({
            where: { email },
            data: { otp, expiryDate },
        });
        if (updated.count === 0) {
            try {
                await prisma.emailVerification.create({
                    data: { email, otp, expiryDate },
                });
                console.log(`[AuthService.sendEmailOTP] otp record created for ${safeEmail}`);
            }
            catch (error) {
                if (this.isUniqueConstraintError(error)) {
                    await prisma.emailVerification.update({
                        where: { email },
                        data: { otp, expiryDate },
                    });
                    console.log(`[AuthService.sendEmailOTP] concurrent create detected, otp record updated for ${safeEmail}`);
                }
                else {
                    throw error;
                }
            }
        }
        else {
            console.log(`[AuthService.sendEmailOTP] otp record updated for ${safeEmail}`);
        }
        console.log(`[AuthService.sendEmailOTP] email send started for ${safeEmail}`);
        await EmailService.sendVerificationOTP(email, otp);
        console.log(`[AuthService.sendEmailOTP] completed successfully for ${safeEmail}`);
        return { message: "Verification OTP sent to your email" };
    }
    static async verifyEmailOTP(data) {
        const email = data.email.trim().toLowerCase();
        const record = await prisma.emailVerification.findUnique({
            where: { email },
        });
        if (!record || record.otp !== data.otp || record.expiryDate < new Date()) {
            throw new UserException("Invalid or expired OTP");
        }
        // OTP is valid, we can delete it or mark as verified
        await prisma.emailVerification.delete({
            where: { email },
        });
        return { message: "Email verified successfully", email };
    }
}
