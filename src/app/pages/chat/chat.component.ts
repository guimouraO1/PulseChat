import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
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
import { FriendsService } from '../../services/friends.service';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatTooltipModule,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy {
  private recipient: any;
  // This user {}.
  protected user: any;
  // If you have the id in the array and newMessages = true matBadge appears in the friend that there will be new messages.
  protected newMessages: Map<any, any> = new Map();

  protected searchInput: string = '';
  protected searchUserInfo: any;

  protected hide: boolean = true;

  protected onlineFriends: Friends[] = [];
  protected friendList: Friends[] = [];
  protected filteredFriendList: Friends[] = [];
  protected friendListRequestSent: Friends[] = [];
  protected friendListRequestReceived: Friends[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private friendsService: FriendsService,
    private router: Router,
    private chatService: ChatService,
    public dialog: MatDialog
  ) {
    this.subscribeToUserChanges();
    this.subscribeToRecipientChanges();
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

    this.newFriendsRequestsListener();

    this.acceptedFriendsListener();

    this.deleteFriendshipRequestListener();
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

  async connectUser() {
    try {
      this.chatService.connect(this.user);
      this.connectedUsersListener();
    } catch (e) {
      //
    }
  }

  connectedUsersListener() {
    this.chatService
      .connectedUsersListener()
      .pipe(takeUntil(this.destroy$))
      .subscribe((onlineFriends: any) => {
        const connectedUsersArray = JSON.parse(onlineFriends);
        this.onlineFriends = connectedUsersArray;
      });
  }

  async getFriends() {
    try {
      const friends: Friends[] = await firstValueFrom(this.friendsService.getFriends());
      
      this.friendListRequestSent = friends.filter(friend => friend.senderID === this.user.id && friend.status === 'Pending');
      this.friendListRequestReceived = friends.filter(friend => friend.senderID !== this.user.id && friend.status === 'Pending');
      this.friendList = friends.filter(friend => friend.status === 'Accepted');

      await Promise.all(this.friendList.map(async friend => {
        await this.getMessages(friend, 0, 10);
      }));
  
      // console.log('Enviados', this.friendListRequestSent);
      // console.log('Recebidos', this.friendListRequestReceived);
      // console.log('Amigos', this.friendList);
  
      this.filteredFriendList = this.friendList;
  
    } catch (error) {
      console.error('Error while fetching friends:', error);
    }
  }
  
  // When logging in, or refreshing the page, it takes the last message, if it has message.read = false means there is a new message that has not been read.
  async getMessages(
    recipient: Friends,
    offset: number,
    limit: number
  ): Promise<void> {
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

  newFriendsRequestsListener(): void {
    this.chatService
      .newFriendsRequestsListener()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        this.friendListRequestReceived.push(user);
      });
  }

  acceptedFriendsListener(): void {
    this.chatService
      .acceptedFriendsListener()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        this.friendListRequestSent.splice(this.friendListRequestSent.indexOf(user), 1);
        this.friendList.push(user);
        this.filteredFriendList = this.friendList;
      });
  }

  deleteFriendshipRequestListener(): void {
    this.chatService
      .deleteFriendshipRequestListener()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        this.friendListRequestSent.splice(this.friendListRequestSent.indexOf(user), 1);
        this.friendListRequestReceived.splice(this.friendListRequestReceived.indexOf(user), 1);
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

  async searchUser(username: string) {
    try {
      const user: any = await firstValueFrom(this.friendsService.searchUser(username));
      if(this.user.id === user.id || this.friendList.find(friend => friend.id === user.id) || this.friendListRequestSent.find(friend => friend.id === user.id)) {
        this.searchInput = '';
        return;
      }
      this.searchUserInfo = user;
      this.searchInput = '';
    } catch (error) {
      console.error('Error while fetching friends:', error);
    }
  }

  isFrindConnected(friend: Friends): boolean {
    if (!this.onlineFriends) {
      return false;
    }
    return this.onlineFriends.some((userConnected: any) => {
      return userConnected === friend.id;
    });
  }

  // After reading a new message read = 'true' on the message that have already been read.
  async updateMessageAsRead(authorMessageId: string, recipientId: string) {
    await firstValueFrom(this.chatService.updateMessageAsRead(authorMessageId, recipientId));
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
    // Checks if recipient is your friend.
    this.router.navigate(['chat', recipient.id]);
    
  }

  searchFriendFunc() {
    if (this.searchInput.trim() == '') {
      this.filteredFriendList = this.friendList;
      this.searchUserInfo = false;
      return;
    }
    this.searchUser(this.searchInput);
    this.filteredFriendList = this.friendList.filter((friend) => friend.name.toLowerCase().includes(this.searchInput.toLowerCase()));
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
    // this.router.navigate(['profile']);
  }

  changeHide() {
    this.hide = !this.hide;
  }

  async addThisUser(user: any) {
    const idFriendship = await firstValueFrom(this.friendsService.sendFriendRequest(user.id));
    this.chatService.sentNewFriendship(this.user.id, user.id, this.user.name, idFriendship);
    user.idFriendship = idFriendship;
    this.searchInput = '';
    this.friendListRequestSent.push(user);
    this.searchUserInfo = '';


  }

  async refuseFriendshipReceived(friend: any) {
    await firstValueFrom(this.friendsService.removeFriendRequest(friend.idFriendship));
    this.friendListRequestReceived.splice(this.friendListRequestReceived.indexOf(friend), 1);
    this.chatService.deleteFriendshipRequest(this.user.id, friend.id, this.user.name, friend.idFriendship);
  }

  async refuseFriendshipSent(friend: any) {
    await firstValueFrom(this.friendsService.removeFriendRequest(friend.idFriendship));
    this.friendListRequestSent.splice(this.friendListRequestSent.indexOf(friend), 1);
    this.chatService.deleteFriendshipRequest(this.user.id, friend.id, this.user.name, friend.idFriendship);
  }

  async acceptFriendship(friend: any) {
    await firstValueFrom(this.friendsService.acceptFriendship(friend.idFriendship));
    this.friendList.push(friend);
    this.friendListRequestReceived.splice(this.friendListRequestReceived.indexOf(friend), 1);
    this.chatService.acceptFriendship(this.user.id, friend.id, this.user.name, friend.idFriendship);
    this.searchInput = ``;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
