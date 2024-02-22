import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { MessagesInterface } from '../models/messages.model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})

export class ChatService {
  
  private socket: Socket;
  protected user: any;

  constructor() {
    this.socket = io('ws://localhost:3000');
  }

  connect(user: any) {
    this.socket.emit('connection_user', user);
  }

  sendMessage(
    message: string,
    authorMessageId: number,
    recipientId: number,
    time: Date
  ) {
    this.socket.emit('message', {
      message,
      authorMessageId,
      recipientId,
      time,
    });
  }

  getMessages(): Observable<MessagesInterface> {
    return new Observable((observer) => {

      // Escute as mensagens recebidas do servidor
      this.socket.on('private-message', (message: any) => {
        observer.next(message);
      });

      // Limpe os recursos quando o observador é cancelado
      return () => {
        this.socket.disconnect();
      };
    });
  }
}
