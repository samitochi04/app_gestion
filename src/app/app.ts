import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from './shared/ui/toast-host/toast-host';
import { ModalOutlet } from './shared/ui/modal/modal-outlet';

/**
 * Root shell. The router renders the active page here. Global overlays
 * (toasts, modals) are mounted once, above the router-outlet.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastHost, ModalOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
