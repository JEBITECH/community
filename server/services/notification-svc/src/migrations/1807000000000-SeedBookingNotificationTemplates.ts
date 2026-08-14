import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBookingNotificationTemplates1807000000000
  implements MigrationInterface
{
  name = 'SeedBookingNotificationTemplates1807000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO notification_templates (event_type, channel, language, subject, template, version)
      VALUES
        (
          'reservation.created',
          'email',
          'en',
          'Your Booking is Being Held',
          '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e40af; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 22px;">Booking Hold Confirmation</h1>
            </div>
            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Hi {{guestFirstName}},</p>
              <p>Your reservation at <strong>{{propertyName}}</strong> is being held for <strong>{{reservedUntilMinutes}} minutes</strong>. Please complete payment to confirm your booking.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px 0; color: #6b7280;">Check-in:</td><td style="padding: 8px 0; font-weight: 600;">{{checkIn}}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Check-out:</td><td style="padding: 8px 0; font-weight: 600;">{{checkOut}}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Reservation ID:</td><td style="padding: 8px 0; font-weight: 600;">{{reservationId}}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Hold expires in:</td><td style="padding: 8px 0; font-weight: 600;">{{reservedUntilMinutes}} minutes</td></tr>
              </table>
              <p style="font-size: 13px; color: #6b7280;">If you did not make this reservation, please ignore this email.</p>
            </div>
          </div>',
          1
        ),
        (
          'reservation.confirmed',
          'email',
          'en',
          'Booking Confirmed - {{propertyName}}',
          '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #059669; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 22px;">&#10003; Booking Confirmed!</h1>
            </div>
            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Hi {{guestFirstName}},</p>
              <p>Great news! Your booking at <strong>{{propertyName}}</strong> has been confirmed.</p>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0 0 8px; font-weight: 600; color: #166534;">Confirmation Code</p>
                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #166534;">{{confirmationCode}}</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px 0; color: #6b7280;">Check-in:</td><td style="padding: 8px 0; font-weight: 600;">{{checkIn}}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Check-out:</td><td style="padding: 8px 0; font-weight: 600;">{{checkOut}}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Guest:</td><td style="padding: 8px 0; font-weight: 600;">{{guestName}}</td></tr>
              </table>
              <p>We look forward to welcoming you!</p>
              <p style="font-size: 13px; color: #6b7280;">If you have any questions about your stay, please don''t hesitate to contact us.</p>
            </div>
          </div>',
          1
        ),
        (
          'reservation.cancelled',
          'email',
          'en',
          'Booking Cancelled - {{propertyName}}',
          '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #dc2626; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 22px;">Booking Cancelled</h1>
            </div>
            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Hi {{guestFirstName}},</p>
              <p>Your reservation at <strong>{{propertyName}}</strong> has been cancelled.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px 0; color: #6b7280;">Reservation ID:</td><td style="padding: 8px 0; font-weight: 600;">{{reservationId}}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Original Check-in:</td><td style="padding: 8px 0;">{{checkIn}}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Original Check-out:</td><td style="padding: 8px 0;">{{checkOut}}</td></tr>
              </table>
              <p style="font-size: 13px; color: #6b7280;">If you believe this was done in error, please contact us immediately.</p>
            </div>
          </div>',
          1
        ),
        (
          'form.submitted',
          'email',
          'en',
          'New Form Submission',
          '<p>You have received a new form submission.</p><p>{{body}}</p>',
          1
        )
      ON CONFLICT (event_type, channel, language, organization_id, version) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM notification_templates
      WHERE event_type IN (
        'reservation.created',
        'reservation.confirmed',
        'reservation.cancelled',
        'form.submitted'
      )
      AND organization_id IS NULL
    `);
  }
}
