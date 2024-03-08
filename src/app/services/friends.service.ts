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
export class FriendsService {
  private urlApi = `${environment.url}`;

  constructor(public authService: AuthService, private http: HttpClient) {}

  getFriends(): Observable<Friends[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);

    return this.http.get<Friends[]>(`${this.urlApi}/friends`, { headers });
  }

  searchUser(username: string): Observable<Friends[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);

    return this.http.get<Friends[]>(`${this.urlApi}/friends/${username}`, {
      headers,
    });
  }

  sendFriendRequest(friendUserId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);
    const body = { friendUserId: friendUserId };
    return this.http.post(`${this.urlApi}/friends`, body, { headers });
  }

  removeFriendRequest(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);

    return this.http.delete(`${this.urlApi}/friends/${id}`, { headers });
  }

  acceptFriendship(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${token}`);

    return this.http.put(`${this.urlApi}/friends`, {friendshipId: id}, { headers });
  }
}
