# Zata Lab Studio - Portafolio

Portafolio profesional para mostrar proyectos de desarrollo de software, automatizacion, APIs y aplicaciones moviles.

## Contenido

- Pagina estatica en HTML, CSS y JavaScript.
- Diseno responsive con estetica iOS/cyberpunk.
- Seccion de proyectos destacados.
- Formulario de contacto tipo mini-brief.
- Envio del formulario por WhatsApp con mensaje precargado.

## Ejecutar localmente

```bash
python3 -m http.server 4173
```

Luego abrir:

```text
http://localhost:4173
```

## Contacto por WhatsApp

El formulario arma un mensaje con la informacion del cliente y abre WhatsApp usando el numero configurado en `script.js`.

## Firestore y modo administrador

El formulario puede guardar solicitudes en Firestore antes de abrir WhatsApp.

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

Importante: el acceso oculto y la clave en el frontend no reemplazan reglas de seguridad reales. Para produccion, protege Firestore con reglas y autenticacion.
