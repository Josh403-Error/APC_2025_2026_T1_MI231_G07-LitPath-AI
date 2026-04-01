#!/usr/bin/env python3
"""Run Django tests with automatic cleanup of stale PostgreSQL test DB sessions."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def run_command(
    command: list[str],
    *,
    check: bool = True,
    env_overrides: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    if env_overrides:
        env.update(env_overrides)

    return subprocess.run(
        command,
        cwd=PROJECT_ROOT,
        text=True,
        check=check,
        env=env,
    )


def _is_safe_db_name(name: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z0-9_]+", name))


def terminate_stale_test_db_sessions(test_db_name: str) -> None:
    if not _is_safe_db_name(test_db_name):
        print(f"Skipping session termination: unsafe test DB name '{test_db_name}'")
        return

    shell_code = (
        "from django.conf import settings\n"
        "from django.db import connection\n"
        "engine = settings.DATABASES['default']['ENGINE']\n"
        "if 'postgresql' not in engine:\n"
        "    print('Skipping session termination: non-PostgreSQL backend')\n"
        "else:\n"
        "    cursor = connection.cursor()\n"
        f"    cursor.execute(\"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{test_db_name}' AND pid <> pg_backend_pid();\")\n"
        f"    print('Terminated stale sessions for {test_db_name}')\n"
    )

    run_command(
        [sys.executable, 'manage.py', 'shell', '-c', shell_code],
        check=False,
        env_overrides={'TEST_DB_NAME': test_db_name},
    )


def drop_test_db_force(test_db_name: str) -> None:
    if not _is_safe_db_name(test_db_name):
        print(f"Skipping test DB drop: unsafe test DB name '{test_db_name}'")
        return

    shell_code = (
        "from django.conf import settings\n"
        "engine = settings.DATABASES['default']['ENGINE']\n"
        "if 'postgresql' not in engine:\n"
        "    print('Skipping test DB drop: non-PostgreSQL backend')\n"
        "else:\n"
        "    import psycopg2\n"
        "    cfg = settings.DATABASES['default']\n"
        "    conn = psycopg2.connect(\n"
        "        dbname='postgres',\n"
        "        user=cfg.get('USER'),\n"
        "        password=cfg.get('PASSWORD'),\n"
        "        host=cfg.get('HOST'),\n"
        "        port=cfg.get('PORT')\n"
        "    )\n"
        "    conn.autocommit = True\n"
        "    cur = conn.cursor()\n"
        f"    cur.execute(\"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE);\")\n"
        f"    print('Dropped {test_db_name}')\n"
    )

    run_command(
        [sys.executable, 'manage.py', 'shell', '-c', shell_code],
        check=False,
        env_overrides={'TEST_DB_NAME': test_db_name},
    )


def run_tests(label: str, keepdb: bool, test_db_name: str, extra_args: list[str]) -> int:
    command = [
        sys.executable,
        'manage.py',
        'test',
        label,
        '--verbosity',
        '2',
        '--noinput',
    ]

    if keepdb:
        command.append('--keepdb')

    command.extend(extra_args)

    result = run_command(
        command,
        check=False,
        env_overrides={'TEST_DB_NAME': test_db_name},
    )
    return result.returncode


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Run Django tests after terminating stale PostgreSQL test DB sessions.'
    )
    parser.add_argument(
        '--label',
        default='rag_api.tests.AuthRegisterHardeningTests',
        help='Django test label to run (default: rag_api.tests.AuthRegisterHardeningTests).',
    )
    parser.add_argument(
        '--test-db-name',
        default=os.getenv('TEST_DB_NAME', 'litpath_test_db'),
        help='Name of the test database used for tests and stale-session cleanup.',
    )
    parser.add_argument(
        '--no-keepdb',
        action='store_true',
        help='Run with keepdb for stability, then force-drop test DB after tests complete.',
    )
    parser.add_argument(
        'extra_args',
        nargs='*',
        help='Extra arguments passed through to manage.py test.',
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    terminate_stale_test_db_sessions(args.test_db_name)
    test_exit_code = run_tests(args.label, True, args.test_db_name, args.extra_args)
    if args.no_keepdb:
        terminate_stale_test_db_sessions(args.test_db_name)
        drop_test_db_force(args.test_db_name)
    return test_exit_code


if __name__ == '__main__':
    raise SystemExit(main())
