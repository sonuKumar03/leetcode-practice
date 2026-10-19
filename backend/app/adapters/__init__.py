from app.adapters.base import RawProblemItem, BaseSourceAdapter
from app.adapters.registry import AdapterRegistry


def load_all_adapters() -> None:
    """Import every adapter module so each self-registers (catalog first: it supplies IDs)."""
    from app.adapters import (  # noqa: F401
        sources_catalog,
        sources_patterns,
        sources_company,
        sources_markdown,
    )


__all__ = ["RawProblemItem", "BaseSourceAdapter", "AdapterRegistry", "load_all_adapters"]
