import { Component, HostListener, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private _snackBar: MatSnackBar,
    private _authService: AuthService,
    private _router: Router
  ) {}

  async ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.maxLength(30)]],
    });

    let result = await this._authService.asycUserAuthentication();

    if (result) {
      this._router.navigate(['chat']);
    } else {
      this._router.navigate(['login']);
    }
  }

  login(): void {
    this._authService.login(this.loginForm.value);
  }

  openSnackBar(): void {
    this._snackBar.open('Complete all the fields correctly.', 'I understood!', {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      duration: 8000,
      panelClass: ['my'],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.login();
    } else {
      this.openSnackBar();
    }
  }
}
