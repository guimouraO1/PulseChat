export interface MessagesInterface {
    authorMessageId: string,
    recipientId: string,
    message: string,
    isMine: boolean,
    time: Date,
    read: string
}