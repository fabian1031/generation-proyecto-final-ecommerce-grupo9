export class User {
    constructor(data) {
        // Mapear desde el backend (campos nuevos) a propiedades locales
        this.id = data.id;
        this.username = data.nombre || data.username;
        this.nombre = data.nombre;
        this.lastname = data.apellido || data.lastname;
        this.apellido = data.apellido;
        this.role = data.rol || data.role;
        this.rol = data.rol;
        this.email = data.email;
        this.password = data.password;
        this.isActive = data.activo !== undefined ? data.activo : data.isActive;
        this.activo = data.activo;
        
        // Campos adicionales
        this.tipoDocumento = data.tipoDocumento;
        this.numeroDocumento = data.numeroDocumento;
    }
}