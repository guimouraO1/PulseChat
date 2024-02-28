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
import { take } from 'rxjs';
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
  
  @ViewChildren(MessagesComponent) messageComps!: QueryList<MessagesComponent>;
  @ViewChild('scrollPanel') scrollPanel!: ElementRef;

  protected messages: MessagesInterface[] = [];
  protected inputMessage = '';
  userId: any;
  recipientId: any;
  recipientName = '';
  offset = 0;
  limit = 11;
  read = false

  constructor(
    private activatedRoute: ActivatedRoute,
    private chatService: ChatService,
    private userService: UserService,
    private chatComponent: ChatComponent
  ) {}

  ngOnInit(): void {
    // Get the first id after click in the contact
    this.recipientName = this.chatComponent.getRecipientName();
    this.initializeUser();
    this.listenForRecipientChange();
    this.listenForParameterChange();
    this.fetchMessages();
  }

  getMessages(recipientId: string, offset: number, limit: number): void {
    this.chatService.getMessagesDb(recipientId, offset, limit).subscribe({
      next: (messages: any) => {
        console.log(messages);
        const newMessages = messages.map((message: MessagesInterface) => ({
          ...message,
          isMine: message.authorMessageId === this.userId,
        }));
        // Adiciona as novas mensagens no início da lista existente
        this.messages = [...newMessages.reverse(), ...this.messages];
      },
      error: () => {
        // Handle error
      },
    });
  }

  initializeUser(): void {
    this.userService
      .getUser()
      .pipe(take(1))
      .subscribe({
        next: (_user: any) => {
          this.userId = _user.id;
        },
        error: () => {
          // Handle error
        },
      });
  }

  listenForRecipientChange(): void {
    this.chatComponent.getClickEvent().subscribe((userId: string) => {
      this.recipientName = userId;
    });
  }

  listenForParameterChange(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.recipientId = params.get('userId');
      this.messages = [];
      this.offset = 0;
      this.limit = 11;
      this.getMessages(this.recipientId, this.offset, this.limit);
    });
  }

  fetchMessages(): void {
    this.chatService.privateMessageListener().subscribe((message: any) => {
      if (
        message.authorMessageId !== this.recipientId &&
        message.authorMessageId !== this.userId
      ) {
        this.chatService.newMessageEmmiterId.emit(message.authorMessageId);
        return;
      }
      this.messages.push({
        authorMessageId: message.authorMessageId,
        recipientId: message.recipientId,
        time: message.time,
        isMine: message.authorMessageId === this.userId,
        message: message.message,
        read: message.read
      });
    });
  }

  sendMessage(): void {
    if (!this.inputMessage) return;
    this.chatService.sendMessage(
      this.inputMessage,
      this.userId,
      this.recipientId,
      new Date()
    );
    this.inputMessage = '';
    this.messageComps.changes.subscribe(() => this.scrollToLast());
  }

  scrollOnTop(): void {
    if (this.scrollPanel.nativeElement.scrollTop === 0) {
      this.offset += this.limit;
      this.getMessages(this.recipientId, this.offset, this.limit);
    }
  }

  scrollToLast(): void {
    try {
      this.scrollPanel.nativeElement.scrollTop =
        this.scrollPanel.nativeElement.scrollHeight;
    } catch (error) {}
  }

  ngAfterViewInit(): void {
    this.messageComps.changes.subscribe(() => this.scrollToLast());
  }
}
