import nodemailer from "nodemailer";
export class EmailService {
    static transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT || 587),
        secure: Number(process.env.MAIL_PORT) === 465, // true for 465, false for other ports
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
    /**
     * Verifies the SMTP connection
     */
    static async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log("SMTP Connection verified successfully");
            return true;
        }
        catch (error) {
            console.error("SMTP Connection failed:", error);
            const fs = await import("fs");
            fs.writeFileSync("smtp-details.json", JSON.stringify(error, null, 2));
            return false;
        }
    }
    static async sendResetPasswordOTP(to, otp) {
        console.log(`[EmailService] Sending reset password OTP: ${otp} to ${to}`);
        try {
            if (process.env.MAIL_USER && process.env.MAIL_PASS) {
                await this.transporter.sendMail({
                    from: `"${process.env.APP_NAME || 'POS Pro'}" <${process.env.MAIL_FROM}>`,
                    to,
                    subject: "Reset Your Password - OTP",
                    text: `Your password reset code is: ${otp}. It will expire in 15 minutes.`,
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0f172a;">Reset Your Password</h2>
              <p style="color: #64748b;">Use the code below to reset your account password:</p>
              <div style="background: #f8fafc; border: 2px solid #e2e8f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a; border-radius: 12px; margin: 24px 0;">
                ${otp}
              </div>
              <p style="color: #94a3b8; font-size: 14px;">This code will expire in 15 minutes. If you didn't request this, please ignore this email.</p>
            </div>
          `,
                });
                console.log(`Reset password OTP sent to ${to}`);
            }
            else {
                console.warn("Mail credentials missing, skipping email send");
            }
        }
        catch (error) {
            console.error(`Failed to send reset OTP to ${to}:`, error);
        }
    }
    static async sendVerificationOTP(to, otp) {
        console.log(`Sending verification OTP to ${to}`);
        try {
            if (process.env.MAIL_USER && process.env.MAIL_PASS) {
                await this.transporter.sendMail({
                    from: `"${process.env.APP_NAME || 'POS Pro'}" <${process.env.MAIL_FROM}>`,
                    to,
                    subject: "Verify Your Email - POS Pro",
                    text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0f172a;">Verify Your Email</h2>
              <p style="color: #64748b;">Use the code below to complete your registration:</p>
              <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #020617; border-radius: 12px; margin: 24px 0;">
                ${otp}
              </div>
              <p style="color: #94a3b8; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
            </div>
          `,
                });
                console.log(`Verification OTP sent to ${to}`);
            }
            else {
                console.warn("Mail credentials missing, skipping email send");
            }
        }
        catch (error) {
            console.error(`Failed to send verification OTP to ${to}:`, error);
            throw error;
        }
    }
}
