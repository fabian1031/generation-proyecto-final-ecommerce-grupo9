export class User {
    constructor({ id, username, lastname, Rol, password, isActive }) {
        this.id = id;
        this.username = username;
        this.lastname = lastname;
        this.Rol = Rol;
        this.password = password;
        this.isActive = isActive;
    }
}