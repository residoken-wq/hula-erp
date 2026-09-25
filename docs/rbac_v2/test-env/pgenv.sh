#!/usr/bin/env bash
# RBAC v2 local test DB (Git Bash on Windows). Postgres 15.18 portable ở C:\pg15, pg_restore 17 ở C:\pg17tools.
# Dùng:  bash docs/rbac_v2/test-env/pgenv.sh start|stop|status|reset
# reset = xoá DB, restore dump production 23/08, chạy sanitize.sql (BẮT BUỘC trước mỗi lần chạy thử seed)
set -e
PG=/c/pg15/pgsql/bin
RESTORE=/c/pg17tools/pgsql/bin/pg_restore.exe
DATA=/c/pg15/data
DUMP="$(cd "$(dirname "$0")/../../.." && pwd)/backups/dump-hula_db-202608232001.sql"
SANITIZE="$(cd "$(dirname "$0")" && pwd)/sanitize.sql"
export PGPASSWORD=hula_password
CONN="-h 127.0.0.1 -p 5432 -U hula_user"

case "$1" in
  start)  "$PG/pg_ctl.exe" -D "$DATA" -l /c/pg15/server.log -o "-p 5432" start ;;
  stop)   "$PG/pg_ctl.exe" -D "$DATA" stop ;;
  status) "$PG/pg_ctl.exe" -D "$DATA" status ;;
  reset)
    "$PG/dropdb.exe" $CONN --if-exists hula_db
    "$PG/createdb.exe" $CONN hula_db
    # Lỗi duy nhất được phép: 'unrecognized configuration parameter "transaction_timeout"' (dump tạo bằng pg_dump 17)
    "$RESTORE" $CONN -d hula_db --no-owner --no-privileges "$DUMP" || true
    "$PG/psql.exe" $CONN -d hula_db -v ON_ERROR_STOP=1 -q -f "$SANITIZE"
    "$PG/psql.exe" $CONN -d hula_db -At -c "select 'users='||count(*) from users" -c "select 'groups='||count(*) from user_groups" -c "select 'perms='||count(*) from group_permissions" -c "select 'sanitized='||value from system_configs where key='TEST_ENV_SANITIZED'"
    ;;
  *) echo "usage: $0 start|stop|status|reset"; exit 1 ;;
esac
