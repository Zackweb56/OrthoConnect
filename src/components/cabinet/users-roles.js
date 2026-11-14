"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import {
  FieldError,
  generateStrongPassword,
  getFieldError,
  PasswordInput,
  RequiredLabel,
} from "@/components/shared/form-fields";
import {
  ConfirmDialog,
  ErrorBanner,
  LoadingState,
  Modal,
  RequiredFieldsNotice,
  apiRequest,
  notifyToast,
} from "@/components/owner/shared";

const emptyUserForm = { name: "", email: "", role: "", password: "" };
const emptyRoleForm = { name: "", permissionIds: [] };
const pageSize = 10;

export function UsersRolesManagement({ permissions, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [userDialog, setUserDialog] = useState(null);
  const [roleDialog, setRoleDialog] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userFieldErrors, setUserFieldErrors] = useState({});
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [roleFieldErrors, setRoleFieldErrors] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userSortBy, setUserSortBy] = useState("name");
  const [userSortDirection, setUserSortDirection] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [rolePage, setRolePage] = useState(1);
  const [roleSortBy, setRoleSortBy] = useState("name");
  const [roleSortDirection, setRoleSortDirection] = useState("asc");
  const [roleTypeFilter, setRoleTypeFilter] = useState("all");

  useEffect(() => {
    let active = true;
    const userQuery = new URLSearchParams({
      page: String(userPage),
      search: userSearch,
      sortBy: userSortBy,
      sortDirection: userSortDirection,
      status: statusFilter,
    });
    if (userRoleFilter) userQuery.set("role", userRoleFilter);

    const requests = [
      apiRequest(`/api/cabinet/users?${userQuery}`),
      permissions.canViewRoles
        ? apiRequest("/api/cabinet/roles")
        : Promise.resolve({ roles: [], permissions: [] }),
    ];
    Promise.all(requests)
      .then(([userData, roleData]) => {
        if (!active) return;
        setUsers(userData.users);
        setUserRoles(userData.roles);
        setUserTotal(userData.total);
        setRoles(roleData.roles);
        setAvailablePermissions(roleData.permissions);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    permissions.canViewRoles,
    refresh,
    statusFilter,
    userPage,
    userRoleFilter,
    userSearch,
    userSortBy,
    userSortDirection,
  ]);

  function reloadData() {
    setError("");
    setIsLoading(true);
    setRefresh((value) => value + 1);
  }

  function openCreateUser() {
    setError("");
    setUserFieldErrors({});
    setUserForm({ ...emptyUserForm, role: userRoles[0]?.name ?? "" });
    setUserDialog({ mode: "create", user: null });
  }

  function openEditUser(user) {
    setError("");
    setUserFieldErrors({});
    setUserForm({
      name: user.name,
      email: user.email ?? "",
      role: user.role,
      password: "",
    });
    setUserDialog({ mode: "edit", user });
  }

  async function saveUser(event) {
    event.preventDefault();
    setError("");
    setUserFieldErrors({});
    setIsSaving(true);
    try {
      if (userDialog.mode === "create") {
        await apiRequest("/api/cabinet/users", {
          method: "POST",
          body: JSON.stringify(userForm),
        });
        notifyToast("L’utilisateur a été invité.");
      } else {
        await apiRequest(`/api/cabinet/users/${userDialog.user.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: userForm.name,
            role: userForm.role,
          }),
        });
        notifyToast("L’utilisateur a été mis à jour.");
      }
      setUserDialog(null);
      setUserPage(1);
      reloadData();
    } catch (requestError) {
      setError(requestError.message);
      setUserFieldErrors(requestError.fieldErrors ?? {});
      notifyToast(requestError.message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleUserStatus(user) {
    if (
      user.role === "clinic_admin" ||
      user.id === currentUserId ||
      !permissions.canUpdateUsers
    ) {
      return;
    }
    setError("");
    setUpdatingUserId(user.id);
    try {
      await apiRequest(`/api/cabinet/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      notifyToast(
        user.isActive
          ? "L’accès de l’utilisateur a été désactivé."
          : "L’accès de l’utilisateur a été activé.",
      );
      setUserPage(1);
      reloadData();
    } catch (requestError) {
      setError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setUpdatingUserId(null);
    }
  }

  function openCreateRole() {
    setError("");
    setRoleFieldErrors({});
    setRoleForm(emptyRoleForm);
    setRoleDialog({ mode: "create", role: null });
  }

  function openEditRole(role) {
    setError("");
    setRoleFieldErrors({});
    setRoleForm({
      name: role.name,
      permissionIds: role.permissionIds,
    });
    setRoleDialog({ mode: "edit", role });
  }

  async function saveRole(event) {
    event.preventDefault();
    setError("");
    setRoleFieldErrors({});
    setIsSaving(true);
    try {
      const isEditing = roleDialog.mode === "edit";
      await apiRequest(
        isEditing
          ? `/api/cabinet/roles/${roleDialog.role.id}`
          : "/api/cabinet/roles",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(roleForm),
        },
      );
      notifyToast(isEditing ? "Le rôle a été mis à jour." : "Le rôle a été créé.");
      setRoleDialog(null);
      setRolePage(1);
      reloadData();
    } catch (requestError) {
      setError(requestError.message);
      setRoleFieldErrors(requestError.fieldErrors ?? {});
      notifyToast(requestError.message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setError("");
    setIsSaving(true);
    try {
      const endpoint =
        pendingDelete.type === "user"
          ? `/api/cabinet/users/${pendingDelete.item.id}`
          : `/api/cabinet/roles/${pendingDelete.item.id}`;
      await apiRequest(endpoint, { method: "DELETE" });
      notifyToast(
        pendingDelete.type === "user"
          ? "L’accès de l’utilisateur a été supprimé."
          : "Le rôle a été supprimé.",
      );
      setPendingDelete(null);
      if (pendingDelete.type === "role") setRolePage(1);
      else setUserPage(1);
      reloadData();
    } catch (requestError) {
      setError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  function togglePermission(permissionId) {
    setRoleForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((id) => id !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  }

  function togglePermissionGroup(groupPermissions) {
    setRoleForm((current) => {
      const groupIds = groupPermissions.map(({ id }) => id);
      const selected = new Set(current.permissionIds);
      const allSelected = groupIds.every((id) => selected.has(id));
      for (const id of groupIds) {
        if (allSelected) selected.delete(id);
        else selected.add(id);
      }
      return { ...current, permissionIds: [...selected] };
    });
  }

  function sortUsers(column) {
    setIsLoading(true);
    setUserSortDirection((direction) =>
      userSortBy === column && direction === "asc" ? "desc" : "asc",
    );
    setUserSortBy(column);
    setUserPage(1);
  }

  function sortRoles(column) {
    setRoleSortDirection((direction) =>
      roleSortBy === column && direction === "asc" ? "desc" : "asc",
    );
    setRoleSortBy(column);
    setRolePage(1);
  }

  const permissionGroups = availablePermissions.reduce((groups, permission) => {
    groups[permission.group] ??= [];
    groups[permission.group].push(permission);
    return groups;
  }, {});
  const visibleRoles = roles
    .filter((role) => {
      const matchesSearch = roleLabel(role.name)
        .toLocaleLowerCase("fr")
        .includes(roleSearch.trim().toLocaleLowerCase("fr"));
      const matchesType =
        roleTypeFilter === "all" ||
        (roleTypeFilter === "system" ? role.isSystem : !role.isSystem);
      return matchesSearch && matchesType;
    })
    .sort((left, right) => {
      const result =
        roleSortBy === "userCount"
          ? left.userCount - right.userCount
          : roleLabel(left.name).localeCompare(roleLabel(right.name), "fr");
      return roleSortDirection === "asc" ? result : -result;
    });
  const roleRows = visibleRoles.slice((rolePage - 1) * pageSize, rolePage * pageSize);

  const userColumns = [
    { key: "name", label: "Nom", sortable: true },
    { key: "email", label: "E-mail", sortable: true },
    {
      key: "role",
      label: "Rôle",
      sortable: true,
      render: (user) => <Badge variant="outline">{roleLabel(user.role)}</Badge>,
    },
    {
      key: "isActive",
      label: "Statut",
      sortable: true,
      render: (user) => {
        const protectedUser = user.role === "clinic_admin";
        return permissions.canUpdateUsers ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={user.isActive}
              aria-label={`${user.isActive ? "Désactiver" : "Activer"} l’accès de ${user.name}`}
              disabled={protectedUser || updatingUserId === user.id}
              title={
                protectedUser
                  ? "L’administrateur du cabinet est protégé"
                  : user.isActive
                    ? "Désactiver l’accès"
                    : "Activer l’accès"
              }
              onClick={() => toggleUserStatus(user)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                user.isActive ? "bg-success" : "bg-line"
              }`}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white transition-transform ${
                  user.isActive ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-xs text-muted">
              {user.isActive ? "Actif" : "Désactivé"}
            </span>
          </div>
        ) : (
          <Badge variant={user.isActive ? "success" : "secondary"}>
            {user.isActive ? "Actif" : "Désactivé"}
          </Badge>
        );
      },
    },
    ...((permissions.canUpdateUsers || permissions.canDeleteUsers)
      ? [
          {
            key: "actions",
            label: "Actions",
            render: (user) => (
              <div className="flex items-center gap-1">
                {permissions.canUpdateUsers && (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={`Modifier ${user.name}`}
                    title="Modifier"
                    onClick={() => openEditUser(user)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                )}
                {permissions.canDeleteUsers && (
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    disabled={user.role === "clinic_admin"}
                    aria-label={`Supprimer ${user.name}`}
                    title={
                      user.role === "clinic_admin"
                        ? "L’administrateur du cabinet est protégé"
                        : "Supprimer"
                    }
                    onClick={() =>
                      setPendingDelete({ type: "user", item: user })
                    }
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const roleColumns = [
    {
      key: "name",
      label: "Nom du rôle",
      sortable: true,
      render: (role) => (
        <div className="flex items-center gap-2 font-medium">
          <Shield className="size-4 text-muted" aria-hidden="true" />
          {roleLabel(role.name)}
          {role.isSystem && <Badge variant="outline">Système</Badge>}
        </div>
      ),
    },
    { key: "userCount", label: "Utilisateurs", sortable: true },
    ...(permissions.canManageRoles
      ? [
          {
            key: "actions",
            label: "Actions",
            render: (role) => (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={role.isSystem}
                  aria-label={`Modifier le rôle ${roleLabel(role.name)}`}
                  title={
                    role.isSystem
                      ? "Les rôles système ne peuvent pas être modifiés"
                      : "Modifier le rôle"
                  }
                  onClick={() => openEditRole(role)}
                >
                  <Pencil aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  disabled={role.isSystem}
                  aria-label={`Supprimer le rôle ${roleLabel(role.name)}`}
                  title={
                    role.isSystem
                      ? "Les rôles système ne peuvent pas être supprimés"
                      : role.userCount > 0
                        ? "Afficher pourquoi ce rôle ne peut pas être supprimé"
                        : "Supprimer le rôle"
                  }
                  onClick={() =>
                    setPendingDelete({ type: "role", item: role })
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (isLoading && !userTotal && !users.length && !roles.length) {
    return <LoadingState label="Chargement des utilisateurs…" />;
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold sm:text-2xl">Utilisateurs et rôles</h2>
        <p className="text-sm text-muted">
          Gérez les accès des membres et les permissions de votre cabinet.
        </p>
      </header>
      <ErrorBanner message={error} />

      {permissions.canViewRoles && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Rôles et permissions</CardTitle>
              <p className="mt-1 text-sm text-muted">
                Les rôles système ne peuvent pas être modifiés.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={isLoading}
                aria-label="Actualiser les rôles"
                title="Actualiser les rôles"
                onClick={reloadData}
              >
                <RefreshCw
                  className={isLoading ? "animate-spin" : ""}
                  aria-hidden="true"
                />
              </Button>
              {permissions.canManageRoles && (
                <Button type="button" onClick={openCreateRole}>
                  <Plus aria-hidden="true" />
                  Créer un rôle
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs space-y-2">
              <label htmlFor="role-type-filter" className="text-sm font-medium">
                Filtrer les rôles
              </label>
              <select
                id="role-type-filter"
                value={roleTypeFilter}
                onChange={(event) => {
                  setRoleTypeFilter(event.target.value);
                  setRolePage(1);
                }}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              >
                <option value="all">Tous les rôles</option>
                <option value="system">Rôles système</option>
                <option value="custom">Rôles personnalisés</option>
              </select>
            </div>
            <DataTable
              columns={roleColumns}
              rows={roleRows}
              total={visibleRoles.length}
              page={rolePage}
              pageSize={pageSize}
              search={roleSearch}
              sortBy={roleSortBy}
              sortDirection={roleSortDirection}
              isLoading={isLoading}
              emptyMessage="Aucun rôle ne correspond à la recherche."
              onSearch={(value) => {
                setRoleSearch(value);
                setRolePage(1);
              }}
              onSort={sortRoles}
              onPageChange={setRolePage}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Utilisateurs</CardTitle>
            <p className="mt-1 text-sm text-muted">
              Membres associés à ce cabinet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={isLoading}
              aria-label="Actualiser les utilisateurs"
              title="Actualiser les utilisateurs"
              onClick={reloadData}
            >
              <RefreshCw
                className={isLoading ? "animate-spin" : ""}
                aria-hidden="true"
              />
            </Button>
            {permissions.canCreateUsers && (
              <Button type="button" onClick={openCreateUser}>
                <UserPlus aria-hidden="true" />
                Inviter un utilisateur
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="user-status-filter" className="text-sm font-medium">
                Filtrer par statut
              </label>
              <select
                id="user-status-filter"
                value={statusFilter}
                onChange={(event) => {
                  setIsLoading(true);
                  setStatusFilter(event.target.value);
                  setUserPage(1);
                }}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Désactivés</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="user-role-filter" className="text-sm font-medium">
                Filtrer par rôle
              </label>
              <select
                id="user-role-filter"
                value={userRoleFilter}
                onChange={(event) => {
                  setIsLoading(true);
                  setUserRoleFilter(event.target.value);
                  setUserPage(1);
                }}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              >
                <option value="">Tous les rôles</option>
                {userRoles.map((role) => (
                  <option key={role.name} value={role.name}>
                    {roleLabel(role.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DataTable
            columns={userColumns}
            rows={users}
            total={userTotal}
            page={userPage}
            pageSize={pageSize}
            search={userSearch}
            sortBy={userSortBy}
            sortDirection={userSortDirection}
            isLoading={isLoading}
            emptyMessage="Aucun utilisateur associé à ce cabinet."
            onSearch={(value) => {
              setIsLoading(true);
              setUserSearch(value);
              setUserPage(1);
            }}
            onSort={sortUsers}
            onPageChange={(page) => {
              setIsLoading(true);
              setUserPage(page);
            }}
          />
        </CardContent>
      </Card>

      {userDialog && (
        <Modal
          title={
            userDialog.mode === "create"
              ? "Inviter un utilisateur"
              : `Modifier ${userDialog.user.name}`
          }
          onClose={() => !isSaving && setUserDialog(null)}
        >
          <form
            className="space-y-4"
            onSubmit={saveUser}
            noValidate
            onChange={() => {
              setError("");
              setUserFieldErrors({});
            }}
          >
            <RequiredFieldsNotice />
            <FormInput
              label="Nom complet"
              name="name"
              required
              placeholder="Ex. Salma El Amrani"
              value={userForm.name}
              onChange={updateField(setUserForm)}
              error={getFieldError(userFieldErrors, "name")}
            />
            {userDialog.mode === "create" && (
              <>
                <FormInput
                  label="Adresse e-mail"
                  name="email"
                  type="email"
                  required
                  placeholder="exemple@cabinet.ma"
                  value={userForm.email}
                  onChange={updateField(setUserForm)}
                  error={getFieldError(userFieldErrors, "email")}
                />
                <div className="space-y-2">
                  <RequiredLabel htmlFor="cabinet-user-password" required>
                    Mot de passe
                  </RequiredLabel>
                  <PasswordInput
                    id="cabinet-user-password"
                    value={userForm.password}
                    onChange={updateField(setUserForm, "password")}
                    aria-invalid={Boolean(
                      getFieldError(userFieldErrors, "password"),
                    )}
                    aria-describedby={
                      getFieldError(userFieldErrors, "password")
                        ? "cabinet-user-password-hint cabinet-user-password-error"
                        : "cabinet-user-password-hint"
                    }
                    onGenerate={() =>
                      setUserForm((current) => ({
                        ...current,
                        password: generateStrongPassword(),
                      }))
                    }
                    required
                    minLength={12}
                    autoComplete="new-password"
                    placeholder="12 caractères minimum"
                  />
                  <p id="cabinet-user-password-hint" className="text-xs text-muted">
                    12 caractères minimum, avec une minuscule, une majuscule, un
                    chiffre et un symbole (72 octets maximum).
                  </p>
                  <FieldError id="cabinet-user-password-error">
                    {getFieldError(userFieldErrors, "password")}
                  </FieldError>
                </div>
              </>
            )}
            <div className="space-y-2">
              <RequiredLabel htmlFor="cabinet-user-role" required>
                Rôle
              </RequiredLabel>
              <select
                id="cabinet-user-role"
                required
                value={userForm.role}
                disabled={userDialog.user?.role === "clinic_admin"}
                onChange={updateField(setUserForm, "role")}
                className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm disabled:opacity-60"
                aria-invalid={Boolean(getFieldError(userFieldErrors, "role"))}
                aria-describedby={
                  getFieldError(userFieldErrors, "role")
                    ? "cabinet-user-role-error"
                    : undefined
                }
              >
                <option value="">Sélectionner un rôle</option>
                {userRoles.map((role) => (
                  <option key={role.name} value={role.name}>
                    {roleLabel(role.name)}
                  </option>
                ))}
              </select>
              <FieldError id="cabinet-user-role-error">
                {getFieldError(userFieldErrors, "role")}
              </FieldError>
            </div>
            <ErrorBanner message={error} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => setUserDialog(null)}
              >
                <X aria-hidden="true" />
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Enregistrement…"
                  : userDialog.mode === "create"
                    ? "Inviter"
                    : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {roleDialog && (
        <Modal
          title={roleDialog.mode === "create" ? "Créer un rôle" : "Modifier un rôle"}
          onClose={() => !isSaving && setRoleDialog(null)}
        >
          <form
            className="space-y-4"
            onSubmit={saveRole}
            noValidate
            onChange={() => {
              setError("");
              setRoleFieldErrors({});
            }}
          >
            <RequiredFieldsNotice />
            <FormInput
              label="Identifiant du rôle"
              name="name"
              required
              pattern="[a-z][a-z0-9_]*"
              title="Minuscules, chiffres et _"
              placeholder="Ex. assistant_medical"
              value={roleForm.name}
              onChange={updateField(setRoleForm)}
              error={getFieldError(roleFieldErrors, "name")}
            />
            <div className="max-h-[45vh] space-y-3 overflow-y-auto rounded-lg border border-line p-3">
              {Object.entries(permissionGroups).map(([group, groupPermissions]) => {
                const allSelected = groupPermissions.every(({ id }) =>
                  roleForm.permissionIds.includes(id),
                );
                return (
                  <fieldset
                    key={group}
                    className="rounded-lg border border-line p-3"
                  >
                    <legend className="px-1 font-semibold">
                      {permissionGroupLabel(group)}
                    </legend>
                    <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => togglePermissionGroup(groupPermissions)}
                        className="size-4 accent-success"
                      />
                      Tout sélectionner
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {groupPermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={roleForm.permissionIds.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-0.5 size-4 accent-success"
                          />
                          <span>{permissionLabel(permission.name)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
            </div>
            <ErrorBanner message={error} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => setRoleDialog(null)}
              >
                <X aria-hidden="true" />
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {pendingDelete && (
        pendingDelete.type === "role" && pendingDelete.item.userCount > 0 ? (
          <Modal
            title="Suppression impossible"
            onClose={() => setPendingDelete(null)}
          >
            <div className="space-y-5">
              <p className="text-sm text-muted">
                Le rôle « {roleLabel(pendingDelete.item.name)} » est encore
                attribué à {pendingDelete.item.userCount} utilisateur
                {pendingDelete.item.userCount > 1 ? "s" : ""}. Réaffectez ces
                utilisateurs à un autre rôle avant de le supprimer.
              </p>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                >
                  Compris
                </Button>
              </div>
            </div>
          </Modal>
        ) : (
          <ConfirmDialog
            title={
              pendingDelete.type === "user"
                ? "Supprimer l’accès utilisateur"
                : "Supprimer le rôle"
            }
            description={
              pendingDelete.type === "user"
                ? `L’accès de ${pendingDelete.item.name} à ce cabinet sera supprimé.`
                : `Le rôle « ${roleLabel(pendingDelete.item.name)} » sera supprimé.`
            }
            confirmLabel="Supprimer"
            variant="destructive"
            onCancel={() => !isSaving && setPendingDelete(null)}
            onConfirm={confirmDelete}
            isLoading={isSaving}
          />
        )
      )}
    </section>
  );
}

function FormInput({
  label,
  name,
  onChange,
  required = false,
  error,
  ...props
}) {
  const id = `cabinet-form-${name}`;
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id} required={required}>
        {label}
      </RequiredLabel>
      <Input
        id={id}
        name={name}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

function updateField(setValue, fieldName) {
  return (event) => {
    const { name, value } = event.target;
    setValue((current) => ({ ...current, [fieldName || name]: value }));
  };
}

function roleLabel(role) {
  const labels = {
    clinic_admin: "Administrateur du cabinet",
    responsable: "Responsable",
  };
  return (
    labels[role] ??
    role
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function permissionGroupLabel(group) {
  const labels = { Users: "Utilisateurs", Roles: "Rôles", Clinic: "Cabinet" };
  return labels[group] ?? "Autres permissions";
}

function permissionLabel(permission) {
  const labels = {
    "users.view": "Consulter les utilisateurs",
    "users.create": "Inviter des utilisateurs",
    "users.update": "Modifier les utilisateurs",
    "users.delete": "Supprimer l’accès utilisateur",
    "roles.view": "Consulter les rôles",
    "roles.manage": "Gérer les rôles",
    "clinic.view": "Consulter le profil du cabinet",
    "clinic.update": "Modifier le profil du cabinet",
  };
  return labels[permission] ?? "Permission";
}
