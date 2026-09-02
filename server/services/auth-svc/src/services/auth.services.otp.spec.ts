import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.services';
import { AppDataSource } from '../db';
import { User } from '@shared/entities';

describe('AuthService OTP concurrency', () => {
  let dataSource: DataSource;
  let service: AuthService;
  let phone: string;
  let userId: string;

  beforeAll(async () => {
    dataSource = AppDataSource;
    if (!dataSource.isInitialized) await dataSource.initialize();
    service = new AuthService();
    phone = `91${Date.now().toString().slice(-8)}`;
  });

  afterAll(async () => {
    if (userId) await dataSource.getRepository(User).delete(userId);
    // auth-svc may be shared by the running application, so only destroy a
    // connection that this test initialized itself.
  });

  it('allows only one concurrent OTP request through the cooldown window', async () => {
    const results = await Promise.allSettled([service.requestOtp(phone), service.requestOtp(phone)]);
    console.log(results.map(r => r.status === "rejected" ? r.reason : "ok"));

    const succeeded = results.filter((result) => result.status === 'fulfilled');
    const failed = results.filter((result) => result.status === 'rejected');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0] as PromiseRejectedResult).reason.message).toBe('Please wait before requesting another OTP');

    const user = await dataSource.getRepository(User).findOneByOrFail({ phone });
    userId = user.id!;
    expect(user.otp_attempts).toBe(0);
    expect(user.otp_last_requested_at).toBeTruthy();
  });
});
