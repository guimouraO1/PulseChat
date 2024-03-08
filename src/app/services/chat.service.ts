import { EventEmitter, Injectable, OnInit, Output } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, takeUntil } from 'rxjs';
import { MessagesInterface } from '../models/messages.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Friends } from '../models/friends.model';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  @Output() newMessageEmmiterId = new EventEmitter<string>();

  private socket!: Socket;
  private urlApi = `${environment.url}`;
  private recipient$ = new BehaviorSubject({
    id: '',
    name: ''
  });

  constructor(private http: HttpClient) {}

  returnRecipient$() {
    return this.recipient$.asObservable();
  }

  addNewRecipient(recipient: any) {
    this.recipient$.next({
      id: recipient.id,
      name: recipient.name
    });
  }

  connect(user: any) {
    try {
      this.socket = io('ws://localhost:3000', {
        query: { user: JSON.stringify(user) },
      });
    } catch (error) {
      console.log('Cannot connect to websocket');
    }
  }

  sendMessage(
      message: string,
      authorMessageId: string,
      recipientId: string,
      time: Date) {
      this.socket.emit('message', {
        message,
        authorMessageId,
        recipientId,
        time,
      });
  }

  sentNewFriendship(authorMessageId: string, recipientId: string, name: string, idFriendship: string) {
    this.socket.emit('friendship', { authorMessageId, recipientId, name, idFriendship });
  }

  acceptFriendship(authorMessageId: string, recipientId: string, name: string, idFriendship: string) {
    this.socket.emit('acceptedFriendship', { authorMessageId, recipientId, name, idFriendship });
  }

  deleteFriendshipRequest(authorMessageId: string, recipientId: string, name: string, idFriendship: string) {
    this.socket.emit('deleteFriendshipRequest', { authorMessageId, recipientId, name, idFriendship });
  }


  getMessagesDb(
    recipient: Friends,
    offset: number,
    limit: number
  ): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);
    // Adicione o recipientId, offset e limit como parâmetros na URL
    const url = `${this.urlApi}/messages?recipientId=${recipient.id}&offset=${offset}&limit=${limit}`;
   
    return this.http.get(url, { headers });
  }

  updateMessageAsRead(
    authorMessageId: string,
    recipientId: string
  ): Observable<any> {
    const url = `${this.urlApi}/messages`;
    const data = { authorMessageId: authorMessageId, recipientId: recipientId };

    return this.http.put(url, data);
  }

  privateMessageListener(): Observable<MessagesInterface> {
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

  newFriendsRequestsListener(): Observable<any> {
    return new Observable((observer) => {
      // Escute as mensagens recebidas do servidor
      this.socket.on('friendship', (message: any) => {
        observer.next(message);
      });

      // Limpe os recursos quando o observador é cancelado
      return () => {
        this.socket.disconnect();
      };
    });
  }

  acceptedFriendsListener(): Observable<any> {
    return new Observable((observer) => {
      // Escute as mensagens recebidas do servidor
      this.socket.on('acceptedFriendship', (message: any) => {
        observer.next(message);
      });

      // Limpe os recursos quando o observador é cancelado
      return () => {
        this.socket.disconnect();
      };
    });
  }

  deleteFriendshipRequestListener(): Observable<any> {
    return new Observable((observer) => {
      // Escute as mensagens recebidas do servidor
      this.socket.on('deleteFriendshipRequest', (message: any) => {
        observer.next(message);
      });

      // Limpe os recursos quando o observador é cancelado
      return () => {
        this.socket.disconnect();
      };
    });
  }

  connectedUsersListener(): Observable<MessagesInterface> {
    return new Observable((observer) => {
      // Escute as mensagens recebidas do servidor
      this.socket.on('connectedUsers', (message: any) => {
        observer.next(message);
      });

      // Limpe os recursos quando o observador é cancelado
      return () => {
        this.socket.disconnect();
      };
    });
  }

  socketdisconnect() {
    this.socket.disconnect().connect();
  }
}
