import nodemailer from 'nodemailer'

export default async function (mailOptions) {
  const transporter = nodemailer.createTransport({
    host: '',
    port: 587,
    auth: {
      user: '',
      pass: ''
    }
  })
  const options = {
    ...mailOptions,
    from: '',
    to: ''
  }

  return transporter.sendMail(options, function (err, info) {
    if (err) console.log(err)
    else console.log(info)
  })
}

export const completedMailOptions = (streams, revenue) => ({
  subject: 'Complete',
  html: `<p>${streams} streams are completed</p>
  <p>The revenue: $${revenue}</p>`
})

export const dailyRevenueMailOptions = (data) => ({
  subject: `Daily revenue - ${data.date}`,
  html: `<p>${data.value} streams are completed</p>
  <p>The revenue: $${data.revenue}</p>`
})

export const monthlyRevenueMailOptions = (data) => ({
  subject: `Monthly revenue - ${data.date}`,
  html: `<p>${data.value} streams are completed</p>
  <p>The revenue: $${data.revenue}</p>`
})

export const errorMailOptions = (error) => ({
  subject: 'Error occured',
  text: error
})
