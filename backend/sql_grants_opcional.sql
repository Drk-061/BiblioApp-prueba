-- OPCIONAL: ejecuta como usuario DBA si deseas evitar conectar Node.js como root.
-- Reemplaza la contraseña y el nombre del esquema por los tuyos.
-- Ajusta el host si tu instalación conecta mediante 127.0.0.1.
CREATE USER IF NOT EXISTS 'biblioapp_api'@'localhost' IDENTIFIED BY 'ELIGE_PASSWORD_LARGO_SEGURO';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON `biblioapp_pruebas_20261030`.* TO 'biblioapp_api'@'localhost';
-- Para despliegue, revisa los permisos de forma más granular.
