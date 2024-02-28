import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Observable, firstValueFrom, map, take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MessagesComponent } from '../../components/messages/messages.component';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MessagesInterface } from '../../models/messages.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    MatMenuModule,
    FormsModule,
    MatInputModule,
    MatIconModule,
    CommonModule,
    MessagesComponent,
    RouterOutlet,
    MatButtonModule,
    MatBadgeModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit {
  constructor(
    private userService: UserService,
    private router: Router,
    private chatService: ChatService,
    private activatedRoute: ActivatedRoute
  ) {}

  @Output() myEmmiter = new EventEmitter<string>();
  user: any;
  users: User[] = [];
  recipientId: any;
  recipientName = '';
  newMessages = false;
  newMessagesId: Set<any> = new Set();
  recipientValue = this.activatedRoute.paramMap.pipe(
    map((value) => value.get('userId'))
  );

  async ngOnInit() {
    await this.getUser();
    await this.getUsers();
    this.fetchMessages();
    this.setupMessageListeners();
    this.navigateToChat();
  }

  setupMessageListeners() {
    this.chatService.newMessageEmmiter.subscribe((newMessage: boolean) => {
      this.newMessages = newMessage;
    });
  
    this.chatService.newMessageEmmiterId.subscribe((newMessageId: string) => {
      this.newMessagesId.add(newMessageId);
    });
  }

  getMessages(recipientId: string, offset: number, limit: number): void {
    this.chatService.getMessagesDb(recipientId, offset, limit).subscribe({
      next: (messages: any) => {
        messages.forEach((message: MessagesInterface) => {
          if (JSON.parse(message.read) === false) {
            this.newMessages = true;
            this.newMessagesId.add(message.authorMessageId);
            return;
          } else{
            this.newMessagesId.delete(message.authorMessageId);
          }
        });
      },
      error: () => {
      },
    });
  }

  fetchMessages(): void {
    this.chatService.getMessages().subscribe((message: any) => {
      if (message.authorMessageId !== this.user.id) {
        this.chatService.newMessageEmmiter.emit(true);
        this.chatService.newMessageEmmiterId.emit(message.authorMessageId);
        return;
      }
    });
  }

  updateMessageAsRead(authorMessageId: string, recipientId: string) {
    this.chatService
      .updateMessageAsRead(authorMessageId, recipientId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          
        },
        error: () => {
          // console.error('Erro ao obter usuário:', error);
        },
      });
  }

  goToUser(userId: any, userName: string) {
    this.recipientName = userName;
    this.myEmmiter.next(userName);
    this.updateMessageAsRead(userId, this.user.id);

    // Verifica se userId está presente em newMessagesId
    if (this.newMessagesId.has(userId)) {
      // Remove userId do set newMessagesId
      this.newMessagesId.delete(userId);
    }

    this.router.navigate(['chat', userId]);
  }

  getFirstId() {
    return this.recipientName;
  }

  getClickEvent(): Observable<string> {
    return this.myEmmiter.asObservable();
  }

  exitApp(): void {
    localStorage.removeItem('token');
    this.router.navigate(['login']);
  }

  async getUser() {
    try {
      const user = await firstValueFrom(this.userService.getUser());
      this.user = user;
      this.chatService.connect(this.user);
    } catch (error) {
      // Trate o erro aqui
      console.error('Erro ao obter usuário:', error);
    }
  }
  
  async getUsers() {
    try {
      const users = await firstValueFrom(this.userService.getUsers());
      this.users = users;
  
      // Itera sobre todos os usuários
      this.users.forEach(async (user: User) => {
        // Chama a função getMessages para cada usuário
        await this.getMessages(user.id, 0, 1);
      });
    } catch (error) {
      // Trate o erro aqui
      console.error('Erro ao obter usuários:', error);
    }
  }
  
  navigateToChat(){
    this.router.navigate(['chat']);
  }
  
}
