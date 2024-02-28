export interface MessagesInterface {
    id: string,
    authorMessageId: string,
    recipientId: string,
    message: string,
    isMine: boolean,
    time: Date,
    read: string
}