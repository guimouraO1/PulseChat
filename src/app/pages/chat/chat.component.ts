import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Subject, firstValueFrom, map, take, takeUntil } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MessagesComponent } from '../../components/messages/messages.component';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MessagesInterface } from '../../models/messages.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Friends } from '../../models/friends.model';

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
    AsyncPipe,
    MatDialogModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy {
  private recipient: any;
  // This user {}.
  protected user: any;
  // If you have the id in the array and newMessages = true matBadge appears in the friend that there will be new messages.
  protected newMessages: Map<any, any> = new Map;

  protected searchFriend: string = '';

  protected friends: Friends[] = [];

  protected filteredFriend: Friends[] = [];

  protected connectedUsers: any;

  protected hide: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private router: Router,
    private chatService: ChatService,
    public dialog: MatDialog
  ) {
    this.subscribeToUserChanges();
    this.subscribeToRecipientChanges();
  }


  searchFriendFunc(){
    if (this.searchFriend == '') {
      this.filteredFriend = this.friends;
      return;
    }
    this.filteredFriend = this.friends.filter(friend => friend.name.toLowerCase().includes(this.searchFriend.toLowerCase()));
  }

  private subscribeToUserChanges(): void {
    this.userService
      .User$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => (this.user = user));
  }

  private subscribeToRecipientChanges(): void {
    this.chatService
      .returnRecipient$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((recipient) => (this.recipient = recipient));
  }

  async ngOnInit() {
    // Get your user infos. ex: user.name, user.email, user.id
    await this.connectUser();
    // Get all friends. ex: user.name, user.email, user.id
    await this.getFriends();
    // Listens for new messages from socket.io
    this.fetchMessages();
    // Listens for new messages from newMessageEmmiter and newMessageEmmiterId.
    this.setupMessageListeners();
  }

  // Get your user infos. ex: user.name, user.email, user.id
  async connectUser() {
    try {
      this.chatService.connect(this.user);
      this.connectedUsersListener();
    } catch (e) {
      //
    }
  }

  async getFriends() {
    try {
      const friends = await firstValueFrom(this.userService.getFriends());
      this.friends = friends;
      this.filteredFriend = friends;
      for (const friend of this.friends) {
        await this.getMessages(friend, 0, 10);
      }
    } catch (error) {
      console.error('Error while fetching friends:', error);
    }
  }

  // Listen to private messages in real time (socket.io). If there are new ones add newMessageId (newMessageId = author Message ) to the array.
  fetchMessages(): void {
    this.chatService
      .privateMessageListener()
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: any) => {
        if (message.authorMessageId !== this.user) {
          this.chatService.newMessageEmmiterId.emit(message.authorMessageId);
          return;
        }
      });
  }

  connectedUsersListener() {
    this.chatService
      .connectedUsersListener()
      .pipe(takeUntil(this.destroy$))
      .subscribe((connectedUsers: any) => {
        const connectedUsersArray = JSON.parse(connectedUsers);
        this.connectedUsers = connectedUsersArray;
      });
  }

  isFrindConnected(friend: Friends): boolean {
    if (!this.connectedUsers) {
      return false;
    }
    return this.connectedUsers.some((userConnected: any) => {
      return userConnected === friend.id;
    });
  }

  // Listens for new messages from newMessageEmmiterId. If the array contains the id of a specific friend, it means that there are new messages from that friend.
  setupMessageListeners() {
    this.chatService.newMessageEmmiterId
        .pipe(takeUntil(this.destroy$))
        .subscribe((newMessageId: string) => {
            this.newMessages.set(newMessageId, (this.newMessages.get(newMessageId) || 0) + 1);
        });
  }

  // When logging in, or refreshing the page, it takes the last message, if it has message.read = false means there is a new message that has not been read.
  async getMessages(
    recipient: Friends,
    offset: number,
    limit: number): Promise<void> {
    try {
        const messages = await firstValueFrom(this.chatService.getMessagesDb(recipient, offset, limit));
        messages.forEach((message: MessagesInterface) => {
            if (message.read === 'false') {
                this.newMessages.set(message.authorMessageId, (this.newMessages.get(message.authorMessageId) || 0) + 1);
            }
        });
    } catch (error) {
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
  goToUser(recipient: Friends) {
    try {
      this.updateMessageAsRead(recipient.id, this.user.id);
      localStorage.setItem('lastFriend', recipient.name);
    } catch (error) {}
    this.chatService.addNewRecipient(recipient);

    // Checks if userId is present in newMessagesId.
    if (this.newMessages.has(recipient.id)) {
      // Remove userId do set newMessagesId.
      this.newMessages.delete(recipient.id);
    }

    this.router.navigate(['chat', recipient.id]);
  }

  // LogOut
  logout(): void {
    localStorage.removeItem('users');
    localStorage.removeItem('Friends');
    localStorage.removeItem('token');
    this.chatService.socketdisconnect();
    this.router.navigate(['login']);
  }

  goToProfile() {
    this.router.navigate(['profile']);
  }

  changeHide() {
    this.hide = !this.hide;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
