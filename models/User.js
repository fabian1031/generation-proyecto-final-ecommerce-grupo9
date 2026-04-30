export class User {
    constructor({ id, username, lastname, role, email, password, isActive }) {
        this.id = id;
        this.username = username;
        this.lastname = lastname;
        this.role = role;
        this.email = email;
        this.password = password;
        this.isActive = isActive;
    }
}