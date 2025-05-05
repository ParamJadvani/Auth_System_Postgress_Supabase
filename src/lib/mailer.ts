// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASSWORD,
//         expires: 60 * 60 * 24,
//     },
// });

// export default async function sendEmail({
//     subject,
//     text,
//     html,
//     type,
//     token,
// }: {
//     subject: string;
//     text: string;
//     html: string;
//     type: "verify" | "reset";
//     token: string;
// }) {
//     const mailOptions = {
//         from: process.env.EMAIL,
//         to: process.env.EMAIL,
//         subject,
//         text,
//         html,
//     };

//     if (type === "verify") {
//         subject = "Verify Your Email Address";
//         const verificationLink = `http://localhost:3000/verify-email?token=${token}`;
//         text = `Please click the following link to verify your email: ${verificationLink}`;
//         html = `<p>Please click the following link to verify your email:</p><a href="${verificationLink}">Verify Email</a>`;
//     } else if (type === "reset") {
//         subject = "Reset Your Password";
//         const resetLink = `http://localhost:3000/reset-password?token=${token}`;
//         text = `Click the link below to reset your password: ${resetLink}`;
//         html = `<p>Click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`;
//     }

//     try {
//         await transporter.sendMail(mailOptions);
//     } catch (error) {
//         const errMsg = error as Error;
//         console.error("Error sending email:", errMsg.message);
//     }
// }

import nodemailer from "nodemailer";

// Create reusable transporter object
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false, // For development only, remove in production
    },
});

// Template for verification email
const createVerificationEmailTemplate = (verificationLink: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4a56e2; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }
            .content { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #4a56e2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 20px; font-size: 12px; color: #777; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Verify Your Email Address</h2>
            </div>
            <div class="content">
                <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
                <p>Click the button below to verify your email:</p>
                <a href="${verificationLink}" class="button">Verify Email</a>
                <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
                <p>${verificationLink}</p>
                <p>This link will expire in 24 hours.</p>
            </div>
            <div class="footer">
                <p>This email was sent automatically. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Template for password reset email
const createPasswordResetEmailTemplate = (resetLink: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4a56e2; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }
            .content { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #4a56e2; color: white; text-decoration: none; padding: 10px