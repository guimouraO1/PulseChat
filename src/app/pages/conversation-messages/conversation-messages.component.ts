import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MessagesComponent } from '../../components/messages/messages.component';
import { MessagesInterface } from '../../models/messages.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Subject, Subscription, firstValueFrom, takeUntil } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { Friends } from '../../models/friends.model';
import { FriendsService } from '../../services/friends.service';
import {MatProgressBarModule} from '@angular/material/progress-bar';

@Component({
  selector: 'app-conversation-messages',
  standalone: true,
  templateUrl: './conversation-messages.component.html',
  styleUrl: './conversation-messages.component.scss',
  imports: [
    MessagesComponent,
    FormsModule,
    MatInputModule,
    MatIconModule,
    CommonModule,
    MessagesComponent,
    RouterOutlet,
    MatProgressBarModule
  ],
})
export class ConversationMessagesComponent implements OnInit, OnDestroy {
  // Declares a view query that selects all instances of MessagesComponent within the current component's view.
  @ViewChildren(MessagesComponent) messageComps!: QueryList<MessagesComponent>;
  // Declares a view query that selects the ElementRef associated with the 'scrollPanel' template reference variable.
  @ViewChild('scrollPanel') scrollPanel!: ElementRef;

  protected messages: MessagesInterface[] = [];
  protected inputMessage: string = '';
  protected user: any;
  protected offset = 0;
  protected limit = 11;
  protected read = false;
  private destroy$ = new Subject<void>();
  protected recipient: any;
  protected friendList: Friends[] = [];
  private friendListSubscription!: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private chatService: ChatService,
    private userService: UserService,
    private friendsService: FriendsService,
    private router: Router
  ) {
    this.subscribeToUserChanges();
    this.subscribeToRecipientChanges();
    this.friendList$();
  }

  protected friendList$(): void {
    this.friendListSubscription = this.friendsService
      .returnFriendList()
      .pipe(takeUntil(this.destroy$))
      .subscribe((friendList: any) => {
        this.friendList = friendList;
      
      });
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
      .subscribe((recipient) => {
        if (recipient) {
          this.recipient = recipient;
        }
      });
  }

  async ngOnInit() {
    // get the old messages from DB
    await this.getMessages(this.recipient, this.offset, this.limit);
    // Listens for new parameter change to change receiver.
    this.listenForParameterChange();
    // Listens for new messages from socket.io
    this.fetchMessages();
  }


  // When logging in, or refreshing the page, it takes the last 11 messages.
  async getMessages(
    recipient: Friends,
    offset: number,
    limit: number
  ): Promise<void> {
    try {
      const messages = await firstValueFrom(
        this.chatService.getMessagesDb(recipient, offset, limit)
      );
      const newMessages = messages.map((message: MessagesInterface) => ({
        ...message,
        isMine: message.authorMessageId === this.user.id,
      }));
      this.messages = [...newMessages.reverse(), ...this.messages];
    } catch (error) {
      console.error('Error while fetching messages:', error);
    }
  }

  // listen For Parameter Change, when change get 11 last messages and set offset 0.
  listenForParameterChange(): void {
    try {
      this.activatedRoute.paramMap
        .pipe(takeUntil(this.destroy$))
        .subscribe(async (params) => {
          if (!this.recipient.id || !this.recipient.name) {
            this.recipient.id = params.get('userId');
            const friend: any = await firstValueFrom(this.chatService.getFriendById(this.recipient));
            this.chatService.addNewRecipient(this.recipient.id, friend.name);
          }
          this.messages = [];
          this.offset = 0;
          this.limit = 11;
          await this.getMessages(this.recipient, this.offset, this.limit);
        });
    } catch (error) {
      console.error('Error while listen for parameter change:', error);
    }
  }

  // Listen to private messages in real time (socket.io).
  fetchMessages(): void {
    this.chatService
      .privateMessageListener()
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: any) => {
        if (
          message.authorMessageId !== this.recipient.id &&
          message.authorMessageId !== this.user.id
        ) {
          return;
        }
        this.messages.push({
          id: message.id,
          authorMessageId: message.authorMessageId,
          recipientId: message.recipientId,
          time: message.time,
          isMine: message.authorMessageId === this.user.id,
          message: message.message,
          read: message.read,
        });
      });
  }

  // Send message to private recipient in real time, and backend save on db.
  sendMessage(): void {
    if (!this.inputMessage || this.inputMessage.trim() === '') return;
    this.chatService.sendMessage(
      this.inputMessage, // message
      this.user.id, // authorMessageId
      this.recipient.id, // recipientId
      new Date() // time
    );
    this.inputMessage = '';
    this.messageComps.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.scrollToLast());
  }

  // Infinite scrolling. When the user scrolls to the last top message, the client sends a get request for 11 more messages.
  scrollOnTop(): void {
    if (this.scrollPanel.nativeElement.scrollTop === 0) {
      this.offset += this.limit;
      this.getMessages(this.recipient, this.offset, this.limit);
    }
  }

  // Scroll to the last message when called.
  scrollToLast(): void {
    try {
      this.scrollPanel.nativeElement.scrollTop =
        this.scrollPanel.nativeElement.scrollHeight;
    } catch (error) {}
  }

  // After init scroll to the last message.
  ngAfterViewInit(): void {
    this.messageComps.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.scrollToLast());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
