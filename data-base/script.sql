BEGIN;

CREATE TABLE IF NOT EXISTS administradores (
    id_administrador SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(50) NOT NULL UNIQUE,
    genero VARCHAR(20),
    fecha_nacimiento DATE,
    activo BOOLEAN DEFAULT TRUE,
    modificado_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_admin
        FOREIGN KEY (modificado_por)
        REFERENCES administradores(id_administrador)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS productos (
    id_producto SERIAL PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    cantidad INT NOT NULL CHECK (cantidad >= 0),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),

    estado_pago VARCHAR(30)
    DEFAULT 'pendiente'
    CHECK (
        estado_pago IN (
            'pendiente',
            'pagado',
            'reembolsado',
            'fallido'
        )
    ),

    estado_pedido VARCHAR(30)
    DEFAULT 'pendiente'
    CHECK (
        estado_pedido IN (
            'pendiente',
            'confirmado',
            'enviado',
            'entregado',
            'cancelado'
        )
    ),

    direccion_envio TEXT NOT NULL,
    ciudad_envio VARCHAR(100) NOT NULL,

    CONSTRAINT fk_pedido_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id_detalle_pedido SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),

    subtotal DECIMAL(10,2)
    GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,

    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedidos(id_pedido)
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON DELETE RESTRICT
);

INSERT INTO administradores (email, password_hash)
VALUES
('admin1@techstore.com', 'hash_admin_123'),
('admin2@techstore.com', 'hash_admin_456'),
('admin3@techstore.com', 'hash_admin_789'),
('admin4@techstore.com', 'hash_admin_321'),
('admin5@techstore.com', 'hash_admin_654');

INSERT INTO categorias (nombre, descripcion)
VALUES
('CPUs', 'Procesadores para computadoras'),
('Motherboards', 'Tarjetas madre para PC'),
('GPUs', 'Tarjetas gráficas'),
('Laptops', 'Computadores portátiles'),
('Accesorios Gamer', 'Periféricos y accesorios gaming');

INSERT INTO usuarios
(
    nombre,
    apellido,
    email,
    tipo_documento,
    numero_documento,
    genero,
    fecha_nacimiento,
    activo,
    modificado_por
)
VALUES
('Juan', 'Pérez', 'juan.perez@mail.com', 'Cedula', '1001001001', 'Masculino', '1995-03-10', TRUE, 1),
('María', 'Gómez', 'maria.gomez@mail.com', 'Cedula', '1001001002', 'Femenino', '1998-07-21', TRUE, 2),
('Carlos', 'Ramírez', 'carlos.ramirez@mail.com', 'Cedula', '1001001003', 'Masculino', '1992-11-05', TRUE, 1),
('Laura', 'Fernández', 'laura.fernandez@mail.com', 'Pasaporte', '1001001004', 'Femenino', '2000-01-15', TRUE, 2),
('Andrés', 'Torres', 'andres.torres@mail.com', 'Cedula', '1001001005', 'Masculino', '2003-09-09', TRUE, 2);

INSERT INTO productos
(
    id_categoria,
    nombre,
    descripcion,
    precio,
    cantidad,
    image_url
)
VALUES
(1, 'AMD Ryzen 7 7800X3D', 'Procesador AMD Ryzen 8 núcleos 16 hilos', 1899.99, 15, 'https://example.com/ryzen7800x3d.jpg'),
(1, 'Intel Core i9-14900K', 'Procesador Intel 24 núcleos', 2599.99, 10, 'https://example.com/i914900k.jpg'),
(2, 'ASUS ROG STRIX B650-E', 'Motherboard AM5 DDR5 ATX', 1450.00, 12, 'https://example.com/b650e.jpg'),
(2, 'MSI MAG Z790 TOMAHAWK', 'Motherboard Intel Z790 DDR5', 1700.00, 8, 'https://example.com/z790.jpg'),
(3, 'NVIDIA RTX 4090', 'Tarjeta gráfica 24GB GDDR6X', 8999.99, 5, 'https://example.com/rtx4090.jpg'),
(3, 'AMD Radeon RX 7900 XTX', 'GPU AMD 24GB GDDR6', 6200.00, 7, 'https://example.com/7900xtx.jpg'),
(4, 'ASUS ROG Zephyrus G16', 'Laptop gamer RTX 4070 + Intel Ultra 9', 7200.00, 6, 'https://example.com/zephyrusg16.jpg'),
(4, 'Lenovo Legion Pro 5', 'Laptop Ryzen 9 + RTX 4060', 5800.00, 9, 'https://example.com/legion5.jpg'),
(5, 'Logitech G Pro X', 'Teclado mecánico gamer RGB', 650.00, 20, 'https://example.com/gprox.jpg'),
(5, 'Razer DeathAdder V3', 'Mouse gamer ergonómico', 320.00, 30, 'https://example.com/deathadderv3.jpg');

INSERT INTO pedidos
(
    id_usuario,
    total,
    estado_pago,
    estado_pedido,
    direccion_envio,
    ciudad_envio
)
VALUES
(1, 1899.99, 'pagado', 'enviado', 'Calle 10 #20-30', 'Bogota'),
(2, 8999.99, 'pagado', 'confirmado', 'Carrera 15 #45-12', 'Medellin'),
(3, 7200.00, 'pendiente', 'pendiente', 'Av. Siempre Viva 123', 'Cali'),
(4, 1450.00, 'pagado', 'entregado', 'Calle 8 #11-22', 'Barranquilla'),
(5, 5800.00, 'pendiente', 'confirmado', 'Carrera 50 #60-70', 'Cartagena');

INSERT INTO detalle_pedido
(
    id_pedido,
    id_producto,
    cantidad,
    precio_unitario
)
VALUES
(1, 1, 1, 1899.99),
(2, 5, 1, 8999.99),
(3, 7, 1, 7200.00),
(4, 3, 1, 1450.00),
(5, 8, 1, 5800.00);

COMMIT;