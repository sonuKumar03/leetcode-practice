"""add last_active to sessions for sliding window expiry

Revision ID: 002_add_session_last_active
Revises: 001_baseline
Create Date: 2026-10-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_add_session_last_active"
down_revision: Union[str, None] = "001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sessions",
        sa.Column(
            "last_active",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    # Backfill existing rows so they don't immediately expire.
    op.execute("UPDATE sessions SET last_active = created_at WHERE last_active IS NULL")


def downgrade() -> None:
    op.drop_column("sessions", "last_active")
