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

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    MatIconModule,
    CommonModule,
    MessagesComponent,
    RouterOutlet,
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

  user: any;
  users: User[] = [];
  userSendId: any;
  recipientEmail = '';
  recipientValue = this.activatedRoute.paramMap.pipe(
    map((value) => value.get('userId'))
  );

  ngOnInit() {
    this.getUser();
    this.getUsers();
    this.router.navigate(['chat'])
  }

  @Output() myEmmiter = new EventEmitter<string>();

  goToUser(userId: any, userEmail: string) {
    this.recipientEmail = userEmail;
    this.myEmmiter.next(userEmail);
    this.router.navigate(['chat', userId]);
  }

  getFirstEmail(){
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
