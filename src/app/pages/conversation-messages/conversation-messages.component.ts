import {
  Component,
  ElementRef,
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
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { firstValueFrom, take } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { ChatComponent } from '../chat/chat.component';

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
  ],
})
export class ConversationMessagesComponent implements OnInit {
  // Declares a view query that selects all instances of MessagesComponent within the current component's view.
  @ViewChildren(MessagesComponent) messageComps!: QueryList<MessagesComponent>;

  // Declares a view query that selects the ElementRef associated with the 'scrollPanel' template reference variable.
  @ViewChild('scrollPanel') scrollPanel!: ElementRef;

  protected messages: MessagesInterface[] = [];
  protected inputMessage: string = '';
  protected user: any;
  protected recipientId: any;
  protected recipientName = '';
  protected offset = 0;
  protected limit = 11;
  protected read = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private chatService: ChatService,
    private userService: UserService,
    private chatComponent: ChatComponent
  ) {}

  async ngOnInit() {
    // Get the first id after click in the contact.
    this.recipientName = this.chatComponent.getRecipientName();
    // Get your user infos. ex: user.name, user.email, user.id
    await this.getUser();
    // Listens if the recipient has changed.
    this.listenForParameterChange();
    // Listens for new messages from socket.io
    this.fetchMessages();
  }

  // Get your user infos. ex: user.name, user.email, user.id
  async getUser() {
    try {
      const user = await firstValueFrom(this.userService.getUser());
      this.user = user;
      this.chatService.connect(this.user.id);
    } catch (e) {
      //
    }
  }

  // When logging in, or refreshing the page, it takes the last 11 messages.
  async getMessages(
    recipientId: string,
    offset: number,
    limit: number
  ): Promise<void> {
    try {
      const messages = await firstValueFrom(
        this.chatService.getMessagesDb(recipientId, offset, limit)
      );
      console.log(messages);
      const newMessages = messages.map((message: MessagesInterface) => ({
        ...message,
        isMine: message.authorMessageId === this.user.id,
      }));
      this.messages = [...newMessages.reverse(), ...this.messages];
    } catch (error) {
      // Handle error
      console.error('Error while fetching messages:', error);
    }
  }
  // listen For Parameter Change, when change get 11 last messages and set offset 0.
  listenForParameterChange(): void {
    try {
      this.activatedRoute.paramMap.subscribe((params) => {
        this.recipientId = params.get('userId');
        this.messages = [];
        this.offset = 0;
        this.limit = 11;
        this.getMessages(this.recipientId, this.offset, this.limit);
      });
    } catch (error) {
      // Handle error
      console.error('Error while listen for parameter change:', error);
    }
  }

  // Listen to private messages in real time (socket.io).
  fetchMessages(): void {
    this.chatService.privateMessageListener().subscribe((message: any) => {
      if (
        message.authorMessageId !== this.recipientId &&
        message.authorMessageId !== this.user.id
      ) {
        this.chatService.newMessageEmmiterId.emit(message.authorMessageId);
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
      this.recipientId, // recipientId
      new Date() // time
    );
    this.inputMessage = '';
    this.messageComps.changes.subscribe(() => this.scrollToLast());
  }
  
  // Infinite scrolling. When the user scrolls to the last top message, the client sends a get request for 11 more messages.
  scrollOnTop(): void {
    if (this.scrollPanel.nativeElement.scrollTop === 0) {
      this.offset += this.limit;
      this.getMessages(this.recipientId, this.offset, this.limit);
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
    this.messageComps.changes.subscribe(() => this.scrollToLast());
  }
}
