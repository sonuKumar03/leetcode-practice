from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Problem(Base):
    __tablename__ = "problems"

    id = Column(String, primary_key=True)
    title = Column(Text, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    difficulty = Column(String, default="Unknown")
    paid_only = Column(Integer, default=0)
    leetcode_url = Column(Text)
    doocs_url = Column(Text)
    source = Column(String, default="doocs")
    frequency = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tags = relationship("Tag", secondary="problem_tags", back_populates="problems", lazy="select")
    tracking_entries = relationship("UserTracking", back_populates="problem", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("difficulty IN ('Easy', 'Medium', 'Hard', 'Unknown')", name="ck_problems_difficulty"),
        Index("idx_problems_difficulty", "difficulty"),
        Index("idx_problems_title", "title"),
        Index("idx_problems_slug", "slug"),
        Index("idx_problems_paid_only", "paid_only"),
        Index("idx_problems_diff_paid", "difficulty", "paid_only"),
        Index("idx_problems_frequency", frequency.desc()),
    )


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    type = Column(String, default="topic")

    problems = relationship("Problem", secondary="problem_tags", back_populates="tags", lazy="select")

    __table_args__ = (
        CheckConstraint("type IN ('topic', 'company', 'list')", name="ck_tags_type"),
        Index("idx_tags_slug", "slug"),
        Index("idx_tags_type", "type"),
    )


class ProblemTag(Base):
    __tablename__ = "problem_tags"

    problem_id = Column(String, ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    __table_args__ = (
        Index("idx_problem_tags_tag", "tag_id"),
        Index("idx_problem_tags_tag_problem", "tag_id", "problem_id"),
    )


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String, default="user", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    tracking_entries = relationship("UserTracking", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")

    __table_args__ = (
        Index("idx_sessions_user", "user_id"),
    )


class UserTracking(Base):
    __tablename__ = "user_tracking"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    problem_id = Column(String, ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True)
    status = Column(String, default="todo")
    is_starred = Column(Integer, default=0)
    notes = Column(Text, default="")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="tracking_entries")
    problem = relationship("Problem", back_populates="tracking_entries")

    __table_args__ = (
        CheckConstraint("status IN ('todo', 'in_progress', 'solved')", name="ck_user_tracking_status"),
        Index("idx_user_tracking_user", "user_id"),
        Index("idx_user_tracking_status", "user_id", "status"),
        Index("idx_user_tracking_starred", "user_id", "is_starred"),
        Index("idx_user_tracking_status_starred", "user_id", "status", "is_starred"),
        Index("idx_user_tracking_cover", "user_id", "problem_id", "status", "is_starred"),
    )
