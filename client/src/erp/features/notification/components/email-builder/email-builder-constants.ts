// Block and template preset definitions for the email builder drag-and-drop system

interface EmailElementBase {
  type: 'text' | 'heading' | 'image' | 'button' | 'divider' | 'spacer' | 'social' | 'footer'
  content?: string
  styles?: Record<string, string>
  properties?: Record<string, any>
  children?: EmailElementBase[]
}

export interface BlockDefinition {
  id: string
  label: string
  description: string
  icon: string
  elements: EmailElementBase[]
}

export interface TemplatePreset {
  id: string
  label: string
  description: string
  icon: string
  elements: EmailElementBase[]
}

export const BLOCKS: BlockDefinition[] = [
  {
    id: 'header',
    label: 'Email Header',
    description: 'Logo and navigation',
    icon: '📧',
    elements: [
      { type: 'image', content: 'https://via.placeholder.com/200x60', styles: { width: '200px', height: 'auto', display: 'block', margin: '20px auto' }, properties: { alt: 'Company Logo' } },
      { type: 'heading', content: 'Your Company Name', styles: { fontSize: '28px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '0 20px 20px 20px' } },
    ],
  },
  {
    id: 'hero',
    label: 'Hero Banner',
    description: 'Main message with CTA',
    icon: '🎯',
    elements: [
      { type: 'heading', content: 'Your Main Message Here', styles: { fontSize: '32px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '30px 20px 10px 20px' } },
      { type: 'text', content: 'Supporting text that provides context for your main message.', styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '10px 40px' } },
      { type: 'button', content: 'Get Started', styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '14px 32px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '20px auto' }, properties: { href: '#', target: '_blank' } },
    ],
  },
  {
    id: 'newsletter',
    label: 'Newsletter Content',
    description: 'Article layout',
    icon: '📰',
    elements: [
      { type: 'heading', content: 'Article Title', styles: { fontSize: '22px', fontWeight: 'bold', color: '#333333', padding: '20px 20px 10px 20px' } },
      { type: 'text', content: 'Introduction paragraph for your article content.', styles: { fontSize: '16px', color: '#333333', padding: '0 20px 10px 20px', lineHeight: '1.6' } },
      { type: 'image', content: 'https://via.placeholder.com/560x300', styles: { width: '100%', height: 'auto', display: 'block', padding: '0 20px' }, properties: { alt: 'Article image' } },
      { type: 'text', content: 'Continue your article content here with more details.', styles: { fontSize: '16px', color: '#333333', padding: '10px 20px', lineHeight: '1.6' } },
    ],
  },
  {
    id: 'product',
    label: 'Product Showcase',
    description: 'Product highlight',
    icon: '🛍️',
    elements: [
      { type: 'heading', content: 'Featured Product', styles: { fontSize: '24px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '20px 20px 10px 20px' } },
      { type: 'image', content: 'https://via.placeholder.com/400x400', styles: { width: '300px', height: 'auto', display: 'block', margin: '0 auto', borderRadius: '8px' }, properties: { alt: 'Product image' } },
      { type: 'text', content: 'Product description highlighting key features and benefits.', styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '15px 40px' } },
      { type: 'button', content: 'Shop Now', styles: { backgroundColor: '#28a745', color: '#ffffff', padding: '12px 28px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '10px auto' }, properties: { href: '#', target: '_blank' } },
    ],
  },
  {
    id: 'testimonial',
    label: 'Testimonial',
    description: 'Customer review',
    icon: '💬',
    elements: [
      { type: 'text', content: '"This product completely changed how we work. Highly recommended!"', styles: { fontSize: '18px', fontStyle: 'italic', color: '#555555', textAlign: 'center', padding: '30px 40px 10px 40px', lineHeight: '1.6' } },
      { type: 'footer', content: '— Jane Smith, CEO at Acme Inc.', styles: { fontSize: '14px', color: '#888888', textAlign: 'center', padding: '0 20px 30px 20px' } },
    ],
  },
  {
    id: 'cta',
    label: 'Call to Action',
    description: 'Centered CTA button',
    icon: '📢',
    elements: [
      { type: 'heading', content: 'Ready to Get Started?', styles: { fontSize: '26px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '30px 20px 10px 20px' } },
      { type: 'text', content: 'Join thousands of happy customers today.', styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '0 40px 20px 40px' } },
      { type: 'button', content: 'Sign Up Free', styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '14px 36px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '10px auto' }, properties: { href: '#', target: '_blank' } },
    ],
  },
  {
    id: 'footer',
    label: 'Email Footer',
    description: 'Links and unsubscribe',
    icon: '📄',
    elements: [
      { type: 'divider', styles: { borderTop: '1px solid #dddddd', margin: '20px 0', width: '100%' } },
      { type: 'social', content: 'Follow us', styles: { textAlign: 'center', padding: '20px' }, properties: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'] } },
      { type: 'footer', content: '© 2024 Your Company. All rights reserved.\nYou received this email because you signed up.\n<a href="#">Unsubscribe</a>', styles: { fontSize: '12px', color: '#666666', textAlign: 'center', padding: '10px 20px 30px 20px', backgroundColor: '#f8f9fa' } },
    ],
  },
]

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'welcome',
    label: 'Welcome Email',
    description: 'Onboarding welcome message with CTA',
    icon: '👋',
    elements: [
      { type: 'image', content: 'https://via.placeholder.com/200x60', styles: { width: '200px', height: 'auto', display: 'block', margin: '20px auto' }, properties: { alt: 'Company Logo' } },
      { type: 'heading', content: 'Your Company Name', styles: { fontSize: '28px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '0 20px 20px 20px' } },
      { type: 'heading', content: 'Welcome Aboard!', styles: { fontSize: '32px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '30px 20px 10px 20px' } },
      { type: 'text', content: "We're thrilled to have you join our community.", styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '10px 40px' } },
      { type: 'button', content: 'Get Started', styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '14px 32px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '20px auto' }, properties: { href: '#', target: '_blank' } },
      { type: 'text', content: "Thank you for signing up! Here's what you can do next to get the most out of your account.", styles: { fontSize: '16px', color: '#333333', padding: '20px 20px 10px 20px', lineHeight: '1.6' } },
      { type: 'heading', content: 'Ready to Explore?', styles: { fontSize: '26px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '30px 20px 10px 20px' } },
      { type: 'text', content: 'Discover all the features available to you.', styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '0 40px 20px 40px' } },
      { type: 'button', content: 'Explore Features', styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '14px 36px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '10px auto' }, properties: { href: '#', target: '_blank' } },
      { type: 'divider', styles: { borderTop: '1px solid #dddddd', margin: '20px 0', width: '100%' } },
      { type: 'social', content: 'Follow us', styles: { textAlign: 'center', padding: '20px' }, properties: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'] } },
      { type: 'footer', content: '© 2024 Your Company. All rights reserved.\nYou received this email because you signed up.\n<a href="#">Unsubscribe</a>', styles: { fontSize: '12px', color: '#666666', textAlign: 'center', padding: '10px 20px 30px 20px', backgroundColor: '#f8f9fa' } },
    ],
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Multi-article newsletter layout',
    icon: '📰',
    elements: [
      { type: 'image', content: 'https://via.placeholder.com/200x60', styles: { width: '200px', height: 'auto', display: 'block', margin: '20px auto' }, properties: { alt: 'Company Logo' } },
      { type: 'heading', content: 'Your Company Name', styles: { fontSize: '28px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '0 20px 20px 20px' } },
      { type: 'heading', content: "This Week's Top Story", styles: { fontSize: '22px', fontWeight: 'bold', color: '#333333', padding: '20px 20px 10px 20px' } },
      { type: 'text', content: 'Introduction paragraph for the first article.', styles: { fontSize: '16px', color: '#333333', padding: '0 20px 10px 20px', lineHeight: '1.6' } },
      { type: 'image', content: 'https://via.placeholder.com/560x300', styles: { width: '100%', height: 'auto', display: 'block', padding: '0 20px' }, properties: { alt: 'Article image' } },
      { type: 'text', content: 'Continue reading about the latest updates and developments.', styles: { fontSize: '16px', color: '#333333', padding: '10px 20px', lineHeight: '1.6' } },
      { type: 'heading', content: 'Industry Insights', styles: { fontSize: '22px', fontWeight: 'bold', color: '#333333', padding: '20px 20px 10px 20px' } },
      { type: 'text', content: "A brief look at what's happening in the industry.", styles: { fontSize: '16px', color: '#333333', padding: '0 20px 10px 20px', lineHeight: '1.6' } },
      { type: 'image', content: 'https://via.placeholder.com/560x300', styles: { width: '100%', height: 'auto', display: 'block', padding: '0 20px' }, properties: { alt: 'Article image' } },
      { type: 'text', content: 'More details on emerging trends and opportunities.', styles: { fontSize: '16px', color: '#333333', padding: '10px 20px', lineHeight: '1.6' } },
      { type: 'divider', styles: { borderTop: '1px solid #dddddd', margin: '20px 0', width: '100%' } },
      { type: 'social', content: 'Follow us', styles: { textAlign: 'center', padding: '20px' }, properties: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'] } },
      { type: 'footer', content: '© 2024 Your Company. All rights reserved.\nYou received this email because you signed up.\n<a href="#">Unsubscribe</a>', styles: { fontSize: '12px', color: '#666666', textAlign: 'center', padding: '10px 20px 30px 20px', backgroundColor: '#f8f9fa' } },
    ],
  },
  {
    id: 'promotional',
    label: 'Promotional',
    description: 'Product promotion with hero and showcase',
    icon: '🎉',
    elements: [
      { type: 'image', content: 'https://via.placeholder.com/200x60', styles: { width: '200px', height: 'auto', display: 'block', margin: '20px auto' }, properties: { alt: 'Company Logo' } },
      { type: 'heading', content: 'Your Company Name', styles: { fontSize: '28px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '0 20px 20px 20px' } },
      { type: 'heading', content: 'Exclusive Offer Inside!', styles: { fontSize: '32px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '30px 20px 10px 20px' } },
      { type: 'text', content: "Limited time deal you don't want to miss.", styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '10px 40px' } },
      { type: 'button', content: 'Shop Now', styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '14px 32px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '20px auto' }, properties: { href: '#', target: '_blank' } },
      { type: 'heading', content: 'Featured Product', styles: { fontSize: '24px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '20px 20px 10px 20px' } },
      { type: 'image', content: 'https://via.placeholder.com/400x400', styles: { width: '300px', height: 'auto', display: 'block', margin: '0 auto', borderRadius: '8px' }, properties: { alt: 'Product image' } },
      { type: 'text', content: 'Product description highlighting key features and benefits.', styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '15px 40px' } },
      { type: 'button', content: 'Shop Now', styles: { backgroundColor: '#28a745', color: '#ffffff', padding: '12px 28px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '10px auto' }, properties: { href: '#', target: '_blank' } },
      { type: 'heading', content: "Don't Miss Out!", styles: { fontSize: '26px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '30px 20px 10px 20px' } },
      { type: 'text', content: 'This offer expires soon. Act now!', styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '0 40px 20px 40px' } },
      { type: 'button', content: 'Claim Offer', styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '14px 36px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '10px auto' }, properties: { href: '#', target: '_blank' } },
      { type: 'divider', styles: { borderTop: '1px solid #dddddd', margin: '20px 0', width: '100%' } },
      { type: 'social', content: 'Follow us', styles: { textAlign: 'center', padding: '20px' }, properties: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'] } },
      { type: 'footer', content: '© 2024 Your Company. All rights reserved.\nYou received this email because you signed up.\n<a href="#">Unsubscribe</a>', styles: { fontSize: '12px', color: '#666666', textAlign: 'center', padding: '10px 20px 30px 20px', backgroundColor: '#f8f9fa' } },
    ],
  },
  {
    id: 'transactional',
    label: 'Transactional',
    description: 'Order confirmation or receipt',
    icon: '🧾',
    elements: [
      { type: 'image', content: 'https://via.placeholder.com/200x60', styles: { width: '200px', height: 'auto', display: 'block', margin: '20px auto' }, properties: { alt: 'Company Logo' } },
      { type: 'heading', content: 'Your Company Name', styles: { fontSize: '28px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '0 20px 20px 20px' } },
      { type: 'heading', content: 'Order Confirmed!', styles: { fontSize: '26px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '20px 20px 10px 20px' } },
      { type: 'text', content: 'Thank you for your purchase. Here are your order details:\n\nOrder #12345\nDate: January 1, 2024\n\nItem 1 — $29.99\nItem 2 — $49.99\n\nTotal: $79.98', styles: { fontSize: '16px', color: '#333333', padding: '10px 20px', lineHeight: '1.8' } },
      { type: 'divider', styles: { borderTop: '1px solid #dddddd', margin: '20px 0', width: '100%' } },
      { type: 'text', content: 'Your order will be shipped to the address on file. You will receive a tracking number once your order has been dispatched.', styles: { fontSize: '16px', color: '#666666', padding: '10px 20px', lineHeight: '1.6' } },
      { type: 'divider', styles: { borderTop: '1px solid #dddddd', margin: '20px 0', width: '100%' } },
      { type: 'social', content: 'Follow us', styles: { textAlign: 'center', padding: '20px' }, properties: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'] } },
      { type: 'footer', content: '© 2024 Your Company. All rights reserved.\nYou received this email because you signed up.\n<a href="#">Unsubscribe</a>', styles: { fontSize: '12px', color: '#666666', textAlign: 'center', padding: '10px 20px 30px 20px', backgroundColor: '#f8f9fa' } },
    ],
  },
  {
    id: 'announcement',
    label: 'Announcement',
    description: 'Company announcement or news',
    icon: '📣',
    elements: [
      { type: 'image', content: 'https://via.placeholder.com/200x60', styles: { width: '200px', height: 'auto', display: 'block', margin: '20px auto' }, properties: { alt: 'Company Logo' } },
      { type: 'heading', content: 'Your Company Name', styles: { fontSize: '28px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '0 20px 20px 20px' } },
      { type: 'heading', content: 'Big News!', styles: { fontSize: '32px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '30px 20px 10px 20px' } },
      { type: 'text', content: 'We have an exciting announcement to share with you.', styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '10px 40px' } },
      { type: 'button', content: 'Learn More', styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '14px 32px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '20px auto' }, properties: { href: '#', target: '_blank' } },
      { type: 'text', content: 'Here are the details about our announcement. This is a significant update that will improve your experience with our platform.', styles: { fontSize: '16px', color: '#333333', padding: '20px 20px 10px 20px', lineHeight: '1.6' } },
      { type: 'heading', content: 'Want to Know More?', styles: { fontSize: '26px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '30px 20px 10px 20px' } },
      { type: 'text', content: 'Check out the full details on our website.', styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '0 40px 20px 40px' } },
      { type: 'button', content: 'Read Full Announcement', styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '14px 36px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '10px auto' }, properties: { href: '#', target: '_blank' } },
      { type: 'divider', styles: { borderTop: '1px solid #dddddd', margin: '20px 0', width: '100%' } },
      { type: 'social', content: 'Follow us', styles: { textAlign: 'center', padding: '20px' }, properties: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'] } },
      { type: 'footer', content: '© 2024 Your Company. All rights reserved.\nYou received this email because you signed up.\n<a href="#">Unsubscribe</a>', styles: { fontSize: '12px', color: '#666666', textAlign: 'center', padding: '10px 20px 30px 20px', backgroundColor: '#f8f9fa' } },
    ],
  },
  {
    id: 'event',
    label: 'Event Invitation',
    description: 'Event invite with RSVP',
    icon: '🎪',
    elements: [
      { type: 'image', content: 'https://via.placeholder.com/200x60', styles: { width: '200px', height: 'auto', display: 'block', margin: '20px auto' }, properties: { alt: 'Company Logo' } },
      { type: 'heading', content: 'Your Company Name', styles: { fontSize: '28px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '0 20px 20px 20px' } },
      { type: 'heading', content: "You're Invited!", styles: { fontSize: '32px', fontWeight: 'bold', color: '#333333', textAlign: 'center', padding: '30px 20px 10px 20px' } },
      { type: 'text', content: 'Join us for an exclusive event.', styles: { fontSize: '16px', color: '#666666', textAlign: 'center', padding: '10px 40px' } },
      { type: 'button', content: 'RSVP Now', styles: { backgroundColor: '#007bff', color: '#ffffff', padding: '14px 32px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '20px auto' }, properties: { href: '#', target: '_blank' } },
      { type: 'text', content: '📅 Date: Saturday, March 15, 2024\n🕐 Time: 6:00 PM — 9:00 PM\n📍 Venue: Grand Ballroom, Downtown Convention Center\n\nJoin us for an evening of networking, presentations, and refreshments.', styles: { fontSize: '16px', color: '#333333', padding: '20px 20px 10px 20px', lineHeight: '1.8' } },
      { type: 'button', content: 'RSVP Now', styles: { backgroundColor: '#28a745', color: '#ffffff', padding: '14px 36px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', textAlign: 'center', margin: '20px auto' }, properties: { href: '#', target: '_blank' } },
      { type: 'divider', styles: { borderTop: '1px solid #dddddd', margin: '20px 0', width: '100%' } },
      { type: 'social', content: 'Follow us', styles: { textAlign: 'center', padding: '20px' }, properties: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'] } },
      { type: 'footer', content: '© 2024 Your Company. All rights reserved.\nYou received this email because you signed up.\n<a href="#">Unsubscribe</a>', styles: { fontSize: '12px', color: '#666666', textAlign: 'center', padding: '10px 20px 30px 20px', backgroundColor: '#f8f9fa' } },
    ],
  },
]
