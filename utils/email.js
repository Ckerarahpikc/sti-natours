const nodemailer = require('nodemailer');
const pug = require('pug');
const htmltotext = require('html-to-text');

// info: this is a Email configuration and sending to the user with the specific purpose, can be used like so:
//                   new Email(user, url).sendPurpose();
module.exports = class Email {
  constructor(user, url) {
    (this.from = `natours.io <${process.env.EMAIL_FROM}>`),
      (this.to = user.email),
      (this.url = url),
      (this.username = user.name);
  }

  // info: here is the actual transmitter configuration (port, service, auth) based on the environment
  newTransmitter() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: process.env.MAILJET_HOST,
        port: process.env.NODE_PORT,
        auth: {
          user: process.env.MAILJET_USERNAME,
          pass: process.env.MAILJET_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // info: here is the send method which will get the template and subject to configure and render the actual email
  async send(template, subject) {
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstname: this.username.split(' ')[0],
        url: this.url,
        subject
      }
    );

    const mailerOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmltotext.convert(html)
    };

    await this.newTransmitter().sendMail(mailerOptions);
  }

  // info: here is the actual templates with subjects that we would call from the Email instance (which is very easy and clean)
  async sendWelcome() {
    await this.send(
      'welcome',
      "Welcome to Natours, we're glad to have you 🎉🙏"
    );
  }

  async sendResetToken() {
    await this.send(
      'resettoken',
      'Forgot your password? Submit a PATCH request with you new password and passwordConfirm to:'
    );
  }
};
