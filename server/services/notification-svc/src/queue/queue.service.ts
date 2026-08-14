import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue, Worker } from 'bullmq';
import { Repository } from 'typeorm';
import {
  NOTIFICATION_JOBS,
  NOTIFICATION_QUEUE_CONFIG,
  NOTIFICATION_QUEUES,
  NotificationChannel,
  NotificationJobData,
  NotificationPriority,
  NotificationStatus,
  createQueue,
} from '@shared/common';
import { EmailChannelService } from '../channels/email/email-channel.service';
import {
  NotificationDeliveryLogEntity,
  NotificationEntity,
} from '../entities';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD,
  };

  private emailQueue!: Queue;
  private emailDlq!: Queue;
  private emailWorker?: Worker;

  constructor(
    private readonly emailChannelService: EmailChannelService,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(NotificationDeliveryLogEntity)
    private readonly deliveryLogRepo: Repository<NotificationDeliveryLogEntity>,
  ) {}

  onModuleInit() {
    this.emailQueue = createQueue(NOTIFICATION_QUEUES.EMAIL, this.connection);
    this.emailDlq = createQueue(NOTIFICATION_QUEUES.EMAIL_DLQ, this.connection);
    this.startEmailWorker();
  }

  async onModuleDestroy() {
    await this.emailWorker?.close();
    await this.emailQueue?.close();
    await this.emailDlq?.close();
  }

  async enqueueEmail(
    data: NotificationJobData,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    idempotencyKey?: string,
  ) {
    return this.emailQueue.add(NOTIFICATION_JOBS.SEND_EMAIL, data, {
      ...NOTIFICATION_QUEUE_CONFIG,
      priority,
      jobId: idempotencyKey,
    });
  }

  private startEmailWorker() {
    this.emailWorker = new Worker(
      NOTIFICATION_QUEUES.EMAIL,
      async (job) => this.processEmailJob(job),
      { connection: this.connection, concurrency: 5 },
    );

    this.emailWorker.on('completed', (job) => {
      this.logger.debug(`Email job completed: ${job.id}`);
    });

    this.emailWorker.on('failed', async (job, error) => {
      this.logger.error(
        `Email job failed (${job?.id}): ${error?.message || error}`,
      );

      if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        await this.moveToDlq(job, error);
      }
    });
  }

  private async processEmailJob(job: Job<NotificationJobData>) {
    const data = job.data;

    if (!data.recipientEmail) {
      throw new Error('Missing recipient email');
    }

    await this.notificationRepo.update(data.notificationId, {
      status: NotificationStatus.PROCESSING,
    });

    const result = await this.emailChannelService.sendEmail({
      to: data.recipientEmail,
      subject: data.subject || 'Notification',
      html: data.content,
    });

    await this.notificationRepo.update(data.notificationId, {
      status: NotificationStatus.SENT,
    });

    await this.deliveryLogRepo.save(
      this.deliveryLogRepo.create({
        notificationId: data.notificationId,
        provider: result.provider,
        status: NotificationStatus.SENT,
        response: {
          messageId: result.messageId,
          accepted: result.accepted,
        },
      }),
    );

    return result;
  }

  private async moveToDlq(job: Job<NotificationJobData>, error: Error) {
    await this.emailDlq.add(
      `${NOTIFICATION_JOBS.SEND_EMAIL}:failed`,
      {
        ...job.data,
        failureReason: error.message,
        originalJobId: job.id,
      },
      { removeOnComplete: false },
    );

    await this.notificationRepo.update(job.data.notificationId, {
      status: NotificationStatus.FAILED,
    });

    await this.deliveryLogRepo.save(
      this.deliveryLogRepo.create({
        notificationId: job.data.notificationId,
        provider: 'internal',
        status: NotificationStatus.FAILED,
        response: { error: error.message },
      }),
    );
  }
}
