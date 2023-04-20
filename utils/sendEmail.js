const nodemailer = require('nodemailer');
require("dotenv").config();


const sendEmail = async (email, subject, text, html) =>{

try {
        const transporter = nodemailer.createTransport({
            host: process.env.HOST,
            port: 465,
            secure: true,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            },
        });

await transporter.sendMail({
            from: process.env.USER,
            to: email,
            subject: subject,
            html: html,
            text: text,
        });

        console.log("email sent sucessfully");
    } catch (error) {
        console.log(error, "email not sent");
    }


}

module.exports = sendEmail;	