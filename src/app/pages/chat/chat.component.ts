import {
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Observable, map, take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MessagesComponent } from '../../components/messages/messages.component';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { MatMenuModule } from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import {MatBadgeModule} from '@angular/material/badge';
import { forkJoin } from 'rxjs';
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
    MatBadgeModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit {
  constructor(
    private userService: UserService,
    private router: Router,
    private chatService: ChatService,
    private activatedRoute: ActivatedRoute,
  ) {}

  @Output() myEmmiter = new EventEmitter<string>();
  user: any;
  users: User[] = [];
  recipientId: any;
  userSendId: any;
  recipientEmail = '';
  newMessages = false;
  newMessagesId = '';
  recipientValue = this.activatedRoute.paramMap.pipe(
    map((value) => value.get('userId'))
  );

  ngOnInit() {
    this.fetchMessages();

    this.chatService.newMessageEmmiter.subscribe((data: any) => {
      this.newMessages = data;
    });

    this.chatService.newMessageEmmiterId.subscribe((data: any) => {
      this.newMessagesId = data;
    });
    
    this.getUser();
    this.getUsers();
    this.router.navigate(['chat']);
  }

  fetchMessages(): void {
    this.chatService.getMessages().subscribe((message: any) => {
      if (
        message.authorMessageId !== this.user.id
      ) {
        this.chatService.newMessageEmmiter.emit(true);
        this.chatService.newMessageEmmiterId.emit(message.authorMessageId);
        return;
      }
    });
  }

  goToUser(userId: any, userName: string) {
    this.recipientEmail = userName;
    this.myEmmiter.next(userName);
    this.router.navigate(['chat', userId]);
    this.newMessages = false;
    this.newMessagesId = '';
  }

  getFirstId(){
    return this.recipientEmail;
  }
  
  getClickEvent(): Observable<string> {
    return this.myEmmiter.asObservable();
  }

  exitApp(): void {
    localStorage.removeItem('token');
    this.router.navigate(['login']);
  }

  getUser() {
    this.userService
      .getUser()
      .pipe(take(1))
      .subscribe({
        next: (_user: User[]) => {
          this.user = _user;
          this.chatService.connect(this.user);
        },
        error: () => {
          // console.error('Erro ao obter usuário:', error);
        },
      });
  }

  getUsers() {
    this.userService
      .getUsers()
      .pipe(take(1))
      .subscribe({
        next: (_users: User[] = []) => {
          this.users = _users;
        },
        error: () => {
          // console.error('Erro ao obter usuário:', error);
        },
      });
  }
}
