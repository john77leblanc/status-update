const nodemailer = require('nodemailer');
require('dotenv').config();

module.exports = {
    send(subject, text) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.DESTINATION,
            subject,
            text
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            }
        });
    }
}