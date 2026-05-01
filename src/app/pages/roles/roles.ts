import { Component, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoleService } from '../../services/role.service';
import { Role, Permission } from '../../models/user.model';
import { getApiErrorMessage } from '../../utils/http.util';

@Component({
  selector: 'app-roles',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class RolesComponent implements OnInit {
  protected readonly roles = signal<Role[]>([]);
  protected readonly permissions = signal<Permission[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly showForm = signal(false);
  protected readonly editingRole = signal<Role | null>(null);
  protected readonly selectedPermissions = signal<Set<string>>(new Set());

  roleForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly roleService: RoleService
  ) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(getApiErrorMessage(err, 'Erreur lors du chargement des rôles'));
        this.loading.set(false);
      }
    });
  }

  loadPermissions(): void {
    this.roleService.getPermissions().subscribe({
      next: (permissions) => this.permissions.set(permissions),
      error: (err) => this.errorMessage.set(getApiErrorMessage(err, 'Erreur lors du chargement des permissions'))
    });
  }

  togglePermission(permissionName: string): void {
    const current = new Set(this.selectedPermissions());
    if (current.has(permissionName)) {
      current.delete(permissionName);
    } else {
      current.add(permissionName);
    }
    this.selectedPermissions.set(current);
  }

  isPermissionSelected(permissionName: string): boolean {
    return this.selectedPermissions().has(permissionName);
  }

  openCreateForm(): void {
    this.editingRole.set(null);
    this.roleForm.reset();
    this.roleForm.get('name')?.enable();
    this.selectedPermissions.set(new Set());
    this.showForm.set(true);
    this.clearMessages();
  }

  openEditForm(role: Role): void {
    this.editingRole.set(role);
    this.roleForm.patchValue({ name: role.name, description: role.description });
    this.roleForm.get('name')?.disable();
    this.selectedPermissions.set(new Set(role.permissions));
    this.showForm.set(true);
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingRole.set(null);
    this.roleForm.reset();
    this.selectedPermissions.set(new Set());
  }

  onSubmit(): void {
    if (this.roleForm.invalid) return;

    this.loading.set(true);
    this.clearMessages();

    const permissions = Array.from(this.selectedPermissions());

    if (this.editingRole()) {
      const request = {
        description: this.roleForm.get('description')?.value,
        permissions
      };
      this.roleService.updateRole(this.editingRole()!.id, request).subscribe({
        next: () => {
          this.successMessage.set('Rôle modifié avec succès');
          this.loading.set(false);
          this.cancelForm();
          this.loadRoles();
        },
        error: (err) => {
          this.errorMessage.set(getApiErrorMessage(err, 'Erreur lors de la modification'));
          this.loading.set(false);
        }
      });
    } else {
      const request = {
        name: this.roleForm.get('name')?.value,
        description: this.roleForm.get('description')?.value,
        permissions
      };
      this.roleService.createRole(request).subscribe({
        next: () => {
          this.successMessage.set('Rôle créé avec succès');
          this.loading.set(false);
          this.cancelForm();
          this.loadRoles();
        },
        error: (err) => {
          this.errorMessage.set(getApiErrorMessage(err, 'Erreur lors de la création'));
          this.loading.set(false);
        }
      });
    }
  }

  deleteRole(role: Role): void {
    if (!confirm(`Supprimer le rôle "${role.name}" ?`)) return;

    this.loading.set(true);
    this.clearMessages();

    this.roleService.deleteRole(role.id).subscribe({
      next: () => {
        this.successMessage.set('Rôle supprimé avec succès');
        this.loading.set(false);
        this.loadRoles();
      },
      error: (err) => {
        this.errorMessage.set(getApiErrorMessage(err, 'Erreur lors de la suppression'));
        this.loading.set(false);
      }
    });
  }

  getPermissionModules(): string[] {
    const modules = new Set(this.permissions().map(p => p.module));
    return Array.from(modules);
  }

  getPermissionsByModule(module: string): Permission[] {
    return this.permissions().filter(p => p.module === module);
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
