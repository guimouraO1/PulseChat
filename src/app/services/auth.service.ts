import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { Subject, lastValueFrom, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  _isAuthenticated: boolean = false;
  private urlApi = `${environment.url}`;
  private disableButton = new Subject<boolean>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  async login(loginForm: {}) {
    console.log(true);
    this.disableButton.next(true);
    try {
      const res: any = await lastValueFrom(this.http.post(`${this.urlApi}/login`, loginForm).pipe(take(1)));
      this._isAuthenticated = true;
      localStorage.setItem('token', res.authToken);
      this.router.navigate(['chat']);
      this.openSnackBar('Login successful!', res.user.name);
    } catch (error: any) {
      this.openSnackBar(error.error.msg, '❌');
    } finally {
      this.disableButton.next(false);
    }
  }

  async asycUserAuthentication() {
    const authToken = localStorage.getItem('token');
    const headers = new HttpHeaders().set('authorization', `${authToken}`);
    try {
      await lastValueFrom(
        this.http.get(`${this.urlApi}/user/auth`, { headers }).pipe(take(1))
      );
      this._isAuthenticated = true;
      return true;
    } catch (e) {
      this._isAuthenticated = false;
      return false;
    }
  }

  async _isAuthUser(): Promise<boolean> {
    await this.asycUserAuthentication();
    return this._isAuthenticated;
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 2000,
      verticalPosition: 'top'     
    });
  }

  getEventEmitter() {
    return this.disableButton.asObservable();
  }

}
