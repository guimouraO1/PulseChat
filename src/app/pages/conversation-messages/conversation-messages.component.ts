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
import { map, take } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';

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
  roomId: any;
  recipientId: any;
  timeNow = new Date();

  // recipientId = this.activatedRoute.paramMap.pipe(
  //   map((value) => value.get('userId'))
  // );

  constructor(
    private activatedRoute: ActivatedRoute,
    private chatService: ChatService,
    private _userService: UserService
  ) {
  }

  ngOnInit(): void {
    this.getUser();

    this.activatedRoute.paramMap.subscribe((params) => {
      this.recipientId = params.get('userId');
      this.messages = [];
    });
    
    this.chatService.getMessages().subscribe((message: any) => {
      if(message.authorMessageId !== parseInt(this.recipientId) && message.authorMessageId !== this.userId){
        return;
      }

      return this.messages.push({
        authorMessageId: message.authorMessageId,
        recipientId: message.recipientId,
        time: message.time,
        isMine: message.authorMessageId === this.userId,
        message: message.message,
      });
    });
  }

  getUser() {
    this._userService
      .getUser()
      .pipe(take(1))
      .subscribe({
        next: (_user: any) => {
          this.userId = _user.id;
        },
        error: () => {
          // console.error('Erro ao obter usuário:', error);
        },
      });
  }

  getRoomId(): string {
    const roomId = [this.userId, this.recipientId].sort().join('').toLowerCase();
    return roomId;
  }

  sendMessage() {
    if (!this.inputMessage) return;
    this.chatService.sendMessage(this.inputMessage, this.userId, parseInt(this.recipientId), new Date());
    this.inputMessage = '';
  }

  ngAfterViewInit(): void {
    this.messageComps.changes.subscribe(() => this.scrollToLast());
  }

  scrollToLast() {
    try {
      this.scrollPanel.nativeElement.scrollTop =
        this.scrollPanel.nativeElement.scrollHeight;
    } catch (error) {}
  }
}
