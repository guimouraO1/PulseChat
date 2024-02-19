import { Component, Input, input } from '@angular/core';
import { MessagesInterface } from '../../models/messages.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent {
  @Input({ required: true })
  message!: MessagesInterface;
}
