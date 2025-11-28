declare module 'node-pop3' {
  export default class Pop3Command {
    constructor(config: any);
    UIDL(msgNumber?: string): Promise<any>;
    RETR(msgNumber: string): Promise<string>;
    QUIT(): Promise<string>;
  }
}
