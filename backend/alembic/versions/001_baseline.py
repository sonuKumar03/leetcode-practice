"""baseline - stamp existing schema

Revision ID: 001_baseline
Revises:
Create Date: 2026-10-22
"""
from typing import Sequence, Union

from alembic import op

revision: str = "001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing tables already created by Base.metadata.create_all().
    # This migration exists so Alembic has a baseline to build on.
    pass


def downgrade() -> None:
    pass
