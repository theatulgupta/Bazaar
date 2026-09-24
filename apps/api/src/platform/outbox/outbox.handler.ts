export type OutboxEnvelope = {
  id: string;
  type: string;
  payload: unknown;
  correlationId: string;
};

export abstract class OutboxHandler {
  abstract handle(message: OutboxEnvelope): Promise<void>;
}
