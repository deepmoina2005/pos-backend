import "dotenv/config";
import { EmailService } from "../services/email.service.js";
import fs from "fs";
async function testMail() {
    console.log("Starting mail test...");
    // Verify connection
    const isConnected = await EmailService.verifyConnection();
    if (!isConnected) {
        // We already log to console, but let's also write to file for capture
        fs.writeFileSync("smtp-error.txt", "SMTP Connection failed. Check console for details or see if this logs help.\n");
        process.exit(1);
    }
    const testEmail = process.env.MAIL_USER || "test@example.com";
    console.log(`Sending test OTP to ${testEmail}...`);
    await EmailService.sendVerificationOTP(testEmail, "123456");
    console.log("Test OTP sent. Please check your inbox (or console if credentials are missing).");
    // Test reset password email
    console.log(`Sending test reset email to ${testEmail}...`);
    await EmailService.sendResetPasswordOTP(testEmail, "654321");
    console.log("Test reset email sent.");
}
testMail().catch(console.error);
