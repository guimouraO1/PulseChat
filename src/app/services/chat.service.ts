import { EventEmitter, Injectable, Output } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { MessagesInterface } from '../models/messages.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket: Socket;
  protected user: any;
  private urlApi = `${environment.url}`;

  @Output() newMessageEmmiter = new EventEmitter<boolean>();
  @Output() newMessageEmmiterId = new EventEmitter<string>();

  constructor(private http: HttpClient) {
    this.socket = io('ws://localhost:3000');
  }

  connect(user: any) {
    this.socket.emit('connection_user', user);
  }

  sendMessage(
    message: string,
    authorMessageId: string,
    recipientId: string,
    time: Date
  ) {
    this.socket.emit('message', {
      message,
      authorMessageId,
      recipientId,
      time
    });
  }


  getMessagesDb(recipientId: any, offset: number, limit: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);

    // Adicione o recipientId, offset e limit como parâmetros na URL
    const url = `${this.urlApi}/messages?recipientId=${recipientId}&offset=${offset}&limit=${limit}`;

    return this.http.get(url, { headers });
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
