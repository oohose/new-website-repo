// app/api/contact/route.ts - Using Resend with custom domain
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Contact API called')
    
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

    // Check for Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ Resend API key missing')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      )
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Format event date
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

    // Email content
    const emailContent = `
New contact form submission from ${name}

Contact Details:
• Name: ${name}
• Email: ${email}
${eventType ? `• Event Type: ${eventType}` : ''}
${eventDate ? `• Event Date: ${formatEventDate(eventDate)}` : ''}

Message:
${message}

---
Submitted: ${new Date().toLocaleString()}
Reply directly to this email to respond to ${name}.
    `.trim()

    try {
      console.log('📧 Sending email via Resend...')
      
      // Send email to you using your custom domain
      const result = await resend.emails.send({
        from: 'Contact Form <contact@peysphotos.com>', // ✅ Your custom domain
        to: [process.env.EMAIL_TO || 'peysphotos06@gmail.com'],
        subject: `New Contact: ${name} - ${eventType || 'General Inquiry'}`,
        text: emailContent,
        replyTo: email, // When you reply, it goes to the visitor
      })

      console.log('✅ Email sent via Resend:', result)

      // Send auto-reply to visitor
      try {
        await resend.emails.send({
          from: 'Peyton\'s Photography <hello@peysphotos.com>', // ✅ Your custom domain
          to: [email],
          subject: 'Thank you for your inquiry - Peyton\'s Photography',
          text: `Hi ${name},

Thank you for reaching out! I've received your message and will get back to you within 24-48 hours.

${eventType ? `I see you're interested in ${eventType.toLowerCase()} photography. ` : ''}I'm excited to learn more about your vision and how I can help capture your special moments.

Best regards,
Peyton Snipes

---
Peyton's Photography
Phone: (832) 910-6932
Email: peysphotos6@gmail.com
Website: peysphotos.com
Instagram: @pey.s6

This is an automated confirmation. Please don't reply to this email - instead, I'll contact you directly from peysphotos06@gmail.com.`
        })
        console.log('✅ Auto-reply sent')
      } catch (autoReplyError) {
        console.warn('⚠️ Auto-reply failed (but main email sent):', autoReplyError)
        // Don't fail the whole request if auto-reply fails
      }

      return NextResponse.json({ 
        message: 'Message sent successfully! Check your email for confirmation.' 
      })

    } catch (emailError: any) {
      console.error('❌ Resend error:', emailError)
      
      // If custom domain fails, provide helpful error message
      if (emailError?.message?.includes('domain is not verified')) {
        console.log('🔄 Domain not verified yet, falling back to default domain...')
        
        // Fallback to default domain if custom domain isn't ready
        try {
          const fallbackResult = await resend.emails.send({
            from: 'Contact Form <onboarding@resend.dev>',
            to: [process.env.EMAIL_TO || 'peysphotos6@gmail.com'],
            subject: `New Contact: ${name} - ${eventType || 'General Inquiry'}`,
            text: emailContent,
            replyTo: email,
          })
          
          console.log('✅ Fallback email sent:', fallbackResult)
          return NextResponse.json({ 
            message: 'Message sent successfully! (Note: Custom domain setup still in progress)' 
          })
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError)
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to send email. Please try again or contact directly at peysphotos6@gmail.com.' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}