import { Component, OnInit, inject } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { take } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [MatInputModule, MatIconModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit {
  constructor(private _userService: UserService) {}

  user: any;
  users: User[] = [];

  ngOnInit() {
    this.getUser();
    this.getUsers();
  }

  _router = inject(Router);

  exitApp(): void {
    localStorage.removeItem('token');
    this._router.navigate(['login']);
  }

  getUser() {
    this._userService
      .getUser()
      .pipe(take(1))
      .subscribe({
        next: (_user: User[]) => {
          this.user = _user;
        },
        error: () => {
          // console.error('Erro ao obter usuário:', error);
        },
      });
  }

  getUsers() {
    this._userService
      .getUsers()
      .pipe(take(1))
      .subscribe({
        next: (_users: User[] = []) => {
          this.users = _users;
          console.log(this.users);
        },
        error: () => {
          // console.error('Erro ao obter usuário:', error);
        },
      });
  }
}
