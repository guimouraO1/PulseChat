import {
  Component,
  ElementRef,
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
import { map } from 'rxjs';

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
export class ConversationMessagesComponent {
  
  @ViewChildren(MessagesComponent) messageComps!: QueryList<MessagesComponent>;
  @ViewChild('scrollPanel') scrollPanel!: ElementRef;

  constructor(
    private activatedRoute: ActivatedRoute
  ) {}

  userId$ = this.activatedRoute.paramMap.pipe(
    map((value) => value.get('userId')));

  protected messages: MessagesInterface[] = [];
  protected inputMessage = '';

  sendMessage() {
    if (!this.inputMessage) return;

    this.messages.push({
      time: new Date(),
      isMine: true,
      message: this.inputMessage,
      id: this.userId$,
    });

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
