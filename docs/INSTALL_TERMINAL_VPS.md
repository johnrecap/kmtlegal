# Install: Terminal VPS

Use this path for a fresh Ubuntu/Debian VPS where you have root or sudo.

## Requirements

- Ubuntu/Debian VPS.
- Domain DNS points to the VPS.
- Root or sudo terminal access.
- No existing panel needs to own Nginx/SSL/PostgreSQL.

## Planned Flow

1. Upload or clone the project.
2. Run:

```bash
sudo bash deploy/install/install.sh
```

3. Enter domain and TLS email.
4. Let the installer configure Node.js, PostgreSQL, Nginx, Certbot, systemd, env file, uploads, build, migrations, and seed.
5. Open the printed `/install?token=...` URL.
6. Create the first Super Admin without TOTP.
7. Lock the installer.
8. Run:

```bash
sudo kmt-legal-disable-installer
```

## Do Not Use This Path When

- aaPanel or cPanel already manages Nginx/SSL/processes and you want to keep using the panel.
- You do not have sudo/root.
- The host is shared cPanel.
