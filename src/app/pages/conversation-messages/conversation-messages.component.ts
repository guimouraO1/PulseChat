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
  recipientEmail = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private chatService: ChatService,
    private userService: UserService,
    private chatComponent: ChatComponent
  ) {}
  ngOnInit(): void {
    // Get the first email after click in the contact
    this.recipientEmail = this.chatComponent.getFirstEmail();
    this.initializeUser();
    this.listenForRecipientChange();
    this.listenForParameterChange();
    this.fetchMessages();
  }

  initializeUser(): void {
    this.userService.getUser()
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
    this.chatComponent.getClickEvent()
      .subscribe((userEmail: string) => {
        this.recipientEmail = userEmail;
      });
  }

  listenForParameterChange(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.recipientId = params.get('userId');
      this.messages = [];
    });
  }

  fetchMessages(): void {
    this.chatService.getMessages().subscribe((message: any) => {
      if (
        message.authorMessageId !== parseInt(this.recipientId) &&
        message.authorMessageId !== this.userId
      ) {
        return;
      }
      this.messages.push({
        authorMessageId: message.authorMessageId,
        recipientId: message.recipientId,
        time: message.time,
        isMine: message.authorMessageId === this.userId,
        message: message.message,
      });
    });
  }

  sendMessage(): void {
    if (!this.inputMessage) return;
    this.chatService.sendMessage(
      this.inputMessage,
      this.userId,
      parseInt(this.recipientId),
      new Date()
    );
    this.inputMessage = '';
  }

  scrollToLast(): void {
    try {
      this.scrollPanel.nativeElement.scrollTop =
        this.scrollPanel.nativeElement.scrollHeight;
    } catch (error) {
      // Handle error
    }
  }

  ngAfterViewInit(): void {
    this.messageComps.changes.subscribe(() => this.scrollToLast());
  }
}
