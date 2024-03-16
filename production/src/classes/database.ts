import { PrismaClient } from '@prisma/client';
import { Logger } from 'pino';
import { PlaceOrderRequest } from '../schemas/index.js';

export class Database {
  private logger: Logger;
  private prisma: PrismaClient;

  constructor(logger: Logger, prisma: PrismaClient) {
    this.logger = logger.child({ database: 'prisma' });
    this.prisma = prisma;
  }

  public async create(order: PlaceOrderRequest) {
    this.logger.info('Storing order to database: ' + order.symbol);

    try {
      const dbOrder = await this.prisma.order.create({
        data: {
          ...order,
          take_profit: {
            create: order.take_profit,
          },
          stop_loss: {
            create: order.stop_loss,
          },
        },
      });
      this.logger.info(
        'Created new database entry: ' + order.symbol + ' ' + dbOrder.id
      );
    } catch (error) {
      this.logger.error('Error creating order: ' + JSON.stringify(error));
    }
  }

  public async readAll() {
    this.logger.info('Reading orders from database: ');

    try {
      const dbOrders = await this.prisma.order.findMany({
        include: {
          take_profit: true,
          stop_loss: true,
        },
      });

      if (!dbOrders) {
        throw new Error('Orders not found');
      }

      return dbOrders;
    } catch (error) {
      this.logger.error('Error reading order: ' + JSON.stringify(error));
    }
  }

  public async readSymbol(symbol: string) {
    this.logger.info('Reading orders for ' + symbol + ' from database: ');

    try {
      const dbOrders = await this.prisma.order.findMany({
        where: {
          symbol: symbol,
        },
        include: {
          take_profit: true,
          stop_loss: true,
        },
      });

      if (!dbOrders) {
        throw new Error('Orders not found for symbol ' + symbol);
      }

      this.logger.info('Found ' + dbOrders.length + ' orders for ' + symbol);

      return dbOrders;
    } catch (error) {
      this.logger.error('Error reading order: ' + JSON.stringify(error));
    }
  }
}
