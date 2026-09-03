import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.services';
import { AppDataSource } from '../db';
import { User } from '@shared/entities';

// Member auth uses email OTP now (was phone/SMS OTP).
describe('AuthService OTP concurrency', () => {
  let dataSource: DataSource;
  let service: AuthService;
  let email: string;
  let userId: string;

  beforeAll(async () => {
    dataSource = AppDataSource;
    if (!dataSource.isInitialized) await dataSource.initialize();
    service = new AuthService();
    email = `otp-test-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    if (userId) await dataSource.getRepository(User).delete(userId);
    // auth-svc may be shared by the running application, so only destroy a
    // connection that this test initialized itself.
  });

  it('allows only one concurrent OTP request through the cooldown window', async () => {
    const results = await Promise.allSettled([service.requestOtp(email), service.requestOtp(email)]);
    console.log(results.map(r => r.status === "rejected" ? r.reason : "ok"));

    const succeeded = results.filter((result) => result.status === 'fulfilled');
    const failed = results.filter((result) => result.status === 'rejected');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0] as PromiseRejectedResult).reason.message).toBe('Please wait before requesting another OTP');

    const user = await dataSource.getRepository(User).findOneByOrFail({ email });
    userId = user.id!;
    expect(user.otp_attempts).toBe(0);
    expect(user.otp_last_requested_at).toBeTruthy();
  });
});
