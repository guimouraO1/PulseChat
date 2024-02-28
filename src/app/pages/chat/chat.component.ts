import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterOutlet } from '@angular/router';
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
export class ChatComponent implements OnInit, AfterViewInit {
  constructor(
    private userService: UserService,
    private router: Router,
    private chatService: ChatService
  ) {}

  // Emmit the name of the user you are chatting with.
  @Output() emitRecipientName = new EventEmitter<string>();

  // This user {}.
  protected user: any;
  // Friends array .
  protected users: User[] = [];
  // Init to defer .
  protected init = false;
  // Recipient ID.
  protected recipientId: string = '';
  // Recipient Name.
  protected recipientName: string = '';
  // If you have the id in the array and newMessages = true matBadge appears in the friend that there will be new messages.
  protected newMessagesId: Set<any> = new Set();

  async ngOnInit() {
    // Get your user infos. ex: user.name, user.email, user.id
    await this.getUser();
    // Get friends infos. ex: user.name, user.email, user.id
    await this.getUsers();
    // Listens for new messages from socket.io
    this.fetchMessages();
    // Listens for new messages from newMessageEmmiter and newMessageEmmiterId.
    this.setupMessageListeners();
  }

  // Get your user infos. ex: user.name, user.email, user.id
  async getUser() {
    try {
      const user = await firstValueFrom(this.userService.getUser());
      this.user = user;
      this.chatService.connect(this.user);
    } catch (e) {
      //
    }
  }

  // Get friends infos. ex: user.name, user.email, user.id
  async getUsers() {
    try {
      // Get the list of users
      const users = await firstValueFrom(this.userService.getUsers());
      this.users = users;

      // Iterate over all users
      for (const user of this.users) {
        // Call the getMessages function for each user
        await this.getMessages(user.id, 0, 1);
      }
    } catch (error) {
      // Handle the error here
      console.error('Error while fetching users:', error);
    }
  }

  // Listen to private messages in real time (socket.io). If there are new ones add newMessageId (newMessageId = author Message ) to the array.
  fetchMessages(): void {
    this.chatService.privateMessageListener().subscribe((message: any) => {
      if (message.authorMessageId !== this.user.id) {
        this.chatService.newMessageEmmiterId.emit(message.authorMessageId);
        return;
      }
    });
  }

  // Listens for new messages from newMessageEmmiterId. If the array contains the id of a specific friend, it means that there are new messages from that friend.
  setupMessageListeners() {
    this.chatService.newMessageEmmiterId.subscribe((newMessageId: string) => {
      this.newMessagesId.add(newMessageId);
    });
  }

  // When logging in, or refreshing the page, it takes the last message, if it has message.read = false means there is a new message that has not been read.
  async getMessages(
    recipientId: string,
    offset: number,
    limit: number
  ): Promise<void> {
    try {
      // Get the messages for the recipient
      const messages = await firstValueFrom(
        this.chatService.getMessagesDb(recipientId, offset, limit)
      );
      // Process each message
      messages.forEach((message: MessagesInterface) => {
        if (JSON.parse(message.read) === false) {
          // Add new unread message ID
          this.newMessagesId.add(message.authorMessageId);
        } else {
          // Remove read message ID
          this.newMessagesId.delete(message.authorMessageId);
        }
      });
    } catch (error) {
      // Handle the error here
      console.error('Error while fetching messages:', error);
    }
  }

  // After reading a new message read = 'true' on the message that have already been read.
  updateMessageAsRead(authorMessageId: string, recipientId: string) {
    this.chatService
      .updateMessageAsRead(authorMessageId, recipientId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          // console.log(res);
        },
        error: (e) => {
          // console.error('Erro ao obter usuário:', error);
        },
      });
  }

  // When click on a friend card it takes you to chat with that user.
  goToUser(userId: any, userName: string) {
    this.recipientName = userName;
    this.emitRecipientName.next(userName);
    this.updateMessageAsRead(userId, this.user.id);

    // Checks if userId is present in newMessagesId.
    if (this.newMessagesId.has(userId)) {
      // Remove userId do set newMessagesId.
      this.newMessagesId.delete(userId);
    }

    this.router.navigate(['chat', userId]);
  }

  // Get the name of the first click recipient.
  getRecipientName() {
    return this.recipientName;
  }

  // Get the recipient's name when it is updated.
  getClickEvent(): Observable<string> {
    return this.emitRecipientName.asObservable();
  }

  // LogOut
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['login']);
  }

  // After init load defer
  ngAfterViewInit(): void {
    this.init = true;
  }
}
