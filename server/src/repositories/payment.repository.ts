import prisma from '../config/db.js';
import { BaseRepository } from '../shared/base.repository.js';

export class PaymentRepository extends BaseRepository<any> {
  public constructor() {
    super(prisma.payment);
  }

  protected override getModelName(): string {
    return 'payment';
  }
}

export const paymentRepository = new PaymentRepository();

