import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Friends } from '../models/friends.model';

@Injectable({
  providedIn: 'root',
})

export class UserService {
  private urlApi = `${environment.url}`;
  private userSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  constructor(public authService: AuthService, private http: HttpClient) {}

  User$() {
    return this.userSubject.asObservable();
  }

  changeUser(user: User) {
    this.userSubject.next(user);
  }

  getUser(): Observable<User[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);

    return this.http.get<User[]>(`${this.urlApi}/user/auth`, { headers });
  }

  getUsers(): Observable<User[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);

    return this.http.get<User[]>(`${this.urlApi}/users`, { headers });
  }

  getFriends(): Observable<Friends[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);

    return this.http.get<Friends[]>(`${this.urlApi}/friends`, { headers });
  }
}
