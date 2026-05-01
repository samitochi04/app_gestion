import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, JsonPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  protected readonly accessDenied = signal(false);

  constructor(
    protected readonly authService: AuthService,
    private readonly route: ActivatedRoute
  ) {
    this.route.queryParamMap.subscribe((params) => {
      this.accessDenied.set(params.get('accessDenied') === '1');
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
