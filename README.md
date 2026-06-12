# Zata Lab Studio - Portafolio

Portafolio profesional para mostrar proyectos de desarrollo de software, automatizacion, APIs y aplicaciones moviles.

## Contenido

- Pagina estatica en HTML, CSS y JavaScript.
- Diseno responsive con estetica iOS/cyberpunk.
- Seccion de proyectos destacados.
- Formulario de contacto tipo mini-brief.
- Registro interno de solicitudes en Firestore.

## Ejecutar localmente

```bash
python3 -m http.server 4173
```

Luego abrir:

```text
http://localhost:4173
```

## Firestore y modo administrador

El formulario guarda solicitudes en Firestore para revisarlas desde el modo administrador.

1. Crea un proyecto en Firebase.
2. Activa Firestore.
3. Copia la configuracion web del proyecto en `firebase-config.js`.
4. Define una clave local en `ZATA_ADMIN_CODE`.
5. Publica los cambios.

La coleccion usada por defecto es:

```text
solicitudes_portafolio
```

Para abrir el panel administrador, presiona 5 veces el logo `Z`.

Desde el panel se pueden revisar solicitudes y cambiar su estado:

- `nuevo`
- `aprobado`
- `en_revision`
- `rechazado`

Tambien se pueden agregar notas internas para seguimiento.

Importante: el acceso oculto y la clave en el frontend no reemplazan reglas de seguridad reales. Para produccion, protege Firestore con reglas y autenticacion.
