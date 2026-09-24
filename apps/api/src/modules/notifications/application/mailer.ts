export type Mail = { to: string; subject: string; text: string };

export abstract class Mailer {
  abstract send(mail: Mail): Promise<void>;
}
