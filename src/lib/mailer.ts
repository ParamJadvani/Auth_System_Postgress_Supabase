import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
        expires: 60 * 60 * 24,
    },
});

export default async function sendEmail({
    subject,
    text,
    html,
    type,
    token,
}: {
    subject: string;
    text: string;
    html: string;
    type: "verify" | "reset";
    token: string;
}) {
    const mailOptions = {
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject,
        text,
        html,
    };

    if (type === "verify") {
        subject = "Verify Your Email Address";
        const verificationLink = `http://localhost:3000/verify-email?token=${token}`;
        text = `Please click the following link to verify your email: ${verificationLink}`;
        html = `<p>Please click the following link to verify your email:</p><a href="${verificationLink}">Verify Email</a>`;
    } else if (type === "reset") {
        subject = "Reset Your Password";
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;
        text = `Click the link below to reset your password: ${resetLink}`;
        html = `<p>Click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`;
    }

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        const errMsg = error as Error;
        console.error("Error sending email:", errMsg.message);
    }
}
