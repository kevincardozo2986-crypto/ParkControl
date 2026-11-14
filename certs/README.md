# Certificado CA de Supabase

Descarga el certificado desde **Supabase → Project Settings → Database → SSL Configuration → Download certificate** y guárdalo aquí como:

```text
certs/prod-ca-2021.crt
```

Con el archivo presente, `src/config/database.js` usa TLS con `rejectUnauthorized: true`. Sin él, la conexión sigue cifrada pero sin verificar el servidor (se muestra una advertencia).

El certificado CA es público; aun así verifica su origen y vigencia.
