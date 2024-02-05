const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
	constructor(user, url) {
		this.to = user.email;
		this.firstName = user.name.split(' ')[0];
		this.url = url;
		this.sender = process.env.EMAIL_SENDER;
		this.from = process.env.EMAIL_FROM;
	}

	transporter() {
		if (process.env.NODE_ENV === 'production') {
			return nodemailer.createTransport({
				host: process.env.SMTP_SERVER,
				port: process.env.SMTP_PORT,
				secure: false,
				auth: {
					user: process.env.SMTP_LOGIN,
					pass: process.env.SMTP_PASSWORD,
				},
			});
		}

		// Dev mode
		return nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD,
			},
		});
	}

	async send(template, subject) {
		// 1. Render PUG template
		const html = pug.renderFile(
			`${__dirname}/../views/emails/${template}.pug`,
			{
				firstName: this.firstName,
				url: this.url,
				subject,
			}
		);

		// 2. Define email options
		const mailOptions = {
			from: `${this.sender} <${this.from}>`,
			to: this.to,
			subject,
			html,
			text: htmlToText.convert(html),
		};

		// 3. Create a transport and send
		await this.transporter().sendMail(mailOptions);
	}

	async sendWelcome() {
		await this.send('welcome', 'Welcome to Natours!');
	}

	async sendPasswordReset() {
		await this.send('reset', 'Your Password Reset Link (valid for 10 minutes)');
	}
};
