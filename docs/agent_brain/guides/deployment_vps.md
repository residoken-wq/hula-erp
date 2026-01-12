# Hula ERP - VPS Deployment Guide

This guide outlines the steps to set up a new VPS, authorize access to the private repository, and deploy the application using Docker.

## 1. Connect to VPS via SSH

Open your terminal (PowerShell or CMD on Windows, Terminal on Mac/Linux):
```bash
ssh root@<your_vps_ip>
# Enter password when prompted
```

## 2. Generate SSH Key for GitHub Access

To pull a **Private Repository**, we need to authenticate. The best way for servers is using an **SSH Deploy Key**.

1.  **Generate a new key pair on the VPS:**
    ```bash
    cd ~/.ssh
    ssh-keygen -t ed25519 -C "vps_deploy_key"
    # Press Enter for all prompts to save as default 'id_ed25519'
    ```

2.  **Display the Public Key:**
    ```bash
    cat ~/.ssh/id_ed25519.pub
    ```
    *Copy the entire output (starts with `ssh-ed25519 ...`).*

3.  **Add to GitHub:**
    *   Go to your Repository on GitHub -> **Settings** -> **Deploy keys**.
    *   Click **Add deploy key**.
    *   **Title**: `VPS Deploy Key` (or similar).
    *   **Key**: Paste the key you copied.
    *   **Rules**: Leave "Allow write access" **unchecked** (read-only is safer).
    *   Click **Add key**.

4.  **Test Connection:**
    ```bash
    ssh -T git@github.com
    # Type 'yes' to accept fingerprint.
    # You should see: "Hi <user/org>! You've successfully authenticated..."
    ```

## 3. Clone the Repository

Navigate to where you want the app (usually `/var/www` or `/opt`).

```bash
mkdir -p /var/www
cd /var/www

# Clone using SSH (Replace with your actual Repo URL)
git clone git@github.com:residoken-wq/hula-erp.git

cd hula-erp
```

## 4. Troubleshooting: "Permission denied (publickey)"

If you see `Permission denied (publickey)` when cloning, it means SSH is not using your key.

**Solution 1: Move key to default location**
If your key is named something else (e.g. `repo_key`) or in a different folder, move it:
```bash
# Make sure .ssh folder exists
mkdir -p ~/.ssh

# Move your key files (replace repo_key with your actual filename)
mv repo_key ~/.ssh/id_ed25519
mv repo_key.pub ~/.ssh/id_ed25519.pub

# Fix permissions (Critical!)
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

**Solution 2: Configure SSH to use custom key name**
If you want to keep your custom key name (e.g., `repo_key`):
1.  Move it to `~/.ssh/`:
    ```bash
    mv repo_key ~/.ssh/
    mv repo_key.pub ~/.ssh/
    chmod 600 ~/.ssh/repo_key
    ```
2.  Create/Edit `~/.ssh/config`:
    ```bash
    nano ~/.ssh/config
    ```
3.  Add these lines:
    ```
    Host github.com
      IdentityFile ~/.ssh/repo_key
    ```
4.  Save (Ctrl+O, Enter) and Exit (Ctrl+X).

## 5. Install Docker & Docker Compose

If your VPS is fresh (Ubuntu/Debian), install Docker:

```bash
# Update repo
apt-get update

# Install curl
apt-get install -y curl

# Install Docker (Convenience Script)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify
docker --version
docker compose version
```

## 6. Environment Setup

1.  **Create `.env` file:**
    Copy your local `.env` content.
    ```bash
    nano .env
    # Paste your environment variables (DB_PASSWORD, keys, etc.)
    # Press Ctrl+O, Enter to save. Ctrl+X to exit.
    ```
    *Make sure variables like `DB_HOST=hula_db` match your docker-compose service names.*

2.  **Create Network (If needed):**
    If your `docker-compose.yml` uses an external network (e.g., `proxy_net`), create it:
    ```bash
    docker network create proxy_net
    ```

## 7. Build and Start

```bash
# Build and start in detached mode
docker compose up -d --build
```

## 8. Useful Commands

*   **Check Logs:**
    ```bash
    docker compose logs -f --tail=100
    ```
*   **Update Code:**
    ```bash
    git pull origin main
    docker compose up -d --build
    ```
*   **Restart Specific Service:**
    ```bash
    docker compose restart app
    ```
