import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    ToastModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  providers: [MessageService],
})
export class RegisterComponent implements OnInit {
  protected hide = true;
  protected disableButton = false;
  protected registerForm!: FormGroup;
  protected listenDisableButton!: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}
  ngOnInit(): void {
    this.initForm();
    this.listenDisableButton = this.authService
      .getEventEmitter()
      .subscribe((value) => (this.disableButton = value));
  }

  usernameValidator(control: FormControl): { [key: string]: boolean } | null {
    // Expressão regular para verificar se o username contém espaços ou caracteres especiais
    const usernamePattern = /^[^\s@#%$#*!U@!]+$/;
    if (!usernamePattern.test(control.value)) {
      return { invalidUsername: true };
    }
    return null;
  }

  initForm() {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.maxLength(30)]],
      confirmPassword: ['', [Validators.required, Validators.maxLength(30)]],
      username: ['', [Validators.required, Validators.maxLength(30), this.usernameValidator]],
      firstName: ['', [Validators.required, Validators.maxLength(30)]],
      lastName: ['', [Validators.required, Validators.maxLength(30)]],
    });
  }

  async register() {
    const res = await this.authService.register(this.registerForm.value);
    if (res.error) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Alert',
        detail: res.error.msg,
        life: 3000,
      });
    }
    if (res.msg) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Successfully registered!',
        life: 3000,
      });
      this.registerForm.reset();
    }
  }

  async onSubmit() {
    const usernameControl = this.registerForm.get('username');
    if (usernameControl && usernameControl.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Alert',
        detail: `Username is invalid. Please ensure that it contains no spaces or special characters.`,
        life: 3000,
      });
      return;
    }

    if (!this.registerForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Alert',
        detail: `Please fill in all the required fields.`,
        life: 3000,
      });
      return;
    }
    if (this.registerForm.valid) {
      await this.register();
    }
  }
  goToLogin() {
    this.router.navigate(['login']);
  }
}
