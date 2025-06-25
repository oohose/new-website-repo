// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message, eventType, eventDate } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Check if email configuration is available
    if (!process.env.EMAIL_FROM || !process.env.EMAIL_APP_PASSWORD) {
      console.warn('Email configuration missing. Contact form cannot be processed.')
      return NextResponse.json(
        { error: 'Email service is not configured. Please try again later or contact us directly.' },
        { status: 503 }
      )
    }

    try {
      // Create transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      })

      // Verify transporter configuration
      await transporter.verify()

      // Format event date for email
      const formatEventDate = (dateString: string) => {
        try {
          return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        } catch {
          return dateString
        }
      }

      // Email content for admin (cleaner format since it appears from client)
      const adminEmailContent = `
${message}

---
Contact Details:
Phone: ${process.env.PHOTOGRAPHER_PHONE || 'Not provided'}
${eventType ? `Event Type: ${eventType}` : ''}
${eventDate ? `Event Date: ${formatEventDate(eventDate)}` : ''}

Submitted via website contact form at ${new Date().toLocaleString()}
      `.trim()

      // Send email to admin (appears to come from client)
      await transporter.sendMail({
        from: `"${name}" <${process.env.EMAIL_FROM}>`, // Display name shows client's name
        to: process.env.EMAIL_TO || process.env.EMAIL_FROM,
        subject: `New Contact Form Submission from ${name}`,
        text: adminEmailContent,
        replyTo: email, // When you hit "Reply", it goes to the client's email
        headers: {
          'X-Original-Sender': email, // Custom header showing original sender
        }
      })

      // Send auto-reply to the user
      const autoReplyContent = `
Hi ${name},

Thank you for reaching out! I've received your message and will get back to you within 24-48 hours.

${eventType ? `I see you're interested in ${eventType.toLowerCase()} photography. ` : ''}I'm excited to learn more about your vision and how I can help capture your special moments.

Best regards,
${process.env.PHOTOGRAPHER_NAME || 'Peyton Snipes'}

---
This is an automated reply. Please do not reply to this email.
If you need immediate assistance, please call ${process.env.PHOTOGRAPHER_PHONE || '(832) 910-6932'}.
      `.trim()

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Thank you for your inquiry - Peyton\'s Photography',
        text: autoReplyContent,
      })

      return NextResponse.json({ 
        message: 'Message sent successfully! Check your email for a confirmation.' 
      })

    } catch (emailError) {
      console.error('Email sending error:', emailError)
      
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later or contact us directly.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Contact form error:', error)
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process your message. Please try again later.' },
      { status: 500 }
    )
  }
}