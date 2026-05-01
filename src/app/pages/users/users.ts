import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/role.service';
import { User, Role } from '../../models/user.model';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-users',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class UsersComponent implements OnInit {
  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly showAssignModal = signal(false);
  protected readonly selectedUser = signal<User | null>(null);
  protected selectedRoleId = 0;

  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(getApiErrorMessage(err, 'Erreur lors du chargement des utilisateurs'));
        this.loading.set(false);
      }
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: (err) => {
        this.errorMessage.set(getApiErrorMessage(err, 'Erreur lors du chargement des rôles'));
      }
    });
  }

  openAssignRole(user: User): void {
    this.selectedUser.set(user);
    this.selectedRoleId = 0;
    this.showAssignModal.set(true);
    this.clearMessages();
  }

  cancelAssign(): void {
    this.showAssignModal.set(false);
    this.selectedUser.set(null);
    this.selectedRoleId = 0;
  }

  assignRole(): void {
    const user = this.selectedUser();
    if (!user || !this.selectedRoleId) return;

    this.loading.set(true);
    this.clearMessages();

    this.userService.assignRole(user.id, this.selectedRoleId).subscribe({
      next: () => {
        this.successMessage.set(`Rôle assigné à ${user.fullName} avec succès`);
        this.loading.set(false);
        this.cancelAssign();
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage.set(getApiErrorMessage(err, 'Erreur lors de l\'assignation du rôle'));
        this.loading.set(false);
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
