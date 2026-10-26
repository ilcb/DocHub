#!/bin/bash
# ============================================================
# GitLab 迁移 · 服务器 A 一键备份打包脚本
# 用法：sudo bash gitlab-migrate-backup.sh [SKIP=registry,artifacts]
# 产物：
#   1) /var/opt/gitlab/backups/<时间戳>_<版本>_gitlab_backup.tar   数据备份
#   2) /tmp/gitlab-migrate/gitlab-config-<时间戳>.tar.gz          配置包（含 gitlab-secrets.json）
# ============================================================
set -euo pipefail

SKIP_OPTS="${1:-}"                # 可选：SKIP=registry,artifacts
OUT_DIR="/tmp/gitlab-migrate"     # 配置包输出目录
BACKUP_DIR="/var/opt/gitlab/backups"
DATE="$(date +%Y%m%d_%H%M%S)"

# ---------- 0. 前置检查 ----------
if [ "$(id -u)" -ne 0 ]; then
    echo "[错误] 请以 root 运行：sudo bash $0 [SKIP=...]" >&2
    exit 1
fi
if ! gitlab-ctl status >/dev/null 2>&1; then
    echo "[错误] GitLab 服务不可用，请先 gitlab-ctl start" >&2
    exit 1
fi

# ---------- 1. 版本确认 ----------
echo "===== [1/5] 版本确认 ====="
gitlab-rake gitlab:env:info 2>/dev/null | grep -E "Version|Edition" || true

# ---------- 2. 冻结写入 ----------
echo "===== [2/5] 冻结写入（停 puma/sidekiq，保留 postgres/redis）====="
gitlab-ctl stop puma
gitlab-ctl stop sidekiq
if ! gitlab-ctl status | grep -q "run: postgresql" || ! gitlab-ctl status | grep -q "run: redis"; then
    echo "[错误] postgresql/redis 未运行，备份无法进行" >&2
    exit 1
fi
gitlab-ctl status | grep -E "puma|sidekiq|postgresql|redis" || true

# ---------- 3. 创建数据备份 ----------
echo "===== [3/5] 创建数据备份 ====="
if [ -n "$SKIP_OPTS" ]; then
    echo "跳过非核心数据：$SKIP_OPTS"
    gitlab-backup create "$SKIP_OPTS"
else
    gitlab-backup create
fi

# ---------- 4. 打包配置与密钥 ----------
echo "===== [4/5] 打包配置与密钥（/etc/gitlab）====="
mkdir -p "$OUT_DIR"
tar -czvf "$OUT_DIR/gitlab-config-$DATE.tar.gz" /etc/gitlab

# ---------- 5. 完整性校验 ----------
echo "===== [5/5] 完整性校验 ====="
TAR="$OUT_DIR/gitlab-config-$DATE.tar.gz"
for key in "gitlab.rb$" "gitlab-secrets.json"; do
    if ! tar -tzf "$TAR" | grep -qE "$key"; then
        echo "[错误] 配置包缺少 $key，请检查 /etc/gitlab 后重新打包" >&2
        exit 1
    fi
done
echo "[OK] 配置包校验通过，关键文件如下："
tar -tzf "$TAR" | grep -E "gitlab.rb$|gitlab-secrets.json|/ssl/|ssh_host" | head -20

echo
echo "================ 备份产物清单 ================"
ls -lh "$BACKUP_DIR"/*_gitlab_backup.tar
ls -lh "$TAR"
echo
echo "下一步（传输到服务器 B）："
echo "  scp $BACKUP_DIR/*_gitlab_backup.tar $TAR root@<服务器B_IP>:/tmp/"
