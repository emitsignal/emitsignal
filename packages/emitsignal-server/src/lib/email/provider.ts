export interface EmailOptions {
    from?: string;
    html: string;
    subject: string;
    text?: string;
    to: string;
}

export interface EmailProvider {
    send(options: EmailOptions): Promise<void>;
}
